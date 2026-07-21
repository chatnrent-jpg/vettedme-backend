/**
 * Mock Smile ID Service for Testing
 * 
 * Simulates Smile ID biometric verification responses without hitting real API
 */

export interface BiometricVerificationRequest {
  image: string;
  sessionId: string;
  userId: string;
  idType?: 'NIN' | 'BVN' | 'PASSPORT';
  idNumber?: string;
}

export interface BiometricVerificationResponse {
  success: boolean;
  jobId: string;
  confidence: number;
  livenessCheck: 'PASSED' | 'FAILED';
  faceMatch: 'MATCHED' | 'NOT_MATCHED';
  idVerification?: {
    status: 'VERIFIED' | 'NOT_VERIFIED';
    name?: string;
    dateOfBirth?: string;
    idNumber?: string;
  };
  fraudScore: number;
  timestamp: string;
}

export class SmileIDMock {
  private testMode: boolean = true;
  private successRate: number = 0.98; // 98% success rate by default

  constructor(testMode: boolean = true, successRate: number = 0.98) {
    this.testMode = testMode;
    this.successRate = successRate;
  }

  /**
   * Mock biometric verification
   */
  async verifyBiometric(request: BiometricVerificationRequest): Promise<BiometricVerificationResponse> {
    // Simulate network delay
    await this.delay(100);

    // Determine if this verification should succeed (based on success rate)
    const shouldSucceed = Math.random() < this.successRate;

    // Mock scenarios based on userId patterns
    if (request.userId.includes('fraud')) {
      return this.generateFraudResponse(request);
    }

    if (request.userId.includes('fail')) {
      return this.generateFailureResponse(request);
    }

    if (shouldSucceed) {
      return this.generateSuccessResponse(request);
    } else {
      return this.generateFailureResponse(request);
    }
  }

  /**
   * Generate successful verification response
   */
  private generateSuccessResponse(request: BiometricVerificationRequest): BiometricVerificationResponse {
    return {
      success: true,
      jobId: `job_${this.generateId()}`,
      confidence: this.randomInRange(95, 99.9),
      livenessCheck: 'PASSED',
      faceMatch: 'MATCHED',
      idVerification: {
        status: 'VERIFIED',
        name: 'Test User',
        dateOfBirth: '1990-01-01',
        idNumber: request.idNumber || 'N/A'
      },
      fraudScore: this.randomInRange(0.1, 5.0),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate failure response (legitimate user, but verification failed)
   */
  private generateFailureResponse(request: BiometricVerificationRequest): BiometricVerificationResponse {
    return {
      success: false,
      jobId: `job_${this.generateId()}`,
      confidence: this.randomInRange(60, 89),
      livenessCheck: 'FAILED',
      faceMatch: 'NOT_MATCHED',
      fraudScore: this.randomInRange(10, 30),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate fraud detection response
   */
  private generateFraudResponse(request: BiometricVerificationRequest): BiometricVerificationResponse {
    return {
      success: false,
      jobId: `job_${this.generateId()}`,
      confidence: this.randomInRange(20, 50),
      livenessCheck: 'FAILED',
      faceMatch: 'NOT_MATCHED',
      fraudScore: this.randomInRange(80, 99),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Mock NIN/BVN database verification
   */
  async verifyNationalId(idNumber: string, idType: 'NIN' | 'BVN'): Promise<{
    verified: boolean;
    name?: string;
    dateOfBirth?: string;
    phoneNumber?: string;
  }> {
    await this.delay(150);

    // Mock successful verification for test IDs
    if (idNumber.startsWith('test_')) {
      return {
        verified: true,
        name: 'Test User',
        dateOfBirth: '1990-01-01',
        phoneNumber: '+234901234567'
      };
    }

    return {
      verified: false
    };
  }

  /**
   * Check if service is available (always true for mock)
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
    return Math.random().toString(36).substring(2, 15);
  }

  private randomInRange(min: number, max: number): number {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  }
}

// Singleton instance for testing
export const smileIDMock = new SmileIDMock();

// Export factory function
export function createSmileIDMock(testMode: boolean = true, successRate: number = 0.98): SmileIDMock {
  return new SmileIDMock(testMode, successRate);
}
