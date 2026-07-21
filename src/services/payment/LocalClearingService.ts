/**
 * VETTED Local Clearing Service
 * 
 * Optimizes payment settlement by routing through domestic payment rails
 * instead of expensive international SWIFT wires.
 * 
 * Benefits:
 * - 500x faster settlement (15 minutes vs 5-7 days)
 * - 85% lower costs (0.2-0.5% vs 3% SWIFT fees)
 * - Better exchange rates (local FX markets)
 */

export enum PaymentRail {
  // Africa
  NGN_DIRECT = 'NGN_DIRECT',           // Nigeria: Direct bank transfer
  GHS_GIP = 'GHS_GIP',                 // Ghana: GhIPSS Instant Pay
  KES_PESALINK = 'KES_PESALINK',       // Kenya: PesaLink
  ZAR_EFT = 'ZAR_EFT',                 // South Africa: EFT network
  TZS_DIRECT = 'TZS_DIRECT',           // Tanzania: Direct transfer
  UGX_DIRECT = 'UGX_DIRECT',           // Uganda: Direct transfer
  
  // Latin America
  BRL_PIX = 'BRL_PIX',                 // Brazil: PIX (instant, <10 seconds!)
  COP_PSE = 'COP_PSE',                 // Colombia: PSE
  MXN_SPEI = 'MXN_SPEI',               // Mexico: SPEI
  ARS_DIRECT = 'ARS_DIRECT',           // Argentina: Direct transfer
  CLP_DIRECT = 'CLP_DIRECT',           // Chile: Direct transfer
  
  // Europe
  EUR_SEPA = 'EUR_SEPA',               // Europe: SEPA Instant
  PLN_ELIXIR = 'PLN_ELIXIR',           // Poland: Elixir
  RON_DIRECT = 'RON_DIRECT',           // Romania: Direct transfer
  
  // Asia
  SGD_FAST = 'SGD_FAST',               // Singapore: FAST
  MYR_RENTAS = 'MYR_RENTAS',           // Malaysia: RENTAS
  PHP_INSTAPAY = 'PHP_INSTAPAY',       // Philippines: InstaPay
  IDR_BI_FAST = 'IDR_BI_FAST',         // Indonesia: BI-FAST
  
  // Fallback
  USD_WIRE = 'USD_WIRE',               // USD wire transfer
  SWIFT_WIRE = 'SWIFT_WIRE'            // International SWIFT (slow, expensive)
}

export interface LocalRailConfig {
  rail: PaymentRail;
  currency: string;
  settlementTime: string;
  feePercentage: number;
  maxAmount: number;
  instantSettlement: boolean;
  network: string;
}

export interface PayoutResult {
  payoutId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  rail: PaymentRail;
  estimatedSettlement: string;
  fee: number;
  exchangeRate?: number;
  convertedAmount?: number;
}

