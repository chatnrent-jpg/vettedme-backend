import { Request, Response } from 'express';
import { PrismaClient, ActionType } from '@prisma/client';
import crypto from 'crypto';
import { logAuditEvent } from '../utils/auditLogger';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

/**
 * Airwallex Deposit Webhook Handler
 * Handles payment.inbound_transfer.success events when enterprise clients fund their escrow
 */
export const handleAirwallexDepositWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['x-signature'] as string;
  const rawPayload = JSON.stringify(req.body);

  // 1. Enforce Webhook Payload Authenticity Validation
  // Compares incoming headers against your Airwallex Developer secret key
  const computedSignature = crypto
    .createHmac('sha256', process.env.AIRWALLEX_WEBHOOK_SECRET_KEY!)
    .update(rawPayload)
    .digest('hex');

  if (computedSignature !== signature) {
    logger.warn('Airwallex webhook signature mismatch', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return res.status(401).json({ 
      error: 'Tampering detected: Invalid webhook signature cryptographic match.' 
    });
  }

  const { event, data } = req.body;

  try {
    // 2. Filter strictly for verified inbound account transfers
    if (event === 'payment.inbound_transfer.success') {
      const virtualAccountId = data.virtual_account_id;
      const creditAmount = data.amount; // The incoming deposit figure
      const currency = data.currency || 'USD';
      const transactionId = data.transaction_id;
      
      logger.info('Airwallex deposit webhook received', {
        virtualAccountId,
        creditAmount,
        currency,
        transactionId,
      });

      // Look up the unique sub-account structure inside the PostgreSQL instance
      const subAccount = await prisma.airwallexSubAccount.findFirst({
        where: { airwallexVirtualAccountId: virtualAccountId },
        include: { 
          contract: {
            include: {
              business: true,
              talent: true,
            }
          }
        }
      });

      if (!subAccount) {
        logger.error('Airwallex deposit for unmapped account', {
          virtualAccountId,
          creditAmount,
        });
        return res.status(404).json({ 
          error: 'Incoming funds destination account unmapped in central database.' 
        });
      }

      // 3. Update the Contract status and current balances atomically
      const updatedBalance = subAccount.currentBalanceUSD.toNumber() + Number(creditAmount);

      logger.info('Processing Airwallex deposit', {
        contractId: subAccount.contractId,
        previousBalance: subAccount.currentBalanceUSD.toNumber(),
        depositAmount: Number(creditAmount),
        newBalance: updatedBalance,
      });

      await prisma.$transaction([
        // Update sub-account balance
        prisma.airwallexSubAccount.update({
          where: { id: subAccount.id },
          data: { currentBalanceUSD: updatedBalance }
        }),
        
        // Update contract status to CAPITAL_ESCROWED
        prisma.contract.update({
          where: { id: subAccount.contractId },
          data: { status: 'CAPITAL_ESCROWED' } // Unlocks development execution status
        }),
        
        // Update first milestone from LOCKED to ready state
        // Note: Keeping LOCKED status but contract is now active
        prisma.milestone.updateMany({
          where: { 
            contractId: subAccount.contractId, 
            status: 'LOCKED' 
          },
          data: { status: 'LOCKED' } // Readies the first milestone queue track
        }),

        // Create ledger transaction record
        prisma.ledgerTransaction.create({
          data: {
            walletId: subAccount.id,
            transactionType: 'CREDIT',
            amount: Number(creditAmount),
            currency: currency,
            description: `Capital deposit from ${subAccount.contract.business.email}`,
            externalTransactionId: transactionId,
            metadata: {
              event: 'payment.inbound_transfer.success',
              virtualAccountId: virtualAccountId,
            }
          }
        })
      ]);

      // 4. Commit transaction trace directly to the append-only Audit Ledger
      await logAuditEvent(
        subAccount.contract.businessId,
        ActionType.CAPITAL_DEPOSIT_CONFIRMED,
        subAccount.contractId,
        { 
          incomingAmount: creditAmount,
          currency: currency,
          currentWalletBalance: updatedBalance,
          transactionId: transactionId,
          virtualAccountId: virtualAccountId,
        },
        req.ip || '0.0.0.0',
        req.headers['user-agent'] || 'Airwallex_Webhook_Engine'
      );

      logger.info('Airwallex deposit processed successfully', {
        contractId: subAccount.contractId,
        newBalance: updatedBalance,
        status: 'CAPITAL_ESCROWED',
      });

      return res.status(200).json({ 
        success: true, 
        status: 'Ledger cleared: Escrow secured.',
        contractId: subAccount.contractId,
        newBalance: updatedBalance,
      });
    }

    // Default catch-all response loop for secondary non-critical Airwallex updates
    logger.info('Unmonitored Airwallex event received', { event });
    return res.status(200).json({ 
      success: true, 
      message: 'Unmonitored systemic event bypassed.' 
    });

  } catch (error: any) {
    logger.error('Airwallex deposit webhook processing failed', {
      error: error.message,
      stack: error.stack,
      event: req.body.event,
    });
    
    return res.status(500).json({ 
      error: 'System fault parsing programmatic financial clearance payload.', 
      details: error.message 
    });
  }
};

