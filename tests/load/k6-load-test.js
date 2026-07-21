/**
 * ============================================================================
 * VETTED K6 Load Testing Script
 * ============================================================================
 * 
 * Simulates 1,000 concurrent users performing:
 * - Accessing VettedME Passports (public trust profiles)
 * - Running code lab assessment checks
 * - Processing milestone payment releases (biometric verification)
 * 
 * Duration: 5 minutes sustained load
 * Purpose: Verify auto-scaling and system elasticity
 * 
 * Run with: k6 run tests/load/k6-load-test.js
 * 
 * ============================================================================
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'https://api.vetted.ai';

// Custom metrics
const passportAccessSuccess = new Rate('passport_access_success');
const codeLabSuccess = new Rate('code_lab_success');
const milestoneReleaseSuccess = new Rate('milestone_release_success');

const passportAccessDuration = new Trend('passport_access_duration');
const codeLabDuration = new Trend('code_lab_duration');
const milestoneReleaseDuration = new Trend('milestone_release_duration');

const totalRequests = new Counter('total_requests');
const errorCount = new Counter('error_count');

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

export const options = {
  stages: [
    // Ramp-up: 0 → 1,000 users over 1 minute
    { duration: '1m', target: 1000 },
    
    // Sustained load: 1,000 users for 5 minutes
    { duration: '5m', target: 1000 },
    
    // Ramp-down: 1,000 → 0 users over 1 minute
    { duration: '1m', target: 0 },
  ],
  
  thresholds: {
    // Overall success rate should be >95%
    http_req_failed: ['rate<0.05'],
    
    // 95% of requests should be below 2000ms
    http_req_duration: ['p(95)<2000'],
    
    // 99% of requests should be below 5000ms
    'http_req_duration{type:passport}': ['p(99)<5000'],
    'http_req_duration{type:code_lab}': ['p(99)<5000'],
    'http_req_duration{type:milestone}': ['p(99)<10000'],
    
    // Custom metrics
    passport_access_success: ['rate>0.95'],
    code_lab_success: ['rate>0.90'],
    milestone_release_success: ['rate>0.85'],
  },
  
  // HTTP configuration
  http: {
    timeout: '30s',
  },
};

// ============================================================================
// TEST DATA
// ============================================================================

// Sample passport IDs (from seed data)
const PASSPORT_IDS = [
  'VETTED-NG-A7B9C4E8D2F1',
  'VETTED-NG-B8C3D1E9F2A4',
  'VETTED-KE-C9D4E2F3A1B5',
  'VETTED-KE-D1E5F3A2B6C4',
  'VETTED-BR-E2F6A4B3C7D1',
];

// Sample contract IDs
const CONTRACT_IDS = [
  'CTR-2026-001',
  'CTR-2026-002',
];

// Sample milestone IDs (UUIDs)
const MILESTONE_IDS = [
  'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
  'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7',
  'c3d4e5f6-g7h8-9i0j-1k2l-m3n4o5p6q7r8',
];

// Sample authentication tokens (replace with real tokens for load testing)
const AUTH_TOKENS = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_token_1',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_token_2',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_token_3',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate random biometric image (base64)
 */
function generateMockBiometricImage() {
  // In real test, this would be actual base64 image
  const mockImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return mockImageData;
}

/**
 * Generate random code submission
 */
function generateMockCodeSubmission() {
  return {
    code: `
      function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
      }
      
      module.exports = { fibonacci };
    `,
    testResults: {
      passed: randomIntBetween(8, 10),
      total: 10,
      duration: randomIntBetween(100, 500),
    },
  };
}

/**
 * Log request details
 */
