import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { airwallexService } from './AirwallexService';

const prisma = new PrismaClient();

interface CreateWalletRequest {
  walletType: string;
  ownerId: string;
  ownerType: string;
}

interface DepositRequest {
  walletId: string;
  amount: number;
  currency: string;
  reference: string;
}

interface MilestoneDisbursementRequest {
  milestoneId: string;
  talentWalletId: string;
  buyerWalletId: string;
  amount: number;
  currency: string;
}

/**
 * MultiCurrencyLedgerService - Financial Operations Core
 * 
 * **THE REVENUE ENGINE**
 * 
 * This service powers VETTED's financial operations:
 * 1. Multi-currency wallet management (USD/NGN/EUR/GBP)
 * 2. Escrow fund locking
 * 3. Milestone disbursement with FX arbitrage
 * 4. Platform fee capture (15%)
 * 5. FX spread capture (0.5-1%)
 * 6. Treasury routing
 * 
 * Revenue Formula per $10k Milestone:
 * ──────────────────────────────────────
 * Milestone Value:    $10,000
 * Platform Fee (15%): $1,500
 * FX Spread (0.75%):  $75
 * ──────────────────────────────────────
 * TOTAL REVENUE:      $1,575 (15.75% margin)
 * Developer Receives: $8,425 NGN equivalent
 */
export class MultiCurrencyLedgerService {
  private readonly PLATFORM_FEE_PERCENT = 15; // 15%
  private readonly FX_SPREAD_PERCENT = 0.75;   // 0.75% (0.5-1% range)
  private readonly PLATFORM_TREASURY_ID = 'platform_treasury_001';

  /**
   * Create multi-currency wallet
   */
  async createWallet(request: CreateWalletRequest): Promise<any> {
    logger.info('Creating multi-currency wallet', {
      walletType: request.walletType,
      ownerId: request.ownerId,
    });

    try {
      // Create Airwallex wallet
      const airwallexWallet = await this.createAirwallexWallet(request);

      const wallet = await prisma.multiCurrencyWallet.create({
        data: {
          walletType: request.walletType as any,
          ownerId: request.ownerId,
          ownerType: request.ownerType,
          airwallexWalletId: airwallexWallet.id,
          status: 'ACTIVE',
        },
      });

      logger.info('Multi-currency wallet created', {
        walletId: wallet.id,
        airwallexWalletId: wallet.airwallexWalletId,
      });

      return wallet;
    } catch (error: any) {
      logger.error('Wallet creation failed', {
        error: error.message,
        request,
      });
      throw new Error(`Wallet creation failed: ${error.message}`);
    }
  }

