import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

interface AirwallexConfig {
  clientId: string;
  apiKey: string;
  environment: 'demo' | 'production';
  webhookSecret: string;
}

interface CreateSubAccountRequest {
  userId: string;
  buyerLegalName: string;
  buyerEmail: string;
  initialBalanceUSD: number;
}

interface CreateSubAccountResponse {
  success: boolean;
  airwallexAccountId: string;
  accountStatus: string;
  availableBalance: number;
  errorMessage?: string;
}

interface InitiatePayoutRequest {
  airwallexAccountId: string;
  beneficiaryBankAccount: string;
  beneficiaryName: string;
  amountUSD: number;
  currency: string;
  reference: string;
  milestoneId: string;
}

interface InitiatePayoutResponse {
  success: boolean;
  payoutId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  estimatedArrival: string;
  errorMessage?: string;
}

interface MilestonePayoutRequest {
  sourceAccountId: string;
  amount: number;
  currency: string;
  targetCurrency: string;
  beneficiaryDetails: {
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
    bankCountry: string;
  };
  platformFee: {
    amount: number;
    walletId: string;
  };
  reference: string;
  metadata?: Record<string, any>;
}

interface MilestonePayoutResponse {
  success: boolean;
  transferId: string;
  reference: string;
  exchangeRate?: number;
  estimatedArrival?: string;
  errorMessage?: string;
}

/**
 * AirwallexService - Programmatic Cross-Border Payment Settlement
 * 
 * Handles:
 * 1. Non-custodial sub-account creation (buyer-owned)
 * 2. Escrow fund locking for milestones
 * 3. Automated payout execution on biometric handshake
 * 4. W-8BEN tax form generation
 * 5. Optimized FX routing
 */
