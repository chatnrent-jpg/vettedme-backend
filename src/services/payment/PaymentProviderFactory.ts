/**
 * VETTED Payment Provider Factory
 * 
 * Multi-provider payment architecture with automatic failover.
 * Eliminates single-vendor dependency risk.
 * 
 * Providers:
 * - Airwallex (Primary): Best for APAC, local rails, multi-currency
 * - Wise (Secondary): Best for Europe, transparent pricing
 * - Payoneer (Tertiary): Best for LatAm, contractor-friendly
 * 
 * Failover Strategy:
 * 1. Try primary provider (based on region/currency)
 * 2. If fails, try secondary provider
 * 3. If fails, try tertiary provider
 * 4. If all fail, alert ops team
 */

export enum PaymentProvider {
  AIRWALLEX = 'AIRWALLEX',
  WISE = 'WISE',
  PAYONEER = 'PAYONEER'
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  LOCAL_RAIL = 'LOCAL_RAIL',
  SWIFT_WIRE = 'SWIFT_WIRE',
  INSTANT_PAYMENT = 'INSTANT_PAYMENT'
}

export interface PaymentProviderConfig {
  provider: PaymentProvider;
  apiKey: string;
  webhookSecret: string;
  enabled: boolean;
  priority: number; // Lower = higher priority
  supportedCurrencies: string[];
  supportedRegions: string[];
  features: {
    localRails: boolean;
    instantPayment: boolean;
    multiCurrency: boolean;
    escrow: boolean;
  };
}

export interface CreateSubAccountRequest {
  clientId: string;
  clientName: string;
  email: string;
  currency: string[];
  region: string;
}

export interface SubAccountResponse {
  id: string;
  provider: PaymentProvider;
  virtualAccountId: string;
  bankDetails: {
    accountNumber: string;
    routingNumber?: string;
    swift?: string;
    iban?: string;
    sortCode?: string;
    bankName: string;
    bankAddress?: string;
  };
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
}

export interface InitiatePayoutRequest {
  beneficiaryId: string;
  amount: number;
  currency: string;
  bankDetails: {
    accountNumber: string;
    bankCode?: string;
    swift?: string;
    iban?: string;
    accountName: string;
  };
  purpose: string;
  reference: string;
  settlementSpeed?: 'INSTANT' | 'FAST' | 'STANDARD';
}

export interface PayoutResponse {
  id: string;
  provider: PaymentProvider;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  amount: number;
  currency: string;
  beneficiaryId: string;
  reference: string;
  estimatedArrival: string;
  fee: {
    amount: number;
    currency: string;
  };
  exchangeRate?: number;
  createdAt: string;
}

export interface IPaymentProvider {
  // Provider info
  getProviderName(): PaymentProvider;
  isEnabled(): boolean;
  getSupportedCurrencies(): string[];
  getSupportedRegions(): string[];
  
  // Sub-account management
  createSubAccount(request: CreateSubAccountRequest): Promise<SubAccountResponse>;
  getSubAccountBalance(subAccountId: string): Promise<number>;
  
  // Payouts
  initiatePayout(request: InitiatePayoutRequest): Promise<PayoutResponse>;
  getPayoutStatus(payoutId: string): Promise<PayoutResponse>;
  
  // Health check
  healthCheck(): Promise<boolean>;
}

/**
 * Base Payment Provider (abstract class)
 */
export abstract class BasePaymentProvider implements IPaymentProvider {
  protected config: PaymentProviderConfig;

  constructor(config: PaymentProviderConfig) {
    this.config = config;
  }

  getProviderName(): PaymentProvider {
    return this.config.provider;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getSupportedCurrencies(): string[] {
    return this.config.supportedCurrencies;
  }

  getSupportedRegions(): string[] {
    return this.config.supportedRegions;
  }

  abstract createSubAccount(request: CreateSubAccountRequest): Promise<SubAccountResponse>;
  abstract getSubAccountBalance(subAccountId: string): Promise<number>;
  abstract initiatePayout(request: InitiatePayoutRequest): Promise<PayoutResponse>;
  abstract getPayoutStatus(payoutId: string): Promise<PayoutResponse>;
  abstract healthCheck(): Promise<boolean>;
}

/**
 * Payment Provider Factory
 * 
 * Manages multiple payment providers with automatic failover
 */
export class PaymentProviderFactory {
  private static providers: Map<PaymentProvider, IPaymentProvider> = new Map();
  private static initialized: boolean = false;