export class LocalClearingService {
  /**
   * Regional payment rail configurations
   */
  private static railConfig: Map<string, LocalRailConfig> = new Map([
    // Nigeria: Direct bank transfer
    ['NGN', {
      rail: PaymentRail.NGN_DIRECT,
      currency: 'NGN',
      settlementTime: '15-30 minutes',
      feePercentage: 0.5,
      maxAmount: 10000000, // 10M NGN (~$6,800 USD)
      instantSettlement: true,
      network: 'Nigerian Interbank Settlement System (NIBSS)'
    }],
    
    // Ghana: GhIPSS Instant Pay
    ['GHS', {
      rail: PaymentRail.GHS_GIP,
      currency: 'GHS',
      settlementTime: '10-20 minutes',
      feePercentage: 0.5,
      maxAmount: 100000, // 100k GHS (~$8,000 USD)
      instantSettlement: true,
      network: 'Ghana Interbank Payment and Settlement Systems (GhIPSS)'
    }],
    
    // Kenya: PesaLink
    ['KES', {
      rail: PaymentRail.KES_PESALINK,
      currency: 'KES',
      settlementTime: '5-15 minutes',
      feePercentage: 0.3,
      maxAmount: 5000000, // 5M KES (~$38,000 USD)
      instantSettlement: true,
      network: 'PesaLink (Integrated Payment Services Ltd)'
    }],
    
    // South Africa: EFT
    ['ZAR', {
      rail: PaymentRail.ZAR_EFT,
      currency: 'ZAR',
      settlementTime: '30-60 minutes',
      feePercentage: 0.4,
      maxAmount: 1000000, // 1M ZAR (~$54,000 USD)
      instantSettlement: true,
      network: 'Electronic Funds Transfer (South African Reserve Bank)'
    }],
    
    // Tanzania: Direct transfer
    ['TZS', {
      rail: PaymentRail.TZS_DIRECT,
      currency: 'TZS',
      settlementTime: '20-40 minutes',
      feePercentage: 0.6,
      maxAmount: 100000000, // 100M TZS (~$38,000 USD)
      instantSettlement: true,
      network: 'Tanzania Interbank Settlement System (TISS)'
    }],
    
    // Uganda: Direct transfer
    ['UGX', {
      rail: PaymentRail.UGX_DIRECT,
      currency: 'UGX',
      settlementTime: '20-40 minutes',
      feePercentage: 0.6,
      maxAmount: 150000000, // 150M UGX (~$40,000 USD)
      instantSettlement: true,
      network: 'Uganda National Interbank Settlement System (UNISS)'
    }],
    
    // Brazil: PIX (instant payments, <10 seconds!)
    ['BRL', {
      rail: PaymentRail.BRL_PIX,
      currency: 'BRL',
      settlementTime: '<10 seconds',
      feePercentage: 0.2,
      maxAmount: 500000, // 500k BRL (~$100,000 USD)
      instantSettlement: true,
      network: 'PIX (Banco Central do Brasil)'
    }],
    
    // Colombia: PSE
    ['COP', {
      rail: PaymentRail.COP_PSE,
      currency: 'COP',
      settlementTime: '15-30 minutes',
      feePercentage: 0.5,
      maxAmount: 200000000, // 200M COP (~$50,000 USD)
      instantSettlement: true,
      network: 'PSE (Pagos Seguros en Línea)'
    }],
    
    // Mexico: SPEI
    ['MXN', {
      rail: PaymentRail.MXN_SPEI,
      currency: 'MXN',
      settlementTime: '10-20 minutes',
      feePercentage: 0.4,
      maxAmount: 1000000, // 1M MXN (~$58,000 USD)
      instantSettlement: true,
      network: 'SPEI (Sistema de Pagos Electrónicos Interbancarios)'
    }],
    
    // Argentina: Direct transfer
    ['ARS', {
      rail: PaymentRail.ARS_DIRECT,
      currency: 'ARS',
      settlementTime: '30-60 minutes',
      feePercentage: 0.7,
      maxAmount: 5000000, // 5M ARS (~$5,500 USD)
      instantSettlement: true,
      network: 'Argentine payment system'
    }],
    
    // Chile: Direct transfer
    ['CLP', {
      rail: PaymentRail.CLP_DIRECT,
      currency: 'CLP',
      settlementTime: '20-40 minutes',
      feePercentage: 0.5,
      maxAmount: 40000000, // 40M CLP (~$45,000 USD)
      instantSettlement: true,
      network: 'Chilean payment system'
    }],
    
    // Euro Zone: SEPA Instant
    ['EUR', {
      rail: PaymentRail.EUR_SEPA,
      currency: 'EUR',
      settlementTime: '<10 seconds',
      feePercentage: 0.2,
      maxAmount: 100000, // €100k
      instantSettlement: true,
      network: 'SEPA Instant Credit Transfer'
    }],
    
    // Poland: Elixir
    ['PLN', {
      rail: PaymentRail.PLN_ELIXIR,
      currency: 'PLN',
      settlementTime: '15-30 minutes',
      feePercentage: 0.4,
      maxAmount: 200000, // 200k PLN (~$50,000 USD)
      instantSettlement: true,
      network: 'Elixir (Polish payment system)'
    }],
    
    // Romania: Direct transfer
    ['RON', {
      rail: PaymentRail.RON_DIRECT,
      currency: 'RON',
      settlementTime: '20-40 minutes',
      feePercentage: 0.5,
      maxAmount: 200000, // 200k RON (~$43,000 USD)
      instantSettlement: true,
      network: 'Romanian payment system'
    }],
    
    // Singapore: FAST
    ['SGD', {
      rail: PaymentRail.SGD_FAST,
      currency: 'SGD',
      settlementTime: '<10 seconds',
      feePercentage: 0.2,
      maxAmount: 200000, // 200k SGD (~$148,000 USD)
      instantSettlement: true,
      network: 'FAST (Fast and Secure Transfers)'
    }],
    
    // Malaysia: RENTAS
    ['MYR', {
      rail: PaymentRail.MYR_RENTAS,
      currency: 'MYR',
      settlementTime: '10-20 minutes',
      feePercentage: 0.3,
      maxAmount: 200000, // 200k MYR (~$45,000 USD)
      instantSettlement: true,
      network: 'RENTAS (Real-Time Electronic Transfer of Funds and Securities)'
    }],
    
    // Philippines: InstaPay
    ['PHP', {
      rail: PaymentRail.PHP_INSTAPAY,
      currency: 'PHP',
      settlementTime: '<10 seconds',
      feePercentage: 0.3,
      maxAmount: 2000000, // 2M PHP (~$35,000 USD)
      instantSettlement: true,
      network: 'InstaPay (Bangko Sentral ng Pilipinas)'
    }],
    
    // Indonesia: BI-FAST
    ['IDR', {
      rail: PaymentRail.IDR_BI_FAST,
      currency: 'IDR',
      settlementTime: '<10 seconds',
      feePercentage: 0.3,
      maxAmount: 500000000, // 500M IDR (~$31,000 USD)
      instantSettlement: true,
      network: 'BI-FAST (Bank Indonesia Fast Payment)'
    }],
  ]);

