/**
 * VETTED Identity Provider Factory
 * 
 * Polymorphic identity verification system that automatically selects
 * the optimal provider based on contractor location.
 * 
 * - West/East/South Africa: Smile ID (NIN, BVN, National ID)
 * - Latin America: Persona (CPF, CURP)
 * - Eastern Europe: Onfido (PESEL, National ID)
 * - Southeast Asia: Onfido (NRIC, MyKad)
 */

export enum Region {
  WEST_AFRICA = 'WEST_AFRICA',
  EAST_AFRICA = 'EAST_AFRICA',
  SOUTH_AFRICA = 'SOUTH_AFRICA',
  LATIN_AMERICA = 'LATIN_AMERICA',
  EASTERN_EUROPE = 'EASTERN_EUROPE',
  SOUTHEAST_ASIA = 'SOUTHEAST_ASIA'
}

export interface BiometricVerificationRequest {
  userId: string;
  image: string;
  sessionId: string;
  idType: string;
  idNumber: string;
  countryCode: string;
}

export interface BiometricVerificationResponse {
  success: boolean;
  confidence: number;
  livenessCheck: 'PASSED' | 'FAILED';
  faceMatch: 'MATCHED' | 'NOT_MATCHED';
  idVerification: {
    status: 'VERIFIED' | 'NOT_VERIFIED';
    name?: string;
    dateOfBirth?: string;
    idNumber?: string;
  };
  fraudScore: number;
  provider: string;
  region: Region;
}

export interface IIdentityProvider {
  verifyBiometric(request: BiometricVerificationRequest): Promise<BiometricVerificationResponse>;
  verifyNationalId(idNumber: string, idType: string, countryCode: string): Promise<any>;
  healthCheck(): Promise<boolean>;
  getProviderName(): string;
  getRegion(): Region;
}

/**
 * Base abstract class for identity providers
 */
export abstract class BaseIdentityProvider implements IIdentityProvider {
  protected region: Region;
  protected providerName: string;

  constructor(region: Region, providerName: string) {
    this.region = region;
    this.providerName = providerName;
  }

  abstract verifyBiometric(request: BiometricVerificationRequest): Promise<BiometricVerificationResponse>;
  abstract verifyNationalId(idNumber: string, idType: string, countryCode: string): Promise<any>;
  abstract healthCheck(): Promise<boolean>;

  getProviderName(): string {
    return this.providerName;
  }

  getRegion(): Region {
    return this.region;
  }
}

/**
 * Identity Provider Factory
 * 
 * Automatically selects and routes to the appropriate identity verification
 * provider based on contractor country code.
 */
export class IdentityProviderFactory {
  private static providers: Map<Region, IIdentityProvider> = new Map();
  private static initialized: boolean = false;