  /**
   * Initialize all payment providers
   */
  static initialize(): void {
    if (this.initialized) {
      console.log('⚠️  PaymentProviderFactory already initialized');
      return;
    }

    console.log('🔄 Initializing Payment Provider Factory...');

    // Airwallex (Primary) - Best for APAC, local rails
    const airwallexConfig: PaymentProviderConfig = {
      provider: PaymentProvider.AIRWALLEX,
      apiKey: process.env.AIRWALLEX_API_KEY || '',
      webhookSecret: process.env.AIRWALLEX_WEBHOOK_SECRET_KEY || '',
      enabled: true,
      priority: 1,
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'BRL', 'MXN', 'SGD', 'AUD', 'CNY'],
      supportedRegions: ['WEST_AFRICA', 'EAST_AFRICA', 'SOUTH_AFRICA', 'LATIN_AMERICA', 'SOUTHEAST_ASIA', 'NORTH_AMERICA', 'EUROPE'],
      features: {
        localRails: true,
        instantPayment: true,
        multiCurrency: true,
        escrow: true
      }
    };

    // Wise (Secondary) - Best for Europe, transparent fees
    const wiseConfig: PaymentProviderConfig = {
      provider: PaymentProvider.WISE,
      apiKey: process.env.WISE_API_KEY || '',
      webhookSecret: process.env.WISE_WEBHOOK_SECRET || '',
      enabled: true,
      priority: 2,
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'PLN', 'RON', 'CZK', 'NGN', 'KES', 'ZAR', 'BRL', 'MXN'],
      supportedRegions: ['EUROPE', 'EASTERN_EUROPE', 'NORTH_AMERICA', 'WEST_AFRICA', 'EAST_AFRICA', 'LATIN_AMERICA'],
      features: {
        localRails: true,
        instantPayment: false,
        multiCurrency: true,
        escrow: false
      }
    };