  /**
   * Deposit funds into escrow wallet
   */
  async depositFunds(request: DepositRequest): Promise<any> {
    logger.info('Processing deposit', {
      walletId: request.walletId,
      amount: request.amount,
      currency: request.currency,
    });

    const wallet = await prisma.multiCurrencyWallet.findUnique({
      where: { id: request.walletId },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Create deposit transaction
    const transaction = await prisma.ledgerTransaction.create({
      data: {
        transactionType: 'DEPOSIT',
        status: 'COMPLETED',
        amount: request.amount,
        currency: request.currency,
        destinationWalletId: request.walletId,
        referenceId: request.reference,
        description: `Deposit ${request.currency} ${request.amount}`,
        processedAt: new Date(),
      },
    });

    // Update wallet balance
    await this.updateWalletBalance(
      request.walletId,
      request.currency,
      request.amount
    );

    logger.info('Deposit completed', {
      transactionId: transaction.id,
      walletId: request.walletId,
    });

    return transaction;
  }

  /**
   * Lock funds for milestone escrow
   */
  async lockMilestoneFunds(
    walletId: string,
    milestoneId: string,
    amount: number,
    currency: string
  ): Promise<void> {
    logger.info('Locking milestone funds', {
      walletId,
      milestoneId,
      amount,
      currency,
    });

    const wallet = await prisma.multiCurrencyWallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Check sufficient balance
    const balance = this.getWalletBalanceByCurrency(wallet, currency);
    if (balance < amount) {
      throw new Error('Insufficient funds');
    }

    // Create lock transaction
    await prisma.ledgerTransaction.create({
      data: {
        transactionType: 'MILESTONE_LOCK',
        status: 'COMPLETED',
        amount,
        currency,
        sourceWalletId: walletId,
        milestoneId,
        description: `Locked funds for milestone ${milestoneId}`,
        processedAt: new Date(),
      },
    });

    // Move funds from available to reserved
    await this.reserveFunds(walletId, currency, amount);

    logger.info('Milestone funds locked', {
      walletId,
      milestoneId,
      amount,
    });
  }

  /**
   * Disburse milestone payment with FX arbitrage and fee capture
   * 
   * THIS IS THE CORE REVENUE GENERATION FUNCTION
   */
  async disburseMilestonePayment(
    request: MilestoneDisbursementRequest
  ): Promise<any> {
    logger.info('Disbursing milestone payment with revenue capture', {
      milestoneId: request.milestoneId,
      amount: request.amount,
      currency: request.currency,
    });

    try {
      const milestone = await prisma.milestone.findUnique({
        where: { id: request.milestoneId },
        include: {
          user: true,
          contract: {
            include: {
              airwallexAccount: true,
            },
          },
        },
      });

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      // ===================================================================
      // STEP 1: Calculate Revenue Components
      // ===================================================================

      const milestoneAmount = request.amount;
      const platformFeeAmount = milestoneAmount * (this.PLATFORM_FEE_PERCENT / 100);
      const netToTalent = milestoneAmount - platformFeeAmount;

      // FX conversion (USD → NGN)
      const destCurrency = 'NGN';
      const marketFxRate = await this.getMarketFxRate('USD', destCurrency);
      const vettedFxRate = marketFxRate * (1 - this.FX_SPREAD_PERCENT / 100);
      const talentReceivesNGN = netToTalent * vettedFxRate;
      const fxSpreadAmount = netToTalent * marketFxRate - talentReceivesNGN;

      logger.info('Revenue breakdown calculated', {
        milestoneAmount,
        platformFeeAmount,
        netToTalent,
        marketFxRate,
        vettedFxRate,
        talentReceivesNGN,
        fxSpreadAmount,
        totalRevenue: platformFeeAmount + fxSpreadAmount,
      });

      // ===================================================================
      // STEP 2: Execute Talent Payout
      // ===================================================================

      const talentPayoutResult = await airwallexService.initiatePayout({
        airwallexAccountId: milestone.contract.airwallexAccount!.airwallexAccountId,
        beneficiaryBankAccount: milestone.contract.airwallexAccount!.bankAccountNumber!,
        beneficiaryName: `${milestone.user.firstName} ${milestone.user.lastName}`,
        amountUSD: netToTalent,
        currency: destCurrency,
        reference: `MILESTONE_${request.milestoneId}`,
        milestoneId: request.milestoneId,
      });

      // Create talent payout transaction
      const talentTransaction = await prisma.ledgerTransaction.create({
        data: {
          transactionType: 'TALENT_PAYOUT',
          status: 'COMPLETED',
          amount: netToTalent,
          currency: 'USD',
          sourceWalletId: request.buyerWalletId,
          destinationWalletId: request.talentWalletId,
          fxSourceCurrency: 'USD',
          fxSourceAmount: netToTalent,
          fxDestCurrency: destCurrency,
          fxDestAmount: talentReceivesNGN,
          fxRate: vettedFxRate,
          milestoneId: request.milestoneId,
          airwallexPayoutId: talentPayoutResult.payoutId,
          description: `Milestone payout to ${milestone.user.email}`,
          processedAt: new Date(),
        },
      });

      logger.info('Talent payout executed', {
        transactionId: talentTransaction.id,
        payoutId: talentPayoutResult.payoutId,
        amountUSD: netToTalent,
        amountNGN: talentReceivesNGN,
      });

      // ===================================================================
      // STEP 3: Capture Platform Fee (15%)
      // ===================================================================

      const platformFeeTransaction = await prisma.ledgerTransaction.create({
        data: {
          transactionType: 'PLATFORM_FEE',
          status: 'COMPLETED',
          amount: platformFeeAmount,
          currency: 'USD',
          sourceWalletId: request.buyerWalletId,
          platformFeePercent: this.PLATFORM_FEE_PERCENT,
          platformFeeAmount,
          milestoneId: request.milestoneId,
          description: `Platform fee (${this.PLATFORM_FEE_PERCENT}%) for milestone ${request.milestoneId}`,
          processedAt: new Date(),
        },
      });

      // Route to treasury
      await this.routeToTreasury(platformFeeAmount, 'USD', 'PLATFORM_FEE');

      // Record revenue
      await prisma.revenueEntry.create({
        data: {
          revenueStream: 'PLATFORM_FEE',
          amount: platformFeeAmount,
          currency: 'USD',
          milestoneId: request.milestoneId,
          transactionId: platformFeeTransaction.id,
          recognizedAt: new Date(),
          settledAt: new Date(),
        },
      });

      logger.info('Platform fee captured', {
        transactionId: platformFeeTransaction.id,
        amount: platformFeeAmount,
      });

      // ===================================================================
      // STEP 4: Capture FX Spread (0.75%)
      // ===================================================================

      const fxSpreadTransaction = await prisma.ledgerTransaction.create({
        data: {
          transactionType: 'FX_SPREAD_CAPTURE',
          status: 'COMPLETED',
          amount: fxSpreadAmount,
          currency: 'USD',
          fxSourceCurrency: 'USD',
          fxSourceAmount: netToTalent,
          fxDestCurrency: destCurrency,
          fxDestAmount: talentReceivesNGN,
          fxRate: vettedFxRate,
          fxSpreadRate: this.FX_SPREAD_PERCENT,
          fxSpreadAmount,
          milestoneId: request.milestoneId,
          description: `FX spread capture (${this.FX_SPREAD_PERCENT}%) on USD→NGN conversion`,
          processedAt: new Date(),
        },
      });

      // Route to treasury
      await this.routeToTreasury(fxSpreadAmount, 'USD', 'FX_SPREAD');

      // Record revenue
      await prisma.revenueEntry.create({
        data: {
          revenueStream: 'FX_SPREAD',
          amount: fxSpreadAmount,
          currency: 'USD',
          milestoneId: request.milestoneId,
          transactionId: fxSpreadTransaction.id,
          recognizedAt: new Date(),
          settledAt: new Date(),
        },
      });

      logger.info('FX spread captured', {
        transactionId: fxSpreadTransaction.id,
        amount: fxSpreadAmount,
        spreadPercent: this.FX_SPREAD_PERCENT,
      });

      // ===================================================================
      // STEP 5: Update Milestone Status
      // ===================================================================

      await prisma.milestone.update({
        where: { id: request.milestoneId },
        data: {
          status: 'PAID',
          payoutCompletedAt: new Date(),
          airwallexPayoutId: talentPayoutResult.payoutId,
        },
      });

      // Release reserved funds
      await this.releaseReservedFunds(
        request.buyerWalletId,
        request.currency,
        request.amount
      );

      // ===================================================================
      // RETURN DISBURSEMENT SUMMARY
      // ===================================================================

      const summary = {
        success: true,
        milestoneId: request.milestoneId,
        disbursement: {
          talentReceivesUSD: netToTalent,
          talentReceivesNGN: talentReceivesNGN,
          payoutId: talentPayoutResult.payoutId,
        },
        revenue: {
          platformFee: platformFeeAmount,
          fxSpread: fxSpreadAmount,
          totalRevenue: platformFeeAmount + fxSpreadAmount,
          revenuePercent: ((platformFeeAmount + fxSpreadAmount) / milestoneAmount) * 100,
        },
        transactions: {
          talentPayout: talentTransaction.id,
          platformFee: platformFeeTransaction.id,
          fxSpread: fxSpreadTransaction.id,
        },
      };

      logger.info('Milestone disbursement completed', summary);

      return summary;
    } catch (error: any) {
      logger.error('Milestone disbursement failed', {
        error: error.message,
        milestoneId: request.milestoneId,
      });
      throw new Error(`Disbursement failed: ${error.message}`);
    }
  }

  /**
   * Route revenue to platform treasury
   */
  private async routeToTreasury(
    amount: number,
    currency: string,
    source: string
  ): Promise<void> {
    // Get or create treasury wallet
    let treasury = await prisma.multiCurrencyWallet.findFirst({
      where: {
        walletType: 'PLATFORM_TREASURY',
        ownerId: this.PLATFORM_TREASURY_ID,
      },
    });

    if (!treasury) {
      treasury = await this.createWallet({
        walletType: 'PLATFORM_TREASURY',
        ownerId: this.PLATFORM_TREASURY_ID,
        ownerType: 'PLATFORM',
      });
    }

    // Update treasury balance
    await this.updateWalletBalance(treasury.id, currency, amount);

    logger.info('Revenue routed to treasury', {
      amount,
      currency,
      source,
      treasuryWalletId: treasury.id,
    });
  }

  /**
   * Get market FX rate (mock - integrate real FX API)
   */
  private async getMarketFxRate(
    sourceCurrency: string,
    destCurrency: string
  ): Promise<number> {
    // TODO: Integrate real-time FX API (e.g., XE, OANDA, or Airwallex rates)
    
    const rates: Record<string, number> = {
      'USD_NGN': 1560, // 1 USD = 1560 NGN
      'USD_EUR': 0.92,
      'USD_GBP': 0.79,
    };

    const key = `${sourceCurrency}_${destCurrency}`;
    return rates[key] || 1;
  }

  /**
   * Update wallet balance
   */
  private async updateWalletBalance(
    walletId: string,
    currency: string,
    amount: number
  ): Promise<void> {
    const field = `balance${currency}` as any;

    await prisma.multiCurrencyWallet.update({
      where: { id: walletId },
      data: {
        [field]: { increment: amount },
      },
    });
  }

  /**
   * Reserve funds (move from available to reserved)
   */
  private async reserveFunds(
    walletId: string,
    currency: string,
    amount: number
  ): Promise<void> {
    const balanceField = `balance${currency}` as any;
    const reservedField = `reserved${currency}` as any;

    await prisma.multiCurrencyWallet.update({
      where: { id: walletId },
      data: {
        [balanceField]: { decrement: amount },
        [reservedField]: { increment: amount },
      },
    });
  }

  /**
   * Release reserved funds
   */
  private async releaseReservedFunds(
    walletId: string,
    currency: string,
    amount: number
  ): Promise<void> {
    const reservedField = `reserved${currency}` as any;

    await prisma.multiCurrencyWallet.update({
      where: { id: walletId },
      data: {
        [reservedField]: { decrement: amount },
      },
    });
  }

  /**
   * Get wallet balance by currency
   */
  private getWalletBalanceByCurrency(wallet: any, currency: string): number {
    const field = `balance${currency}`;
    return wallet[field] || 0;
  }

  /**
   * Create Airwallex wallet (mock)
   */
  private async createAirwallexWallet(request: any): Promise<any> {
    // TODO: Actual Airwallex wallet creation
    return {
      id: `awx_${Date.now()}`,
      status: 'ACTIVE',
    };
  }

  /**
   * Get treasury snapshot
   */
  async getTreasurySnapshot(): Promise<any> {
    const treasury = await prisma.multiCurrencyWallet.findFirst({
      where: {
        walletType: 'PLATFORM_TREASURY',
      },
    });

    if (!treasury) {
      return null;
    }

    // Calculate MTD revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const mtdRevenue = await prisma.revenueEntry.aggregate({
      where: {
        recognizedAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const platformFeesMTD = await prisma.revenueEntry.aggregate({
      where: {
        revenueStream: 'PLATFORM_FEE',
        recognizedAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    const fxSpreadMTD = await prisma.revenueEntry.aggregate({
      where: {
        revenueStream: 'FX_SPREAD',
        recognizedAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    return {
      treasury,
      totalUSD: treasury.balanceUSD,
      totalNGN: treasury.balanceNGN,
      totalRevenueMTD: mtdRevenue._sum.amount || 0,
      platformFeesMTD: platformFeesMTD._sum.amount || 0,
      fxSpreadMTD: fxSpreadMTD._sum.amount || 0,
    };
  }
}

export const multiCurrencyLedgerService = new MultiCurrencyLedgerService();
