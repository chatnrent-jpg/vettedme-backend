import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

interface SmileIDConfig {
  partnerId: string;
  apiKey: string;
  sandboxMode: boolean;
}

interface BiometricVerificationRequest {
  userId: string;
  idType: 'NIN' | 'BVN' | 'PASSPORT';
  idNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
}

interface BiometricVerificationResponse {
  success: boolean;
  sessionId: string;
  verificationStatus: 'VERIFIED' | 'FAILED' | 'PENDING';
  livenessCheckPassed: boolean;
  faceMatchScore: number;
  governmentData?: {
    ninVerified: boolean;
    bvnVerified: boolean;
    fullName: string;
    dateOfBirth: string;
    phoneNumber: string;
  };
  errorMessage?: string;
}

interface BiometricComparisonRequest {
  userId: string;
  passportId: string;
  baselineImageHash: string;
  liveImageBase64: string;
  smileIdUserId: string;
  verificationType: 'ONBOARDING' | 'MILESTONE_HANDSHAKE' | 'ACCOUNT_RECOVERY' | 'SECURITY_CHECK' | 'PAYMENT_AUTHORIZATION';
  metadata?: Record<string, any>;
}

interface BiometricComparisonResponse {
  success: boolean;
  sessionId: string;
  confidence: number;
  livenessDetected: boolean;
  faceMatch: 'VERIFIED' | 'FAILED' | 'REVIEW_REQUIRED';
  errorMessage?: string;
}

/**
 * SmileIDService - Nigerian Biometric & Government Registry Verification
 * 
 * Integrates with Smile Identity API for:
 * 1. Biometric liveness checks (anti-deepfake)
 * 2. NIN (National Identity Number) verification
 * 3. BVN (Bank Verification Number) cross-checking
 * 4. Face matching against government databases
 */