    // Payoneer (Tertiary) - Best for LatAm, contractor-friendly
    const payoneerConfig: PaymentProviderConfig = {
      provider: PaymentProvider.PAYONEER,
      apiKey: process.env.PAYONEER_API_KEY || '',
      webhookSecret: process.env.PAYONEER_WEBHOOK_SECRET || '',
      enabled: true,
      priority: 3,
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'BRL', 'MXN', 'COP', 'ARS', 'PLN', 'INR'],
      supportedRegions: ['LATIN_AMERICA', 'EASTERN_EUROPE', 'SOUTH_ASIA', 'NORTH_AMERICA', 'EUROPE'],
      features: {
        localRails: true,
        instantPayment: false,
        multiCurrency: true,
        escrow: false
      }
    };

    // Register providers (mock implementations for now)
    this.registerProvider(this.createAirwallexProvider(airwallexConfig));
    this.registerProvider(this.createWiseProvider(wiseConfig));
    this.registerProvider(this.createPayoneerProvider(payoneerConfig));

    this.initialized = true;
    console.log(`✅ Payment Provider Factory initialized with ${this.providers.size} providers`);
    console.log(`   Primary: Airwallex (local rails, instant payment)`);
    console.log(`   Secondary: Wise (transparent fees, Europe-optimized)`);
    console.log(`   Tertiary: Payoneer (LatAm-optimized, contractor-friendly)`);
  }

  /**
   * Register a payment provider
   */
  private static registerProvider(provider: IPaymentProvider): void {
    this.providers.set(provider.getProviderName(), provider);
  }

  /**
   * Get optimal provider for region and currency
   */
  static getOptimalProvider(currency: string, region: string, features?: {
    requiresLocalRails?: boolean;
    requiresInstantPayment?: boolean;
    requiresEscrow?: boolean;
  }): IPaymentProvider {
    if (!this.initialized) {
      throw new Error('PaymentProviderFactory not initialized. Call initialize() first.');
    }

    // Get all enabled providers sorted by priority
    const enabledProviders = Array.from(this.providers.values())
      .filter(p => p.isEnabled())
      .sort((a, b) => {
        const configA = (a as any).config as PaymentProviderConfig;
        const configB = (b as any).config as PaymentProviderConfig;
        return configA.priority - configB.priority;
      });

    // Find best match
    for (const provider of enabledProviders) {
      const config = (provider as any).config as PaymentProviderConfig;
      
      // Check currency support
      if (!config.supportedCurrencies.includes(currency)) {
        continue;
      }
      
      // Check region support
      if (!config.supportedRegions.includes(region)) {
        continue;
      }
      
      // Check feature requirements
      if (features?.requiresLocalRails && !config.features.localRails) {
        continue;
      }
      if (features?.requiresInstantPayment && !config.features.instantPayment) {
        continue;
      }
      if (features?.requiresEscrow && !config.features.escrow) {
        continue;
      }
      
      // Found optimal provider
      console.log(`✅ Selected ${config.provider} for ${currency} in ${region}`);
      return provider;
    }

    // Fallback to primary provider
    const primaryProvider = enabledProviders[0];
    console.warn(`⚠️  No optimal provider found for ${currency} in ${region}, falling back to ${primaryProvider.getProviderName()}`);
    return primaryProvider;
  }

  /**
   * Initiate payout with automatic failover
   */
  static async initiatePayoutWithFailover(
    request: InitiatePayoutRequest,
    region: string
  ): Promise<PayoutResponse> {
    const errors: Array<{ provider: PaymentProvider; error: string }> = [];

    // Get providers in priority order
    const providers = Array.from(this.providers.values())
      .filter(p => p.isEnabled())
      .filter(p => p.getSupportedCurrencies().includes(request.currency))
      .sort((a, b) => {
        const configA = (a as any).config as PaymentProviderConfig;
        const configB = (b as any).config as PaymentProviderConfig;
        return configA.priority - configB.priority;
      });

    // Try each provider in order
    for (const provider of providers) {
      try {
        console.log(`💳 Attempting payout with ${provider.getProviderName()}...`);
        const result = await provider.initiatePayout(request);
        console.log(`✅ Payout successful with ${provider.getProviderName()}`);
        return result;
      } catch (error: any) {
        console.error(`❌ Payout failed with ${provider.getProviderName()}: ${error.message}`);
        errors.push({
          provider: provider.getProviderName(),
          error: error.message
        });
        continue;
      }
    }

    // All providers failed
    const errorMessage = `All payment providers failed: ${errors.map(e => `${e.provider}: ${e.error}`).join(', ')}`;
    console.error(`❌ ${errorMessage}`);
    throw new Error(errorMessage);
  }

  /**
   * Get provider by name
   */
  static getProvider(provider: PaymentProvider): IPaymentProvider {
    const p = this.providers.get(provider);
    if (!p) {
      throw new Error(`Provider not found: ${provider}`);
    }
    return p;
  }

  /**
   * Get all providers
   */
  static getAllProviders(): IPaymentProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Health check all providers
   */
  static async healthCheckAll(): Promise<Map<PaymentProvider, boolean>> {
    const results = new Map<PaymentProvider, boolean>();
    
    for (const [name, provider] of this.providers.entries()) {
      try {
        const healthy = await provider.healthCheck();
        results.set(name, healthy);
      } catch (error) {
        results.set(name, false);
      }
    }
    
    return results;
  }

  // Provider factory methods (mock implementations)
  
  private static createAirwallexProvider(config: PaymentProviderConfig): IPaymentProvider {
    return {
      getProviderName: () => PaymentProvider.AIRWALLEX,
      isEnabled: () => config.enabled,
      getSupportedCurrencies: () => config.supportedCurrencies,
      getSupportedRegions: () => config.supportedRegions,
      
      createSubAccount: async (request) => ({
        id: `airwallex_sub_${Date.now()}`,
        provider: PaymentProvider.AIRWALLEX,
        virtualAccountId: `va_airwallex_${Date.now()}`,
        bankDetails: {
          accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
          routingNumber: '121000248',
          swift: 'AIRWUSX1XXX',
          bankName: 'Airwallex (US) LLC'
        },
        balance: 0,
        currency: request.currency[0],
        status: 'ACTIVE'
      }),
      
      getSubAccountBalance: async (subAccountId) => 0,
      
      initiatePayout: async (request) => ({
        id: `airwallex_payout_${Date.now()}`,
        provider: PaymentProvider.AIRWALLEX,
        status: 'PROCESSING',
        amount: request.amount,
        currency: request.currency,
        beneficiaryId: request.beneficiaryId,
        reference: request.reference,
        estimatedArrival: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        fee: {
          amount: request.amount * 0.005,
          currency: request.currency
        },
        createdAt: new Date().toISOString()
      }),
      
      getPayoutStatus: async (payoutId) => ({
        id: payoutId,
        provider: PaymentProvider.AIRWALLEX,
        status: 'COMPLETED',
        amount: 10000,
        currency: 'USD',
        beneficiaryId: 'beneficiary_001',
        reference: 'ref_001',
        estimatedArrival: new Date().toISOString(),
        fee: { amount: 50, currency: 'USD' },
        createdAt: new Date().toISOString()
      }),
      
      healthCheck: async () => true
    };
  }

  private static createWiseProvider(config: PaymentProviderConfig): IPaymentProvider {
    return {
      getProviderName: () => PaymentProvider.WISE,
      isEnabled: () => config.enabled,
      getSupportedCurrencies: () => config.supportedCurrencies,
      getSupportedRegions: () => config.supportedRegions,
      
      createSubAccount: async (request) => ({
        id: `wise_sub_${Date.now()}`,
        provider: PaymentProvider.WISE,
        virtualAccountId: `va_wise_${Date.now()}`,
        bankDetails: {
          accountNumber: Math.floor(10000000 + Math.random() * 90000000).toString(),
          sortCode: '23-14-70',
          iban: `GB29NWBK60161331926819`,
          bankName: 'Wise (Europe) SA'
        },
        balance: 0,
        currency: request.currency[0],
        status: 'ACTIVE'
      }),
      
      getSubAccountBalance: async (subAccountId) => 0,
      
      initiatePayout: async (request) => ({
        id: `wise_payout_${Date.now()}`,
        provider: PaymentProvider.WISE,
        status: 'PROCESSING',
        amount: request.amount,
        currency: request.currency,
        beneficiaryId: request.beneficiaryId,
        reference: request.reference,
        estimatedArrival: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        fee: {
          amount: request.amount * 0.004,
          currency: request.currency
        },
        createdAt: new Date().toISOString()
      }),
      
      getPayoutStatus: async (payoutId) => ({
        id: payoutId,
        provider: PaymentProvider.WISE,
        status: 'COMPLETED',
        amount: 10000,
        currency: 'USD',
        beneficiaryId: 'beneficiary_001',
        reference: 'ref_001',
        estimatedArrival: new Date().toISOString(),
        fee: { amount: 40, currency: 'USD' },
        createdAt: new Date().toISOString()
      }),
      
      healthCheck: async () => true
    };
  }

  private static createPayoneerProvider(config: PaymentProviderConfig): IPaymentProvider {
    return {
      getProviderName: () => PaymentProvider.PAYONEER,
      isEnabled: () => config.enabled,
      getSupportedCurrencies: () => config.supportedCurrencies,
      getSupportedRegions: () => config.supportedRegions,
      
      createSubAccount: async (request) => ({
        id: `payoneer_sub_${Date.now()}`,
        provider: PaymentProvider.PAYONEER,
        virtualAccountId: `va_payoneer_${Date.now()}`,
        bankDetails: {
          accountNumber: Math.floor(100000000 + Math.random() * 900000000).toString(),
          swift: 'PNRQUS3LXXX',
          bankName: 'Payoneer Inc.'
        },
        balance: 0,
        currency: request.currency[0],
        status: 'ACTIVE'
      }),
      
      getSubAccountBalance: async (subAccountId) => 0,
      
      initiatePayout: async (request) => ({
        id: `payoneer_payout_${Date.now()}`,
        provider: PaymentProvider.PAYONEER,
        status: 'PROCESSING',
        amount: request.amount,
        currency: request.currency,
        beneficiaryId: request.beneficiaryId,
        reference: request.reference,
        estimatedArrival: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        fee: {
          amount: request.amount * 0.003,
          currency: request.currency
        },
        createdAt: new Date().toISOString()
      }),
      
      getPayoutStatus: async (payoutId) => ({
        id: payoutId,
        provider: PaymentProvider.PAYONEER,
        status: 'COMPLETED',
        amount: 10000,
        currency: 'USD',
        beneficiaryId: 'beneficiary_001',
        reference: 'ref_001',
        estimatedArrival: new Date().toISOString(),
        fee: { amount: 30, currency: 'USD' },
        createdAt: new Date().toISOString()
      }),
      
      healthCheck: async () => true
    };
  }
}

export default PaymentProviderFactory;