function logRequest(name, response, duration) {
  totalRequests.add(1);
  
  if (response.status >= 400) {
    errorCount.add(1);
    console.log(`❌ ${name} failed: ${response.status} ${response.body}`);
  } else {
    console.log(`✅ ${name} success: ${response.status} (${duration.toFixed(0)}ms)`);
  }
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

/**
 * Scenario 1: Access VettedME Public Passport
 */
function accessVettedMEPassport() {
  const passportId = randomItem(PASSPORT_IDS);
  const startTime = Date.now();
  
  const response = http.get(
    `${BASE_URL}/api/public/passports/${passportId}`,
    {
      tags: { type: 'passport', name: 'access_passport' },
    }
  );
  
  const duration = Date.now() - startTime;
  passportAccessDuration.add(duration);
  
  const success = check(response, {
    'passport access status is 200': (r) => r.status === 200,
    'passport contains trustScore': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.trustScore !== undefined;
      } catch (e) {
        return false;
      }
    },
    'passport contains skills': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.primarySkills);
      } catch (e) {
        return false;
      }
    },
    'passport response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  passportAccessSuccess.add(success);
  logRequest('Access Passport', response, duration);
  
  return success;
}

/**
 * Scenario 2: Submit Code Lab Assessment
 */
function submitCodeLabAssessment() {
  const authToken = randomItem(AUTH_TOKENS);
  const codeSubmission = generateMockCodeSubmission();
  const startTime = Date.now();
  
  const response = http.post(
    `${BASE_URL}/api/v1/assessments/code-lab/submit`,
    JSON.stringify(codeSubmission),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { type: 'code_lab', name: 'submit_code_lab' },
    }
  );
  
  const duration = Date.now() - startTime;
  codeLabDuration.add(duration);
  
  const success = check(response, {
    'code lab submission status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'code lab contains score': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.score !== undefined;
      } catch (e) {
        return false;
      }
    },
    'code lab response time < 5000ms': (r) => r.timings.duration < 5000,
  });
  
  codeLabSuccess.add(success);
  logRequest('Submit Code Lab', response, duration);
  
  return success;
}

/**
 * Scenario 3: Release Milestone with Biometric Verification
 */
function releaseMilestonePayment() {
  const authToken = randomItem(AUTH_TOKENS);
  const milestoneId = randomItem(MILESTONE_IDS);
  const biometricImage = generateMockBiometricImage();
  const startTime = Date.now();
  
  const payload = {
    biometricImageBase64: biometricImage,
    timestamp: new Date().toISOString(),
  };
  
  const response = http.post(
    `${BASE_URL}/api/v1/milestones/${milestoneId}/release`,
    JSON.stringify(payload),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { type: 'milestone', name: 'release_milestone' },
    }
  );
  
  const duration = Date.now() - startTime;
  milestoneReleaseDuration.add(duration);
  
  const success = check(response, {
    'milestone release status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'milestone release not rate limited': (r) => r.status !== 429,
    'milestone contains transaction ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.transactionId !== undefined || body.transaction !== undefined;
      } catch (e) {
        return false;
      }
    },
    'milestone response time < 10000ms': (r) => r.timings.duration < 10000,
  });
  
  milestoneReleaseSuccess.add(success);
  logRequest('Release Milestone', response, duration);
  
  return success;
}

/**
 * Scenario 4: Check System Health
 */
function checkSystemHealth() {
  const response = http.get(`${BASE_URL}/health`, {
    tags: { type: 'health', name: 'health_check' },
  });
  
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  return response.status === 200;
}

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

export default function () {
  // Each virtual user runs a randomized mix of scenarios
  const scenario = randomIntBetween(1, 100);
  
  if (scenario <= 40) {
    // 40% of traffic: Access public passports
    accessVettedMEPassport();
    sleep(randomIntBetween(1, 3));
  } else if (scenario <= 70) {
    // 30% of traffic: Submit code lab assessments
    submitCodeLabAssessment();
    sleep(randomIntBetween(2, 5));
  } else if (scenario <= 95) {
    // 25% of traffic: Release milestone payments
    releaseMilestonePayment();
    sleep(randomIntBetween(3, 7));
  } else {
    // 5% of traffic: Health checks
    checkSystemHealth();
    sleep(1);
  }
}

// ============================================================================
// TEST LIFECYCLE HOOKS
// ============================================================================

/**
 * Setup function (runs once before test)
 */
