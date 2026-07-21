/**
 * Test Helper Utilities for VETTED Platform
 * 
 * Common utilities used across all test suites
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Generate a valid JWT token for testing
 */
export function generateTestJWT(
  userId: string,
  role: 'ADMIN' | 'BUSINESS' | 'TALENT',
  expiresIn: string = '1h'
): string {
  const secret = process.env.JWT_SECRET || 'test_jwt_secret_key';
  
  return jwt.sign(
    {
      userId,
      role,
      email: `${role.toLowerCase()}@vetted.test`,
      iat: Math.floor(Date.now() / 1000)
    },
    secret,
    { expiresIn }
  );
}

/**
 * Generate HMAC SHA-256 signature for webhooks
 */
export function generateWebhookSignature(
  payload: any,
  secret: string
): string {
  const rawPayloadString = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', secret)
    .update(rawPayloadString)
    .digest('hex');
}

/**
 * Generate mock biometric image (minimal valid JPEG)
 */
export function generateMockBiometricImage(): string {
  const minimalJPEG = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
    0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
  ]);
  return `data:image/jpeg;base64,${minimalJPEG.toString('base64')}`;
}

/**
 * Generate random test ID
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Wait for a specified duration (for async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function until it succeeds or max retries reached
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        await wait(delayMs);
      }
    }
  }
  
  throw lastError;
}

/**
 * Generate mock skill assessment scores
 */
export function generateMockSkillScores(overallScore?: number): {
  tier1Score: number;
  tier2Score: number;
  tier3Score: number;
  overallScore: number;
} {
  const tier1 = overallScore ? overallScore + randomInRange(-5, 5) : randomInRange(80, 100);
  const tier2 = overallScore ? overallScore + randomInRange(-5, 5) : randomInRange(75, 95);
  const tier3 = overallScore ? overallScore + randomInRange(-5, 5) : randomInRange(85, 100);
  const overall = overallScore || (tier1 + tier2 + tier3) / 3;
  
  return {
    tier1Score: Math.round(tier1 * 10) / 10,
    tier2Score: Math.round(tier2 * 10) / 10,
    tier3Score: Math.round(tier3 * 10) / 10,
    overallScore: Math.round(overall * 10) / 10
  };
}

/**
 * Generate random number in range
 */
export function randomInRange(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/**
 * Generate mock contract data
 */
export function generateMockContract(overrides?: Partial<any>) {
  return {
    id: generateTestId('contract'),
    businessId: generateTestId('business'),
    contractorId: generateTestId('talent'),
    title: 'Test Contract - Full Stack Development',
    totalAmount: 12500.00,
    currency: 'USD',
    status: 'PENDING_DEPOSIT',
    milestones: 3,
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Generate mock milestone data
 */
export function generateMockMilestone(contractId: string, overrides?: Partial<any>) {
  return {
    id: generateTestId('milestone'),
    contractId,
    title: 'Test Milestone',
    description: 'Complete backend API development',
    amount: 4166.67,
    currency: 'USD',
    status: 'WORK_SUBMITTED',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Generate mock Airwallex deposit webhook payload
 */
export function generateMockDepositWebhook(
  virtualAccountId: string,
  amount: number,
  currency: string = 'USD'
) {
  return {
    event: 'payment.inbound_transfer.success',
    data: {
      id: generateTestId('transfer'),
      virtual_account_id: virtualAccountId,
      amount: amount.toFixed(2),
      currency: currency,
      status: 'COMPLETED',
      created_at: new Date().toISOString()
    }
  };
}

/**
 * Generate mock Airwallex payout webhook payload
 */
export function generateMockPayoutWebhook(
  payoutId: string,
  status: 'COMPLETED' | 'FAILED',
  amount: number,
  currency: string = 'USD'
) {
  return {
    event: status === 'COMPLETED' ? 'payout.completed' : 'payout.failed',
    data: {
      id: payoutId,
      status: status,
      amount: amount.toFixed(2),
      currency: currency,
      beneficiary_id: generateTestId('beneficiary'),
      reference: generateTestId('ref'),
      created_at: new Date().toISOString(),
      failure_reason: status === 'FAILED' ? 'Insufficient funds' : undefined
    }
  };
}

/**
 * Calculate platform fees
 */
export function calculatePlatformFees(amount: number): {
  baseAmount: number;
  platformFee: number;
  fxMarkup: number;
  totalFees: number;
  contractorPayout: number;
} {
  const platformFeePercentage = 0.15; // 15%
  const fxMarkupPercentage = 0.0075; // 0.75%
  
  const platformFee = amount * platformFeePercentage;
  const fxMarkup = amount * fxMarkupPercentage;
  const totalFees = platformFee + fxMarkup;
  const contractorPayout = amount - totalFees;
  
  return {
    baseAmount: Math.round(amount * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    fxMarkup: Math.round(fxMarkup * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100,
    contractorPayout: Math.round(contractorPayout * 100) / 100
  };
}

/**
 * Validate SHA-256 hash chain
 */
export function validateHashChain(logs: Array<{
  payloadHash: string;
  previousHash: string | null;
}>): boolean {
  if (logs.length === 0) return true;
  
  for (let i = 1; i < logs.length; i++) {
    if (logs[i].previousHash !== logs[i - 1].payloadHash) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generate SHA-256 hash
 */
export function generateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Pretty print test results
 */
export function printTestResults(results: Array<{
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}>) {
  console.log('\n' + '═'.repeat(70));
  console.log('                    TEST RESULTS SUMMARY                    ');
  console.log('═'.repeat(70));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  console.log('\n' + '-'.repeat(70));
  
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`\n${index + 1}. ${icon} ${result.name}`);
    console.log(`   Duration: ${result.duration}ms`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('\n' + '═'.repeat(70) + '\n');
}

/**
 * Create test logger
 */
export function createTestLogger(prefix: string = 'TEST') {
  return {
    info: (message: string, data?: any) => {
      console.log(`[${prefix}] ℹ️  ${message}`, data || '');
    },
    success: (message: string, data?: any) => {
      console.log(`[${prefix}] ✅ ${message}`, data || '');
    },
    error: (message: string, error?: any) => {
      console.error(`[${prefix}] ❌ ${message}`, error || '');
    },
    warn: (message: string, data?: any) => {
      console.warn(`[${prefix}] ⚠️  ${message}`, data || '');
    }
  };
}

/**
 * Assert helper (throws if condition is false)
 */
export function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Deep equal comparison
 */
export function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