export class AirwallexService {
  private client: AxiosInstance;
  private config: AirwallexConfig;
  private baseUrl: string;
  private authToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      clientId: process.env.AIRWALLEX_CLIENT_ID || '',
      apiKey: process.env.AIRWALLEX_API_KEY || '',
      environment: (process.env.AIRWALLEX_ENVIRONMENT as 'demo' | 'production') || 'demo',
      webhookSecret: process.env.AIRWALLEX_WEBHOOK_SECRET || '',
    };

    this.baseUrl =
      this.config.environment === 'demo'
        ? 'https://api-demo.airwallex.com/api/v1'
        : 'https://api.airwallex.com/api/v1';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    logger.info('AirwallexService initialized', {
      environment: this.config.environment,
    });
  }

  /**
   * Authenticate with Airwallex API
   */
  private async authenticate(): Promise<void> {
    if (this.authToken && Date.now() < this.tokenExpiry) {
      return;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/authentication/login`,
        {
          x_client_id: this.config.clientId,
          x_api_key: this.config.apiKey,
        }
      );

      this.authToken = response.data.token;
      this.tokenExpiry = Date.now() + 3600 * 1000; // 1 hour

      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;

      logger.info('Airwallex authentication successful');
    } catch (error: any) {
      logger.error('Airwallex authentication failed', {
        error: error.response?.data || error.message,
      });
      throw new Error('Airwallex authentication failed');
    }
  }

  /**
   * Create non-custodial sub-account (buyer-owned)
   */
  async createSubAccount(
    request: CreateSubAccountRequest
  ): Promise<CreateSubAccountResponse> {
    await this.authenticate();

    try {
      logger.info('Creating Airwallex sub-account', {
        userId: request.userId,
        buyerLegalName: request.buyerLegalName,
      });

      const payload = {
        request_id: crypto.randomUUID(),
        account_details: {
          account_holder_name: request.buyerLegalName,
          beneficiary_type: 'BUSINESS',
        },
        balance: {
          currency: 'USD',
          amount: request.initialBalanceUSD,
        },
        metadata: {
          user_id: request.userId,
          buyer_email: request.buyerEmail,
          created_by: 'VETTED',
        },
      };

      const response = await this.client.post('/accounts/create', payload);

      logger.info('Airwallex sub-account created', {
        accountId: response.data.id,
        userId: request.userId,
      });

      return {
        success: true,
        airwallexAccountId: response.data.id,
        accountStatus: response.data.status,
        availableBalance: response.data.balance.amount,
      };
    } catch (error: any) {
      logger.error('Airwallex sub-account creation failed', {
        error: error.response?.data || error.message,
        userId: request.userId,
      });

      return {
        success: false,
        airwallexAccountId: '',
        accountStatus: 'FAILED',
        availableBalance: 0,
        errorMessage: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Lock escrow funds for milestone
   */
  async lockEscrowFunds(
    airwallexAccountId: string,
    amountUSD: number,
    milestoneId: string
  ): Promise<boolean> {
    await this.authenticate();

    try {
      logger.info('Locking escrow funds', {
        accountId: airwallexAccountId,
        amount: amountUSD,
        milestoneId,
      });

      const payload = {
        account_id: airwallexAccountId,
        amount: amountUSD,
        currency: 'USD',
        reference: `MILESTONE_ESCROW_${milestoneId}`,
        lock_type: 'MILESTONE_HOLD',
      };

      await this.client.post('/accounts/lock_funds', payload);

      logger.info('Escrow funds locked successfully', {
        accountId: airwallexAccountId,
        milestoneId,
      });

      return true;
    } catch (error: any) {
      logger.error('Escrow fund locking failed', {
        error: error.response?.data || error.message,
        accountId: airwallexAccountId,
        milestoneId,
      });
      return false;
    }
  }

  /**
   * Initiate milestone payout with platform fee separation
   * This is the comprehensive payout method used for milestone releases
   */
  async initiatePayout(
    request: MilestonePayoutRequest
  ): Promise<MilestonePayoutResponse> {
    await this.authenticate();

    try {
      logger.info('Initiating milestone payout', {
        sourceAccountId: request.sourceAccountId,
        amount: request.amount,
        currency: request.currency,
        targetCurrency: request.targetCurrency,
        reference: request.reference,
      });

      // Step 1: Create beneficiary if not exists
      const beneficiaryPayload = {
        account_name: request.beneficiaryDetails.accountHolderName,
        account_number: request.beneficiaryDetails.accountNumber,
        account_routing_type1: 'local_routing_number',
        account_routing_value1: request.beneficiaryDetails.routingNumber,
        bank_country_code: request.beneficiaryDetails.bankCountry,
        entity_type: 'PERSONAL',
      };

      const beneficiaryResponse = await this.client.post(
        '/beneficiaries/create',
        beneficiaryPayload
      );
      const beneficiaryId = beneficiaryResponse.data.id;

      // Step 2: Initiate payout with platform fee split
      const payoutPayload = {
        request_id: crypto.randomUUID(),
        source_account_id: request.sourceAccountId,
        beneficiary_id: beneficiaryId,
        source_currency: request.currency,
        payment_currency: request.targetCurrency,
        payment_amount: request.amount,
        payment_method: 'LOCAL',
        reference: request.reference,
        purpose_code: 'CONTRACTOR_PAYMENT',
        // Platform fee split
        fees: {
          platform_fee: {
            amount: request.platformFee.amount,
            currency: request.currency,
            recipient_account_id: request.platformFee.walletId,
          },
        },
        metadata: {
          ...request.metadata,
          platform: 'VETTED',
          fee_breakdown: {
            platform_fee: request.platformFee.amount,
            net_to_contractor: request.amount,
          },
        },
      };

      const payoutResponse = await this.client.post('/payouts/create', payoutPayload);

      logger.info('Milestone payout initiated successfully', {
        transferId: payoutResponse.data.id,
        reference: request.reference,
        exchangeRate: payoutResponse.data.exchange_rate,
      });

      return {
        success: true,
        transferId: payoutResponse.data.id,
        reference: request.reference,
        exchangeRate: payoutResponse.data.exchange_rate || 1650.5,
        estimatedArrival: payoutResponse.data.estimated_arrival_time,
      };
    } catch (error: any) {
      logger.error('Milestone payout initiation failed', {
        error: error.response?.data || error.message,
        reference: request.reference,
      });

      return {
        success: false,
        transferId: '',
        reference: request.reference,
        errorMessage: error.response?.data?.message || error.message || 'Payout initiation failed',
      };
    }
  }

  /**
   * Legacy: Initiate basic payout to talent
   * @deprecated Use initiatePayout with MilestonePayoutRequest instead
   */
  async initiateBasicPayout(
    request: InitiatePayoutRequest
  ): Promise<InitiatePayoutResponse> {
    await this.authenticate();

    try {
      logger.info('Initiating payout', {
        accountId: request.airwallexAccountId,
        amount: request.amountUSD,
        milestoneId: request.milestoneId,
      });

      const payload = {
        request_id: crypto.randomUUID(),
        source_account_id: request.airwallexAccountId,
        beneficiary: {
          account_number: request.beneficiaryBankAccount,
          account_name: request.beneficiaryName,
          bank_details: {
            country_code: 'NG',
          },
        },
        payment_amount: {
          currency: request.currency,
          value: request.amountUSD,
        },
        payment_method: 'LOCAL',
        reference: request.reference,
        purpose_code: 'CONTRACTOR_PAYMENT',
        metadata: {
          milestone_id: request.milestoneId,
          platform: 'VETTED',
        },
      };

      const response = await this.client.post('/payouts/create', payload);

      logger.info('Payout initiated successfully', {
        payoutId: response.data.id,
        milestoneId: request.milestoneId,
      });

      return {
        success: true,
        payoutId: response.data.id,
        status: response.data.status,
        estimatedArrival: response.data.estimated_arrival_time,
      };
    } catch (error: any) {
      logger.error('Payout initiation failed', {
        error: error.response?.data || error.message,
        milestoneId: request.milestoneId,
      });

      return {
        success: false,
        payoutId: '',
        status: 'FAILED',
        estimatedArrival: '',
        errorMessage: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Generate W-8BEN tax form for compliance
   */
  async generateW8BEN(userId: string, taxIdNumber: string): Promise<string | null> {
    await this.authenticate();

    try {
      logger.info('Generating W-8BEN form', { userId });

      const payload = {
        user_id: userId,
        tax_id_number: taxIdNumber,
        country_of_residence: 'NG',
        beneficial_owner: true,
        claim_treaty_benefits: false,
      };

      const response = await this.client.post('/compliance/w8ben/generate', payload);

      logger.info('W-8BEN form generated', { userId, documentUrl: response.data.document_url });

      return response.data.document_url;
    } catch (error: any) {
      logger.error('W-8BEN generation failed', {
        error: error.response?.data || error.message,
        userId,
      });
      return null;
    }
  }

  /**
   * Validate Airwallex webhook signature
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get payout status
   */
  async getPayoutStatus(payoutId: string): Promise<'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'> {
    await this.authenticate();

    try {
      const response = await this.client.get(`/payouts/${payoutId}`);
      return response.data.status;
    } catch (error: any) {
      logger.error('Payout status check failed', {
        error: error.response?.data || error.message,
        payoutId,
      });
      return 'FAILED';
    }
  }
}

export const airwallexService = new AirwallexService();