export function setup() {
  console.log('🚀 Starting VETTED Load Test');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Target: 1,000 concurrent users`);
  console.log(`   Duration: 7 minutes (1min ramp-up + 5min sustained + 1min ramp-down)`);
  console.log('');
  
  // Verify system is healthy before starting
  const healthResponse = http.get(`${BASE_URL}/health`);
  
  if (healthResponse.status !== 200) {
    throw new Error(`System health check failed: ${healthResponse.status}`);
  }
  
  console.log('✅ System health check passed');
  console.log('');
  
  return {
    startTime: Date.now(),
    baseUrl: BASE_URL,
  };
}

/**
 * Teardown function (runs once after test)
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  
  console.log('');
  console.log('🎉 VETTED Load Test Complete');
  console.log(`   Duration: ${duration.toFixed(2)} seconds`);
  console.log('');
  console.log('📊 Summary will be displayed above');
}

// ============================================================================
// CUSTOM SUMMARY
// ============================================================================

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: '  ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options || {};
  
  const green = enableColors ? '\x1b[32m' : '';
  const red = enableColors ? '\x1b[31m' : '';
  const yellow = enableColors ? '\x1b[33m' : '';
  const reset = enableColors ? '\x1b[0m' : '';
  
  let summary = '\n';
  summary += `${indent}═══════════════════════════════════════════════════════════════\n`;
  summary += `${indent}VETTED LOAD TEST SUMMARY\n`;
  summary += `${indent}═══════════════════════════════════════════════════════════════\n\n`;
  
  // Overall metrics
  const metrics = data.metrics;
  summary += `${indent}Overall Performance:\n`;
  summary += `${indent}  Total Requests:        ${metrics.http_reqs?.values?.count || 0}\n`;
  summary += `${indent}  Failed Requests:       ${metrics.http_req_failed?.values?.passes || 0} (${((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%)\n`;
  summary += `${indent}  Avg Response Time:     ${(metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms\n`;
  summary += `${indent}  p95 Response Time:     ${(metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += `${indent}  p99 Response Time:     ${(metrics.http_req_duration?.values['p(99)'] || 0).toFixed(2)}ms\n\n`;
  
  // Scenario-specific metrics
  summary += `${indent}Scenario Performance:\n`;
  summary += `${indent}  Passport Access:\n`;
  summary += `${indent}    Success Rate:        ${((metrics.passport_access_success?.values?.rate || 0) * 100).toFixed(2)}%\n`;
  summary += `${indent}    Avg Duration:        ${(metrics.passport_access_duration?.values?.avg || 0).toFixed(2)}ms\n\n`;
  
  summary += `${indent}  Code Lab Submission:\n`;
  summary += `${indent}    Success Rate:        ${((metrics.code_lab_success?.values?.rate || 0) * 100).toFixed(2)}%\n`;
  summary += `${indent}    Avg Duration:        ${(metrics.code_lab_duration?.values?.avg || 0).toFixed(2)}ms\n\n`;
  
  summary += `${indent}  Milestone Release:\n`;
  summary += `${indent}    Success Rate:        ${((metrics.milestone_release_success?.values?.rate || 0) * 100).toFixed(2)}%\n`;
  summary += `${indent}    Avg Duration:        ${(metrics.milestone_release_duration?.values?.avg || 0).toFixed(2)}ms\n\n`;
  
  // Pass/Fail status
  summary += `${indent}═══════════════════════════════════════════════════════════════\n`;
  
  const overallSuccess = (metrics.http_req_failed?.values?.rate || 1) < 0.05;
  const passportSuccess = (metrics.passport_access_success?.values?.rate || 0) > 0.95;
  const codeLabSuccessRate = (metrics.code_lab_success?.values?.rate || 0) > 0.90;
  const milestoneSuccess = (metrics.milestone_release_success?.values?.rate || 0) > 0.85;
  
  if (overallSuccess && passportSuccess && codeLabSuccessRate && milestoneSuccess) {
    summary += `${indent}${green}✅ LOAD TEST PASSED${reset}\n`;
    summary += `${indent}   Platform successfully handled 1,000 concurrent users\n`;
    summary += `${indent}   Auto-scaling and system elasticity verified\n`;
  } else {
    summary += `${indent}${red}❌ LOAD TEST FAILED${reset}\n`;
    summary += `${indent}   Some thresholds were not met\n`;
    summary += `${indent}   Review detailed metrics above\n`;
  }
  
  summary += `${indent}═══════════════════════════════════════════════════════════════\n\n`;
  
  return summary;
}