  /**
   * Initialize identity providers for each region
   * 
   * Call this once during application startup
   */
  static initialize(): void {
    if (this.initialized) {
      console.log('⚠️  IdentityProviderFactory already initialized');
      return;
    }

    console.log('🔄 Initializing Identity Provider Factory...');

    // Note: In production, these imports would be real provider implementations
    // For now, we define them inline for reference
    
    // West Africa: Smile ID (Nigeria, Ghana, Senegal, etc.)
    this.providers.set(Region.WEST_AFRICA, {
      verifyBiometric: async (req) => ({
        success: true,
        confidence: 97.5,
        livenessCheck: 'PASSED',
        faceMatch: 'MATCHED',
        idVerification: {
          status: 'VERIFIED',
          name: 'Test User',
          dateOfBirth: '1990-01-01',
          idNumber: req.idNumber
        },
        fraudScore: 2.1,
        provider: 'Smile ID',
        region: Region.WEST_AFRICA
      }),
      verifyNationalId: async (idNumber, idType, countryCode) => ({
        verified: true,
        name: 'Test User',
        idNumber
      }),
      healthCheck: async () => true,
      getProviderName: () => 'Smile ID',
      getRegion: () => Region.WEST_AFRICA
    });

    // East Africa: Smile ID (Kenya, Tanzania, Uganda, etc.)
    this.providers.set(Region.EAST_AFRICA, {
      verifyBiometric: async (req) => ({
        success: true,
        confidence: 96.8,
        livenessCheck: 'PASSED',
        faceMatch: 'MATCHED',
        idVerification: {
          status: 'VERIFIED',
          name: 'Test User',
          dateOfBirth: '1990-01-01',
          idNumber: req.idNumber
        },
        fraudScore: 1.8,
        provider: 'Smile ID',
        region: Region.EAST_AFRICA
      }),
      verifyNationalId: async (idNumber, idType, countryCode) => ({
        verified: true,
        name: 'Test User',
        idNumber
      }),
      healthCheck: async () => true,
      getProviderName: () => 'Smile ID',
      getRegion: () => Region.EAST_AFRICA
    });

    // South Africa: Smile ID
    this.providers.set(Region.SOUTH_AFRICA, {
      verifyBiometric: async (req) => ({
        success: true,
        confidence: 98.2,
        livenessCheck: 'PASSED',
        faceMatch: 'MATCHED',
        idVerification: {
          status: 'VERIFIED',
          name: 'Test User',
          dateOfBirth: '1990-01-01',
          idNumber: req.idNumber
        },
        fraudScore: 1.5,
        provider: 'Smile ID',
        region: Region.SOUTH_AFRICA
      }),
      verifyNationalId: async (idNumber, idType, countryCode) => ({
        verified: true,
        name: 'Test User',
        idNumber
      }),
      healthCheck: async () => true,
      getProviderName: () => 'Smile ID',
      getRegion: () => Region.SOUTH_AFRICA
    });

    // Latin America: Persona (Brazil, Colombia, Mexico, etc.)
    this.providers.set(Region.LATIN_AMERICA, {
      verifyBiometric: async (req) => ({
        success: true,
        confidence: 97.0,
        livenessCheck: 'PASSED',
        faceMatch: 'MATCHED',
        idVerification: {
          status: 'VERIFIED',
          name: 'Test User',
          dateOfBirth: '1990-01-01',
          idNumber: req.idNumber
        },
        fraudScore: 2.3,
        provider: 'Persona',
        region: Region.LATIN_AMERICA
      }),
      verifyNationalId: async (idNumber, idType, countryCode) => ({
        verified: true,
        name: 'Test User',
        idNumber
      }),
      healthCheck: async () => true,
      getProviderName: () => 'Persona',
      getRegion: () => Region.LATIN_AMERICA
    });

    // Eastern Europe: Onfido (Poland, Romania, Ukraine, etc.)
    this.providers.set(Region.EASTERN_EUROPE, {
      verifyBiometric: async (req) => ({
        success: true,
        confidence: 96.5,
        livenessCheck: 'PASSED',
        faceMatch: 'MATCHED',
        idVerification: {
          status: 'VERIFIED',
          name: 'Test User',
          dateOfBirth: '1990-01-01',
          idNumber: req.idNumber
        },
        fraudScore: 1.9,
        provider: 'Onfido',
        region: Region.EASTERN_EUROPE
      }),
      verifyNationalId: async (idNumber, idType, countryCode) => ({
        verified: true,
        name: 'Test User',
        idNumber
      }),
      healthCheck: async () => true,
      getProviderName: () => 'Onfido',
      getRegion: () => Region.EASTERN_EUROPE
    });

    // Southeast Asia: Onfido (Singapore, Malaysia, Philippines, etc.)
    this.providers.set(Region.SOUTHEAST_ASIA, {
      verifyBiometric: async (req) => ({
        success: true,
        confidence: 97.8,
        livenessCheck: 'PASSED',
        faceMatch: 'MATCHED',
        idVerification: {
          status: 'VERIFIED',
          name: 'Test User',
          dateOfBirth: '1990-01-01',
          idNumber: req.idNumber
        },
        fraudScore: 1.6,
        provider: 'Onfido',
        region: Region.SOUTHEAST_ASIA
      }),
      verifyNationalId: async (idNumber, idType, countryCode) => ({
        verified: true,
        name: 'Test User',
        idNumber
      }),
      healthCheck: async () => true,
      getProviderName: () => 'Onfido',
      getRegion: () => Region.SOUTHEAST_ASIA
    });

    this.initialized = true;
    console.log(`✅ Identity Provider Factory initialized with ${this.providers.size} regional providers`);
  }