export class SmileIDService {
  private client: AxiosInstance;
  private config: SmileIDConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      partnerId: process.env.SMILE_ID_PARTNER_ID || '',
      apiKey: process.env.SMILE_ID_API_KEY || '',
      sandboxMode: process.env.SMILE_ID_SANDBOX_MODE === 'true',
    };

    this.baseUrl = this.config.sandboxMode
      ? 'https://testapi.smileidentity.com/v1'
      : 'https://api.smileidentity.com/v1';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'SmileID-Partner-ID': this.config.partnerId,
        'SmileID-API-Key': this.config.apiKey,
      },
      timeout: 30000,
    });

    logger.info('SmileIDService initialized', {
      mode: this.config.sandboxMode ? 'SANDBOX' : 'PRODUCTION',
    });
  }

  /**
   * Initiate biometric verification session
   */
  async initiateVerification(
    request: BiometricVerificationRequest
  ): Promise<{ sessionId: string; verificationUrl: string }> {
    try {
      logger.info('Initiating Smile ID verification', {
        userId: request.userId,
        idType: request.idType,
      });

      const payload = {
        partner_id: this.config.partnerId,
        user_id: request.userId,
        job_type: 5, // Enhanced KYC with biometric
        id_info: {
          country: 'NG',
          id_type: request.idType,
          id_number: request.idNumber,
          first_name: request.firstName,
          last_name: request.lastName,
          dob: request.dateOfBirth,
        },
        callback_url: process.env.VETTEDME_WEBHOOK_URL,
        source_sdk: 'rest_api',
        source_sdk_version: '1.0.0',
      };

      const response = await this.client.post('/id_verification', payload);

      logger.info('Smile ID session created', {
        sessionId: response.data.session_id,
        userId: request.userId,
      });

      return {
        sessionId: response.data.session_id,
        verificationUrl: response.data.verification_url,
      };
    } catch (error: any) {
      logger.error('Smile ID initiation failed', {
        error: error.response?.data || error.message,
        userId: request.userId,
      });
      throw new Error(`Biometric verification initiation failed: ${error.message}`);
    }
  }

  /**
   * Check verification status
   */
  async checkVerificationStatus(
    sessionId: string
  ): Promise<BiometricVerificationResponse> {
    try {
      const response = await this.client.get(`/id_verification/${sessionId}`);
      const data = response.data;

      logger.info('Smile ID verification status checked', {
        sessionId,
        status: data.verification_status,
      });

      return {
        success: data.verification_status === 'VERIFIED',
        sessionId,
        verificationStatus: data.verification_status,
        livenessCheckPassed: data.liveness_check?.passed || false,
        faceMatchScore: data.face_match?.confidence || 0,
        governmentData: data.id_verification_result
          ? {
              ninVerified: data.id_verification_result.nin_verified,
              bvnVerified: data.id_verification_result.bvn_verified,
              fullName: data.id_verification_result.full_name,
              dateOfBirth: data.id_verification_result.date_of_birth,
              phoneNumber: data.id_verification_result.phone_number,
            }
          : undefined,
        errorMessage: data.error_message,
      };
    } catch (error: any) {
      logger.error('Smile ID status check failed', {
        error: error.response?.data || error.message,
        sessionId,
      });
      throw new Error(`Verification status check failed: ${error.message}`);
    }
  }

  /**
   * Verify NIN (National Identity Number) directly
   */
  async verifyNIN(nin: string, userId: string): Promise<boolean> {
    try {
      logger.info('Verifying NIN', { userId, nin: `***${nin.slice(-4)}` });

      const payload = {
        partner_id: this.config.partnerId,
        user_id: userId,
        country: 'NG',
        id_type: 'NIN',
        id_number: nin,
      };

      const response = await this.client.post('/verify_id', payload);

      const verified = response.data.result === 'VERIFIED';
      logger.info('NIN verification result', { userId, verified });

      return verified;
    } catch (error: any) {
      logger.error('NIN verification failed', {
        error: error.response?.data || error.message,
        userId,
      });
      return false;
    }
  }

  /**
   * Verify BVN (Bank Verification Number)
   */
  async verifyBVN(bvn: string, userId: string): Promise<boolean> {
    try {
      logger.info('Verifying BVN', { userId, bvn: `***${bvn.slice(-4)}` });

      const payload = {
        partner_id: this.config.partnerId,
        user_id: userId,
        country: 'NG',
        id_type: 'BVN',
        id_number: bvn,
      };

      const response = await this.client.post('/verify_id', payload);

      const verified = response.data.result === 'VERIFIED';
      logger.info('BVN verification result', { userId, verified });

      return verified;
    } catch (error: any) {
      logger.error('BVN verification failed', {
        error: error.response?.data || error.message,
        userId,
      });
      return false;
    }
  }

  /**
   * Verify biometric by comparing live image against baseline
   * Used for milestone handshakes and payment authorization
   */
  async verifyBiometric(
    request: BiometricComparisonRequest
  ): Promise<BiometricComparisonResponse> {
    try {
      logger.info('Starting biometric comparison', {
        userId: request.userId,
        passportId: request.passportId,
        verificationType: request.verificationType,
      });

      const payload = {
        partner_id: this.config.partnerId,
        user_id: request.smileIdUserId,
        job_type: 'biometric_kyc',
        source_image: request.baselineImageHash, // Baseline on file
        target_image: request.liveImageBase64,   // Live capture
        liveness_check: true,
        metadata: {
          ...request.metadata,
          verification_type: request.verificationType,
          passport_id: request.passportId,
        },
      };

      const response = await this.client.post('/compare', payload);

      const data = response.data;
      const sessionId = data.job_id || `session_${Date.now()}`;
      
      // Check if verification passed
      const isMatch = data.result === 'MATCH';
      const livenessDetected = data.liveness === 'PASSED';
      const confidence = data.confidence || 0;

      // Determine face match status
      let faceMatch: 'VERIFIED' | 'FAILED' | 'REVIEW_REQUIRED' = 'FAILED';
      if (isMatch && livenessDetected && confidence >= 0.95) {
        faceMatch = 'VERIFIED';
      } else if (confidence >= 0.90 && confidence < 0.95) {
        faceMatch = 'REVIEW_REQUIRED';
      }

      logger.info('Biometric comparison result', {
        userId: request.userId,
        faceMatch,
        confidence,
        livenessDetected,
      });

      return {
        success: isMatch && livenessDetected && confidence >= 0.95,
        sessionId,
        confidence,
        livenessDetected,
        faceMatch,
      };
    } catch (error: any) {
      logger.error('Biometric verification failed', {
        error: error.response?.data || error.message,
        userId: request.userId,
      });

      return {
        success: false,
        sessionId: `error_${Date.now()}`,
        confidence: 0,
        livenessDetected: false,
        faceMatch: 'FAILED',
        errorMessage: error.response?.data?.message || error.message || 'Biometric verification failed',
      };
    }
  }

  /**
   * Generate signature for webhook validation
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.apiKey)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

export const smileIDService = new SmileIDService();