  /**
   * Get optimal payment rail for currency
   */
  static getOptimalRail(currency: string, amount: number): LocalRailConfig {
    const config = this.railConfig.get(currency);
    
    if (!config) {
      console.warn(`⚠️  No local rail found for ${currency}, falling back to SWIFT wire`);
      
      // Fallback to SWIFT wire for unsupported currencies
      return {
        rail: PaymentRail.SWIFT_WIRE,
        currency: currency,
        settlementTime: '3-5 business days',
        feePercentage: 3.0,
        maxAmount: Infinity,
        instantSettlement: false,
        network: 'SWIFT (Society for Worldwide Interbank Financial Telecommunication)'
      };
    }
    
    // Check if amount exceeds rail limits
    if (amount > config.maxAmount) {
      console.warn(`⚠️  Amount ${amount} ${currency} exceeds rail limit ${config.maxAmount}, falling back to SWIFT`);
      
      return {
        rail: PaymentRail.SWIFT_WIRE,
        currency: currency,
        settlementTime: '3-5 business days',
        feePercentage: 3.0,
        maxAmount: Infinity,
        instantSettlement: false,
        network: 'SWIFT (Society for Worldwide Interbank Financial Telecommunication)'
      };
    }
    
    return config;
  }

  /**
   * Initiate local clearing payout
   */
  static async initiateLocalPayout(
    contractorId: string,
    amount: number,
    currency: string,
    bankDetails: {
      accountNumber: string;
      bankCode: string;
      accountName: string;
    },
    reference: string
  ): Promise<PayoutResult> {
    const rail = this.getOptimalRail(currency, amount);
    
    console.log(`\n💰 Initiating Local Clearing Payout:`);
    console.log(`   Rail: ${rail.rail}`);
    console.log(`   Network: ${rail.network}`);
    console.log(`   Currency: ${currency}`);
    console.log(`   Amount: ${amount.toLocaleString()} ${currency}`);
    console.log(`   Settlement Time: ${rail.settlementTime}`);
    console.log(`   Fee: ${rail.feePercentage}% (${amount * (rail.feePercentage / 100)} ${currency})`);
    console.log(`   Instant: ${rail.instantSettlement ? '⚡ Yes' : '⏳ No'}`);
    console.log(`   Reference: ${reference}`);
    
    // Calculate fee
    const fee = amount * (rail.feePercentage / 100);
    
    // In production, call actual Airwallex API with local rail specification
    const payoutRequest = {
      beneficiaryId: contractorId,
      amount: amount,
      currency: currency,
      paymentMethod: rail.rail,
      bankDetails: bankDetails,
      reference: reference,
      settlementSpeed: rail.instantSettlement ? 'INSTANT' : 'STANDARD',
      network: rail.network
    };
    
    // Simulate API call
    // const result = await airwallexService.initiatePayoutWithLocalRail(payoutRequest);
    
    return {
      payoutId: `payout_local_${Date.now()}`,
      status: 'PROCESSING',
      rail: rail.rail,
      estimatedSettlement: rail.settlementTime,
      fee: fee
    };
  }

  /**
   * Get all supported currencies and their rails
   */
  static getSupportedCurrencies(): Array<{
    currency: string;
    rail: PaymentRail;
    settlementTime: string;
    feePercentage: number;
    instantSettlement: boolean;
  }> {
    return Array.from(this.railConfig.entries()).map(([currency, config]) => ({
      currency,
      rail: config.rail,
      settlementTime: config.settlementTime,
      feePercentage: config.feePercentage,
      instantSettlement: config.instantSettlement
    }));
  }

  /**
   * Compare SWIFT vs local rail costs
   */
  static compareCosts(amount: number, currency: string): {
    swiftCost: number;
    localRailCost: number;
    savings: number;
    savingsPercentage: number;
  } {
    const localRail = this.getOptimalRail(currency, amount);
    
    const swiftCost = amount * 0.03; // 3% SWIFT fee
    const localRailCost = amount * (localRail.feePercentage / 100);
    const savings = swiftCost - localRailCost;
    const savingsPercentage = (savings / swiftCost) * 100;
    
    return {
      swiftCost,
      localRailCost,
      savings,
      savingsPercentage
    };
  }
}

export default LocalClearingService;