  /**
   * Determine region from ISO country code
   */
  static getRegionFromCountryCode(countryCode: string): Region {
    const regionMap: { [key: string]: Region } = {
      // West Africa
      'NG': Region.WEST_AFRICA, // Nigeria
      'GH': Region.WEST_AFRICA, // Ghana
      'SN': Region.WEST_AFRICA, // Senegal
      'CI': Region.WEST_AFRICA, // Côte d'Ivoire
      'BJ': Region.WEST_AFRICA, // Benin
      'TG': Region.WEST_AFRICA, // Togo
      'ML': Region.WEST_AFRICA, // Mali
      'BF': Region.WEST_AFRICA, // Burkina Faso
      
      // East Africa
      'KE': Region.EAST_AFRICA, // Kenya
      'TZ': Region.EAST_AFRICA, // Tanzania
      'UG': Region.EAST_AFRICA, // Uganda
      'RW': Region.EAST_AFRICA, // Rwanda
      'ET': Region.EAST_AFRICA, // Ethiopia
      
      // South Africa
      'ZA': Region.SOUTH_AFRICA, // South Africa
      'NA': Region.SOUTH_AFRICA, // Namibia
      'BW': Region.SOUTH_AFRICA, // Botswana
      'LS': Region.SOUTH_AFRICA, // Lesotho
      'SZ': Region.SOUTH_AFRICA, // Eswatini
      
      // Latin America
      'BR': Region.LATIN_AMERICA, // Brazil
      'CO': Region.LATIN_AMERICA, // Colombia
      'MX': Region.LATIN_AMERICA, // Mexico
      'AR': Region.LATIN_AMERICA, // Argentina
      'CL': Region.LATIN_AMERICA, // Chile
      'PE': Region.LATIN_AMERICA, // Peru
      'VE': Region.LATIN_AMERICA, // Venezuela
      'EC': Region.LATIN_AMERICA, // Ecuador
      
      // Eastern Europe
      'PL': Region.EASTERN_EUROPE, // Poland
      'RO': Region.EASTERN_EUROPE, // Romania
      'UA': Region.EASTERN_EUROPE, // Ukraine
      'BG': Region.EASTERN_EUROPE, // Bulgaria
      'CZ': Region.EASTERN_EUROPE, // Czech Republic
      'SK': Region.EASTERN_EUROPE, // Slovakia
      'HU': Region.EASTERN_EUROPE, // Hungary
      
      // Southeast Asia
      'SG': Region.SOUTHEAST_ASIA, // Singapore
      'MY': Region.SOUTHEAST_ASIA, // Malaysia
      'PH': Region.SOUTHEAST_ASIA, // Philippines
      'ID': Region.SOUTHEAST_ASIA, // Indonesia
      'VN': Region.SOUTHEAST_ASIA, // Vietnam
      'TH': Region.SOUTHEAST_ASIA, // Thailand
    };

    const region = regionMap[countryCode.toUpperCase()];
    
    if (!region) {
      console.warn(`⚠️  Unknown country code: ${countryCode}, defaulting to WEST_AFRICA`);
      return Region.WEST_AFRICA; // Default fallback
    }
    
    return region;
  }

  /**
   * Get identity provider for a specific region
   */
  static getProvider(region: Region): IIdentityProvider {
    if (!this.initialized) {
      throw new Error('IdentityProviderFactory not initialized. Call initialize() first.');
    }

    const provider = this.providers.get(region);
    
    if (!provider) {
      throw new Error(`Identity provider not configured for region: ${region}`);
    }
    
    return provider;
  }

  /**
   * Get identity provider for a specific country
   */
  static getProviderForCountry(countryCode: string): IIdentityProvider {
    const region = this.getRegionFromCountryCode(countryCode);
    return this.getProvider(region);
  }

  /**
   * Verify biometric with automatic provider selection
   */
  static async verifyBiometric(
    request: BiometricVerificationRequest
  ): Promise<BiometricVerificationResponse> {
    console.log(`🔐 Verifying biometric for ${request.countryCode}...`);
    
    const provider = this.getProviderForCountry(request.countryCode);
    console.log(`   Provider: ${provider.getProviderName()}`);
    console.log(`   Region: ${provider.getRegion()}`);
    
    const result = await provider.verifyBiometric(request);
    
    console.log(`   Result: ${result.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Confidence: ${result.confidence}%`);
    
    return result;
  }

  /**
   * Verify national ID with automatic provider selection
   */
  static async verifyNationalId(
    idNumber: string,
    idType: string,
    countryCode: string
  ): Promise<any> {
    console.log(`🆔 Verifying ${idType} for ${countryCode}...`);
    
    const provider = this.getProviderForCountry(countryCode);
    const result = await provider.verifyNationalId(idNumber, idType, countryCode);
    
    console.log(`   Result: ${result.verified ? '✅ Verified' : '❌ Not Verified'}`);
    
    return result;
  }

  /**
   * Get supported regions
   */
  static getSupportedRegions(): Region[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get provider info for all regions
   */
  static getProviderInfo(): Array<{
    region: Region;
    provider: string;
    supported: boolean;
  }> {
    return Array.from(this.providers.entries()).map(([region, provider]) => ({
      region,
      provider: provider.getProviderName(),
      supported: true
    }));
  }
}

// Export for use in other modules
export default IdentityProviderFactory;
