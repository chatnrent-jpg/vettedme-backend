/**
 * Test Configuration for VETTED Platform
 * 
 * Centralized configuration for all test suites
 */

export const testConfig = {
  // API Configuration
  api: {
    baseUrl: process.env.TEST_API_URL || 'http://localhost:8080/api/v1',
    timeout: 10000, // 10 seconds
    retries: 3,
  },

  // Test User Credentials
  users: {
    admin: {
      email: 'admin@vetted.test',
      password: 'test_admin_password_123',
      role: 'ADMIN'
    },
    business: {
      email: 'business@vetted.test',
      password: 'test_business_password_123',
      role: 'BUSINESS'
    },
    talent: {
      email: 'talent@vetted.test',
      password: 'test_talent_password_123',
      role: 'TALENT'
    }
  },

  // Mock Service Configuration
  mocks: {
    smileId: {
      enabled: true,
      successRate: 0.98, // 98% success rate
      testApiKey: 'test_smile_id_api_key',
      testPartnerId: 'test_partner_001'
    },
    airwallex: {
      enabled: true,
      successRate: 0.99, // 99% success rate
      testApiKey: 'test_airwallex_api_key',
      testClientId: 'test_client_001'
    }
  },

  // Webhook Configuration
  webhooks: {
    airwallex: {
      secretKey: process.env.AIRWALLEX_WEBHOOK_SECRET_KEY || 'whsec_test_secret_key_12345',
      depositPath: '/webhooks/airwallex/deposit',
      payoutPath: '/webhooks/airwallex/payout'
    },
    smileId: {
      secretKey: process.env.SMILE_ID_WEBHOOK_SECRET || 'whsec_smile_test_12345',
      path: '/webhooks/vettedme'
    }
  },

  // Test Data
  testData: {
    contract: {
      id: 'contract_test_001',
      amount: 12500.00,
      currency: 'USD',
      milestones: 3
    },
    milestone: {
      id: 'ms_test_milestone_001',
      amount: 4166.67,
      currency: 'USD',
      title: 'Test Milestone - Backend API'
    },
    talent: {
      id: 'user_test_talent_001',
      name: 'Test Contractor',
      email: 'contractor@vetted.test',
      nin: 'test_nin_12345678901',
      bvn: 'test_bvn_22222222222'
    },
    business: {
      id: 'user_test_business_001',
      name: 'Test Company Inc',
      email: 'company@vetted.test'
    }
  },

  // Skill Assessment Configuration
  skillAssessment: {
    tier1: {
      name: 'Portfolio Audit',
      passingScore: 75,
      maxScore: 100
    },
    tier2: {
      name: 'Code Lab',
      passingScore: 70,
      maxScore: 100
    },
    tier3: {
      name: 'AI Viva',
      passingScore: 80,
      maxScore: 100
    },
    overallPassingScore: 75
  },

  // Biometric Configuration
  biometric: {
    minConfidence: 95.0,
    livenessRequired: true,
    faceMatchThreshold: 95.0,
    fraudScoreThreshold: 30.0 // Above this is considered fraud
  },

  // Payment Configuration
  payment: {
    platformFeePercentage: 15, // 15%
    fxMarkupPercentage: 0.75,  // 0.75%
    minContractAmount: 1000,    // $1,000 minimum
    maxContractAmount: 100000   // $100,000 maximum
  },

  // Audit Trail Configuration
  audit: {
    enabled: true,
    hashAlgorithm: 'sha256',
    retentionDays: 2555 // ~7 years
  },

  // Test Execution Configuration
  execution: {
    parallel: false, // Run tests sequentially by default
    verbose: true,
    captureScreenshots: false,
    saveResponses: true,
    maxTestDuration: 300000 // 5 minutes per test suite
  },

  // Database Configuration
  database: {
    useTestDatabase: true,
    testDatabaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/vetted_test',
    resetBetweenTests: true,
    seedData: true
  },

  // Environment
  environment: process.env.NODE_ENV || 'test',

  // Feature Flags (for toggling features during testing)
  features: {
    biometricVerification: true,
    w8benCompliance: true,
    fraudDetection: true,
    disputeArbitration: true,
    auditTrail: true
  }
};

export default testConfig;
