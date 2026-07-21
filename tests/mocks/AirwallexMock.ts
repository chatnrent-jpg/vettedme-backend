/**
 * Mock Airwallex Service for Testing
 * 
 * Simulates Airwallex API responses without hitting real payment APIs
 */

export interface CreateSubAccountRequest {
  clientId: string;
  clientName: string;
  currency: string[];
}

export interface SubAccountResponse {
  id: string;
  virtualAccountId: string;
  bankDetails: {
    accountNumber: string;
    routingNumber: string;
    swift: string;
    bankName: string;
  };
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
}

export interface PayoutRequest {
  beneficiaryId: string;
  amount: number;
  currency: string;
  purpose: string;
  reference: string;
}

export interface PayoutResponse {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  amount: number;
  currency: string;
  beneficiaryId: string;
  reference: string;
  estimatedArrival: string;
  feeAmount: number;
  feeCurrency: string;
  createdAt: string;
}

export interface DepositWebhookPayload {
  event: 'payment.inbound_transfer.success';
  data: {
    id: string;
    virtual_account_id: string;
    amount: string;
    currency: string;
    status: 'COMPLETED';
    created_at: string;
  };
}

export interface PayoutWebhookPayload {
  event: 'payout.completed' | 'payout.failed';
  data: {
    id: string;
    status: 'COMPLETED' | 'FAILED';
    amount: string;
    currency: string;
    beneficiary_id: string;
    reference: string;
    created_at: string;
    failure_reason?: string;
  };
}

export class AirwallexMock {
  private testMode: boolean = true;
  private successRate: number = 0.99; // 99% success rate
  private subAccounts: Map<string, SubAccountResponse> = new Map();
  private payouts: Map<string, PayoutResponse> = new Map();

  constructor(testMode: boolean = true, successRate: number = 0.99) {
    this.testMode = testMode;
    this.successRate = successRate;
  }

  /**
   * Mock sub-account creation
   */
  async createSubAccount(request: CreateSubAccountRequest): Promise<SubAccountResponse> {
    await this.delay(200);

    const subAccount: SubAccountResponse = {
      id: `sub_${this.generateId()}`,
      virtualAccountId: `va_${this.generateId()}`,
      bankDetails: {
        accountNumber: this.generateAccountNumber(),
        routingNumber: '121000248',
        swift: 'AIRWUSX1XXX',
        bankName: 'Airwallex (US) LLC'
      },
      balance: 0,
      currency: request.currency[0],
      status: 'ACTIVE'
    };

    this.subAccounts.set(subAccount.id, subAccount);
    return subAccount;
  }

  /**
   * Mock sub-account balance update (simulates deposit)
   */
  async updateSubAccountBalance(virtualAccountId: string, amount: number): Promise<void> {
    await this.delay(100);

    // Find the sub-account by virtual account ID
    for (const [id, account] of this.subAccounts.entries()) {
      if (account.virtualAccountId === virtualAccountId) {
        account.balance += amount;
        this.subAccounts.set(id, account);
        break;
      }
    }
  }

  /**
   * Mock get sub-account balance
   */
  async getSubAccountBalance(subAccountId: string): Promise<number> {
    await this.delay(50);

    const account = this.subAccounts.get(subAccountId);
    return account?.balance || 0;
  }

  /**
   * Mock payout initiation
   */
  async initiatePayout(request: PayoutRequest): Promise<PayoutResponse> {
    await this.delay(300);

    const shouldSucceed = Math.random() < this.successRate;

    const payout: PayoutResponse = {
      id: `payout_${this.generateId()}`,
      status: shouldSucceed ? 'PENDING' : 'FAILED',
      amount: request.amount,
      currency: request.currency,
      beneficiaryId: request.beneficiaryId,
      reference: request.reference,
      estimatedArrival: this.getEstimatedArrival(),
      feeAmount: this.calculateFee(request.amount),
      feeCurrency: request.currency,
      createdAt: new Date().toISOString()
    };

    this.payouts.set(payout.id, payout);

    // Simulate async payout processing (would be completed by webhook in real system)
    if (shouldSucceed) {
      setTimeout(() => {
        payout.status = 'COMPLETED';
        this.payouts.set(payout.id, payout);
      }, 2000);
    }

    return payout;
  }

  /**
   * Mock payout status check
   */
  async getPayoutStatus(payoutId: string): Promise<PayoutResponse | null> {
    await this.delay(50);
    return this.payouts.get(payoutId) || null;
  }

  /**
   * Generate mock deposit webhook payload
   */
  generateDepositWebhook(virtualAccountId: string, amount: number, currency: string): DepositWebhookPayload {
    return {
      event: 'payment.inbound_transfer.success',
      data: {
        id: `transfer_${this.generateId()}`,
        virtual_account_id: virtualAccountId,
        amount: amount.toFixed(2),
        currency: currency,
        status: 'COMPLETED',
        created_at: new Date().toISOString()
      }
    };
  }

  /**
   * Generate mock payout webhook payload
   */
  generatePayoutWebhook(
    payoutId: string,
    status: 'COMPLETED' | 'FAILED',
    amount: number,
    currency: string,
    beneficiaryId: string,
    reference: string
  ): PayoutWebhookPayload {
    return {
      event: status === 'COMPLETED' ? 'payout.completed' : 'payout.failed',
      data: {
        id: payoutId,
        status: status,
        amount: amount.toFixed(2),
        currency: currency,
        beneficiary_id: beneficiaryId,
        reference: reference,
        created_at: new Date().toISOString(),
        failure_reason: status === 'FAILED' ? 'Insufficient funds' : undefined
      }
    };
  }

  /**
   * Mock FX conversion
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{
    originalAmount: number;
    convertedAmount: number;
    exchangeRate: number;
    fxMarkup: number;
  }> {
    await this.delay(100);

    // Mock exchange rates (simplified)
    const rates: { [key: string]: number } = {
      'USD_NGN': 1450,
      'USD_GHS': 12.5,
      'USD_KES': 150,
      'EUR_USD': 1.08,
      'GBP_USD': 1.26
    };

    const rateKey = `${fromCurrency}_${toCurrency}`;
    const exchangeRate = rates[rateKey] || 1;
    const fxMarkup = 0.0075; // 0.75% markup
    const convertedAmount = amount * exchangeRate * (1 - fxMarkup);

    return {
      originalAmount: amount,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      exchangeRate: exchangeRate,
      fxMarkup: fxMarkup
    };
  }

  /**
   * Health check (always true for mock)
   */
  async healthCheck(): Promise<boolean> {
    await this.delay(50);
    return true;
  }

  // Utility functions
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateAccountNumber(): string {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }

  private getEstimatedArrival(): string {
    const now = new Date();
    now.setHours(now.getHours() + 24); // 24 hours from now
    return now.toISOString();
  }

  private calculateFee(amount: number): number {
    // Mock fee: 1% of amount, minimum $2, maximum $50
    const fee = amount * 0.01;
    return Math.max(2, Math.min(50, Math.round(fee * 100) / 100));
  }
}

// Singleton instance for testing
export const airwallexMock = new AirwallexMock();

// Export factory function
export function createAirwallexMock(testMode: boolean = true, successRate: number = 0.99): AirwallexMock {
  return new AirwallexMock(testMode, successRate);
}
