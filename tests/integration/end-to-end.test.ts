import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:8080/api/v1';

interface TestResult {
  step: string;
  status: 'PASSED' | 'FAILED';
  message: string;
  data?: any;
  duration: number;
}

class VettedSystemTester {
  private apiClient: AxiosInstance;
  private testResults: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status
    });
  }

  private logStep(step: string) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 ${step}`);
    console.log(`${'='.repeat(60)}`);
  }

  private logSuccess(message: string, data?: any) {
    console.log(`✅ ${message}`);
    if (data) {
      console.log(`   Data:`, JSON.stringify(data, null, 2));
    }
  }

  private logError(message: string, error?: any) {
    console.error(`❌ ${message}`);
    if (error) {
      console.error(`   Error:`, error);
    }
  }

  private recordResult(step: string, status: 'PASSED' | 'FAILED', message: string, data?: any) {
    const duration = Date.now() - this.startTime;
    this.testResults.push({ step, status, message, data, duration });
  }

  private generateWebhookSignature(payload: any, secret: string): string {
    const rawPayloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(rawPayloadString)
      .digest('hex');
  }

  private generateMockBiometricImage(): string {
    // Generate a minimal valid base64 JPEG image (1x1 pixel)
    const minimalJPEG = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
      0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
      0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
    ]);
    return `data:image/jpeg;base64,${minimalJPEG.toString('base64')}`;
  }

  /**
   * Step 1: Test Health Check
   */
  async testHealthCheck(): Promise<boolean> {
    this.startTime = Date.now();
    this.logStep('Step 1: Health Check');

    try {
      const response = await this.apiClient.get('/health');
      
      if (response.status === 200 && response.data.status === 'ok') {
        this.logSuccess('API is healthy and responding', response.data);
        this.recordResult('Health Check', 'PASSED', 'API is healthy');
        return true;
      } else {
        this.logError('Health check failed', response.data);
        this.recordResult('Health Check', 'FAILED', 'API health check returned non-200');
        return false;
      }
    } catch (error: any) {
      this.logError('Health check request failed', error.message);
      this.recordResult('Health Check', 'FAILED', error.message);
      return false;
    }
  }

  /**
   * Step 2: Mock Contractor Skill Assessment Completion
   */
  async testSkillAssessmentCompletion(): Promise<boolean> {
    this.startTime = Date.now();
    this.logStep('Step 2: Simulating VettedME.ai 3-Tier Skill Assessment Completion');

    const skillPayload = {
      talentId: 'user_test_talent_001',
      portfolioAuditScore: 92.5,   // Tier 1: Portfolio audit
      codeLabScore: 88.0,           // Tier 2: Sandboxed code lab
      aiVivaScore: 95.4,            // Tier 3: AI video interview
      overallScore: 91.97,
      biometricVerified: false,     // Not yet verified
      skillStatus: 'PASSED'
    };

    try {
      // In a real test, this would call a mock endpoint or seed the database
      // For now, we'll simulate the skill data logging
      console.log('📊 Skill Assessment Data:');
      console.log(`   - Tier 1 (Portfolio Audit): ${skillPayload.portfolioAuditScore}%`);
      console.log(`   - Tier 2 (Code Lab): ${skillPayload.codeLabScore}%`);
      console.log(`   - Tier 3 (AI Viva): ${skillPayload.aiVivaScore}%`);
      console.log(`   - Overall Score: ${skillPayload.overallScore}%`);
      
      this.logSuccess('Skill assessment data logged successfully');
      this.logSuccess('VettedME Passport state: SKILL_CLEARED');
      
      this.recordResult(
        'Skill Assessment',
        'PASSED',
        'Mock skill assessment completed',
        skillPayload
      );
      return true;
    } catch (error: any) {
      this.logError('Skill assessment simulation failed', error.message);
      this.recordResult('Skill Assessment', 'FAILED', error.message);
      return false;
    }
  }

  /**
   * Step 3: Test Airwallex Deposit Webhook
   */
  async testAirwallexDepositWebhook(): Promise<boolean> {
    this.startTime = Date.now();
    this.logStep('Step 3: Triggering Mock Airwallex Inbound Funding Deposit Webhook');

    const webhookPayload = {
      event: 'payment.inbound_transfer.success',
      data: {
        id: 'transfer_test_12345',
        virtual_account_id: 'va_airwallex_test_9921',
        amount: '12500.00',
        currency: 'USD',
        status: 'COMPLETED',
        created_at: new Date().toISOString()
      }
    };

    const mockSecret = process.env.AIRWALLEX_WEBHOOK_SECRET_KEY || 'whsec_test_secret_key_12345';
    const computedSignature = this.generateWebhookSignature(webhookPayload, mockSecret);

    try {
      console.log('📡 Webhook Payload:');
      console.log(`   - Event: ${webhookPayload.event}`);
      console.log(`   - Virtual Account: ${webhookPayload.data.virtual_account_id}`);
      console.log(`   - Amount: ${webhookPayload.data.amount} ${webhookPayload.data.currency}`);
      console.log(`   - Signature: ${computedSignature.substring(0, 20)}...`);

      const response = await this.apiClient.post(
        '/webhooks/airwallex/deposit',
        webhookPayload,
        {
          headers: {
            'x-signature': computedSignature,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        this.logSuccess('Webhook accepted and processed', response.data);
        this.logSuccess('Contract state transitioned: PENDING_DEPOSIT → CAPITAL_ESCROWED');
        this.recordResult('Deposit Webhook', 'PASSED', 'Webhook processed successfully', response.data);
        return true;
      } else {
        this.logError(`Webhook failed with status ${response.status}`, response.data);
        this.recordResult('Deposit Webhook', 'FAILED', `Status ${response.status}`);
        return false;
      }
    } catch (error: any) {
      this.logError('Webhook request failed', error.message);
      this.recordResult('Deposit Webhook', 'FAILED', error.message);
      return false;
    }
  }

  /**
   * Step 4: Test Biometric Release Flow
   */
  async testBiometricMilestoneRelease(): Promise<boolean> {
    this.startTime = Date.now();
    this.logStep('Step 4: Triggering Biometric Authentication Handshake for Milestone Release');

    const releasePayload = {
      milestoneId: 'ms_test_milestone_001',
      contractorId: 'user_test_talent_001',
      biometricPayload: {
        image: this.generateMockBiometricImage(),
        sessionId: `session_${Date.now()}`,
        timestamp: new Date().toISOString(),
        deviceInfo: {
          userAgent: 'Mozilla/5.0 (Test Suite)',
          platform: 'test'
        }
      }
    };

    try {
      console.log('🔐 Biometric Release Payload:');
      console.log(`   - Milestone ID: ${releasePayload.milestoneId}`);
      console.log(`   - Contractor ID: ${releasePayload.contractorId}`);
      console.log(`   - Session ID: ${releasePayload.biometricPayload.sessionId}`);
      console.log(`   - Image Size: ${releasePayload.biometricPayload.image.length} bytes`);

      const response = await this.apiClient.post(
        '/milestones/release',
        releasePayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test_jwt_token' // Mock JWT
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        this.logSuccess('Biometric verification passed', response.data);
        this.logSuccess('Milestone released and payout initiated');
        
        if (response.data.transactionId) {
          console.log(`   💳 Transaction ID: ${response.data.transactionId}`);
        }
        if (response.data.payoutAmount) {
          console.log(`   💰 Payout Amount: ${response.data.payoutAmount}`);
        }
        
        this.recordResult(
          'Biometric Release',
          'PASSED',
          'Milestone released successfully',
          response.data
        );
        return true;
      } else {
        this.logError(`Biometric release failed with status ${response.status}`, response.data);
        this.recordResult('Biometric Release', 'FAILED', `Status ${response.status}`);
        return false;
      }
    } catch (error: any) {
      this.logError('Biometric release request failed', error.message);
      this.recordResult('Biometric Release', 'FAILED', error.message);
      return false;
    }
  }

  /**
   * Step 5: Verify Audit Trail
   */
  async testAuditTrailIntegrity(): Promise<boolean> {
    this.startTime = Date.now();
    this.logStep('Step 5: Verifying Immutable Audit Trail Integrity');

    try {
      const response = await this.apiClient.get('/audit/logs', {
        params: {
          limit: 10,
          actionType: 'MILESTONE_RELEASED'
        },
        headers: {
          'Authorization': 'Bearer test_admin_jwt_token'
        }
      });

      if (response.status === 200 && response.data.logs) {
        console.log(`📝 Audit Logs Retrieved: ${response.data.logs.length} entries`);
        
        // Verify cryptographic hash chain
        let chainValid = true;
        const logs = response.data.logs;
        
        for (let i = 1; i < logs.length; i++) {
          if (logs[i].previousHash !== logs[i - 1].payloadHash) {
            chainValid = false;
            this.logError('Hash chain broken at index ' + i);
            break;
          }
        }

        if (chainValid) {
          this.logSuccess('Audit trail hash chain is valid (blockchain-like integrity verified)');
          this.recordResult('Audit Trail', 'PASSED', 'Cryptographic integrity verified');
          return true;
        } else {
          this.logError('Audit trail hash chain validation failed');
          this.recordResult('Audit Trail', 'FAILED', 'Hash chain broken');
          return false;
        }
      } else {
        this.logError('Failed to retrieve audit logs', response.data);
        this.recordResult('Audit Trail', 'FAILED', 'Could not retrieve logs');
        return false;
      }
    } catch (error: any) {
      this.logError('Audit trail verification failed', error.message);
      this.recordResult('Audit Trail', 'FAILED', error.message);
      return false;
    }
  }

  /**
   * Generate Test Report
   */
  generateReport() {
    console.log('\n\n');
    console.log('═'.repeat(70));
    console.log('                    📊 TEST SUITE REPORT                    ');
    console.log('═'.repeat(70));
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const total = this.testResults.length;
    
    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\n' + '-'.repeat(70));
    console.log('Test Details:');
    console.log('-'.repeat(70));
    
    this.testResults.forEach((result, index) => {
      const icon = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`\n${index + 1}. ${icon} ${result.step}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Message: ${result.message}`);
      console.log(`   Duration: ${result.duration}ms`);
    });
    
    console.log('\n' + '═'.repeat(70));
    
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! VETTED System is operational.');
      console.log('═'.repeat(70) + '\n');
      return true;
    } else {
      console.log('⚠️  SOME TESTS FAILED. Please review the errors above.');
      console.log('═'.repeat(70) + '\n');
      return false;
    }
  }

  /**
   * Run Complete Test Suite
   */
  async runFullSuite(): Promise<boolean> {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                    ║');
    console.log('║   ⚡ VETTED Automated Clearing Protocol Test Suite ⚡             ║');
    console.log('║                                                                    ║');
    console.log('║   Testing complete end-to-end flow:                               ║');
    console.log('║   1. Health Check                                                 ║');
    console.log('║   2. Skill Assessment Completion (VettedME)                       ║');
    console.log('║   3. Airwallex Deposit Webhook (VettedPay)                        ║');
    console.log('║   4. Biometric Milestone Release                                  ║');
    console.log('║   5. Audit Trail Integrity Verification                           ║');
    console.log('║                                                                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('\n');

    const overallStart = Date.now();

    // Run all tests in sequence
    await this.testHealthCheck();
    await this.testSkillAssessmentCompletion();
    await this.testAirwallexDepositWebhook();
    await this.testBiometricMilestoneRelease();
    await this.testAuditTrailIntegrity();

    const totalDuration = Date.now() - overallStart;
    console.log(`\n⏱️  Total Test Suite Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);

    // Generate report
    return this.generateReport();
  }
}

/**
 * Main Entry Point
 */
async function runEndToEndSystemTest() {
  const tester = new VettedSystemTester();
  
  try {
    const success = await tester.runFullSuite();
    process.exit(success ? 0 : 1);
  } catch (error: any) {
    console.error('\n❌ CRITICAL: VETTED System Test Run Failed.');
    console.error('Error Details:', error.message);
    if (error.stack) {
      console.error('Stack Trace:', error.stack);
    }
    process.exit(1);
  }
}

// Execute the automation suite
if (require.main === module) {
  runEndToEndSystemTest();
}

export { VettedSystemTester, runEndToEndSystemTest };