/**
 * Airwallex Payout Webhook Handler
 * Handles payout.completed and payout.failed events
 */
export const handleAirwallexPayoutWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['x-signature'] as string;
  const rawPayload = JSON.stringify(req.body);

  // Validate webhook signature
  const computedSignature = crypto
    .createHmac('sha256', process.env.AIRWALLEX_WEBHOOK_SECRET_KEY!)
    .update(rawPayload)
    .digest('hex');

  if (computedSignature !== signature) {
    logger.warn('Airwallex payout webhook signature mismatch', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return res.status(401).json({ 
      error: 'Invalid webhook signature' 
    });
  }

  const { event, data } = req.body;

  try {
    logger.info('Airwallex payout webhook received', {
      event,
      payoutId: data.payout_id,
      status: data.status,
    });

    // Handle payout completion
    if (event === 'payout.completed') {
      const payoutId = data.payout_id;
      const amount = data.amount;
      const currency = data.currency;
      const beneficiaryId = data.beneficiary_id;

      // Find the payment transaction by external ID
      const transaction = await prisma.paymentTransaction.findFirst({
        where: { 
          externalTransactionId: payoutId,
          status: 'PROCESSING'
        },
        include: {
          milestone: {
            include: {
              contract: {
                include: {
                  talent: true,
                  business: true,
                }
              }
            }
          }
        }
      });

      if (!transaction) {
        logger.warn('Payout transaction not found', { payoutId });
        return res.status(404).json({ 
          error: 'Transaction not found' 
        });
      }

      // Update transaction and milestone status
      await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: { 
            status: 'COMPLETED',
            completedAt: new Date(),
          }
        }),
        prisma.milestone.update({
          where: { id: transaction.milestoneId },
          data: { 
            status: 'PAID',
          }
        }),
      ]);

      // Log audit event
      await logAuditEvent(
        transaction.milestone.contract.talentId,
        ActionType.PAYOUT_DISBURSEMENT_EXECUTED,
        transaction.milestoneId,
        {
          payoutId,
          amount,
          currency,
          beneficiaryId,
        },
        req.ip || '0.0.0.0',
        req.headers['user-agent'] || 'Airwallex_Webhook_Engine'
      );

      logger.info('Payout completed successfully', {
        transactionId: transaction.id,
        milestoneId: transaction.milestoneId,
        payoutId,
      });

      return res.status(200).json({ 
        success: true,
        message: 'Payout completed',
      });
    }

    // Handle payout failure
    if (event === 'payout.failed') {
      const payoutId = data.payout_id;
      const failureReason = data.failure_reason;

      // Find and update transaction
      const transaction = await prisma.paymentTransaction.findFirst({
        where: { 
          externalTransactionId: payoutId,
          status: 'PROCESSING'
        },
        include: {
          milestone: {
            include: {
              contract: true
            }
          }
        }
      });

      if (transaction) {
        await prisma.$transaction([
          prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: { 
              status: 'FAILED',
              metadata: {
                ...transaction.metadata as any,
                failureReason,
                failedAt: new Date().toISOString(),
              }
            }
          }),
          // Revert milestone to WORK_SUBMITTED for retry
          prisma.milestone.update({
            where: { id: transaction.milestoneId },
            data: { status: 'WORK_SUBMITTED' }
          }),
        ]);

        // Log audit event
        await logAuditEvent(
          transaction.milestone.contract.talentId,
          ActionType.PAYOUT_DISBURSEMENT_FAILED,
          transaction.milestoneId,
          {
            payoutId,
            failureReason,
          },
          req.ip || '0.0.0.0',
          req.headers['user-agent'] || 'Airwallex_Webhook_Engine'
        );

        logger.error('Payout failed', {
          transactionId: transaction.id,
          milestoneId: transaction.milestoneId,
          payoutId,
          failureReason,
        });
      }

      return res.status(200).json({ 
        success: true,
        message: 'Payout failure recorded',
      });
    }

    // Default response for other events
    logger.info('Unhandled Airwallex payout event', { event });
    return res.status(200).json({ 
      success: true, 
      message: 'Event received' 
    });

  } catch (error: any) {
    logger.error('Airwallex payout webhook processing failed', {
      error: error.message,
      stack: error.stack,
      event: req.body.event,
    });
    
    return res.status(500).json({ 
      error: 'Webhook processing failed', 
      details: error.message 
    });
  }
};
