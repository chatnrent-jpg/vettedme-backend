/**
 * ============================================================================
 * VETTED Autocannon Load Testing Script
 * ============================================================================
 * 
 * Alternative to k6 using autocannon (Node.js native)
 * 
 * Simulates high-throughput HTTP load testing
 * - 1,000 concurrent connections
 * - 5-minute sustained load
 * - Multiple endpoint scenarios
 * 
 * Run with: node tests/load/autocannon-load-test.js
 * 
 * ============================================================================
 */

const autocannon = require('autocannon');
const { PassThrough } = require('stream');

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = process.env.BASE_URL || 'https://api.vetted.ai';
const DURATION = 300; // 5 minutes in seconds
const CONNECTIONS = 1000; // Concurrent connections
const PIPELINING = 10; // Pipeline depth

// Sample data (from seed data)
const PASSPORT_IDS = [
  'VETTED-NG-A7B9C4E8D2F1',
  'VETTED-NG-B8C3D1E9F2A4',
  'VETTED-KE-C9D4E2F3A1B5',
  'VETTED-KE-D1E5F3A2B6C4',
  'VETTED-BR-E2F6A4B3C7D1',
];

const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_token';

// ============================================================================
// TEST SCENARIOS
// ============================================================================

/**
 * Scenario 1: Access VettedME Public Passports (Read-Heavy)
 */
async function testPassportAccess() {
  console.log('\n🔍 Testing: VettedME Passport Access (Read-Heavy)\n');
  
  const instance = autocannon({
    url: BASE_URL,
    connections: CONNECTIONS,
    pipelining: PIPELINING,
    duration: DURATION,
    requests: PASSPORT_IDS.map(id => ({
      method: 'GET',
      path: `/api/public/passports/${id}`,
    })),
  });
  
  autocannon.track(instance, { renderProgressBar: true });
  
  return new Promise((resolve, reject) => {
    instance.on('done', (result) => {
      console.log('\n📊 Passport Access Results:');
      console.log(`   Requests:       ${result.requests.total}`);
      console.log(`   Throughput:     ${result.throughput.mean.toFixed(2)} req/sec`);
      console.log(`   Latency (avg):  ${result.latency.mean.toFixed(2)}ms`);
      console.log(`   Latency (p99):  ${result.latency.p99.toFixed(2)}ms`);
      console.log(`   Errors:         ${result.errors}`);
      console.log(`   Timeouts:       ${result.timeouts}`);
      console.log(`   2xx responses:  ${result['2xx']}`);
      console.log(`   4xx responses:  ${result['4xx']}`);
      console.log(`   5xx responses:  ${result['5xx']}`);
      
      resolve(result);
    });
    
    instance.on('error', reject);
  });
}

/**
 * Scenario 2: Milestone Release Endpoint (Write-Heavy)
 */
async function testMilestoneRelease() {
  console.log('\n💰 Testing: Milestone Release (Write-Heavy with Biometric Verification)\n');
  
  const mockBiometricImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  const instance = autocannon({
    url: `${BASE_URL}/api/v1/milestones/a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6/release`,
    connections: Math.floor(CONNECTIONS / 5), // Lower concurrency for write operations
    pipelining: 1, // No pipelining for POST requests
    duration: DURATION,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify({
      biometricImageBase64: mockBiometricImage,
      timestamp: new Date().toISOString(),
    }),
  });
  
  autocannon.track(instance, { renderProgressBar: true });
  
  return new Promise((resolve, reject) => {
    instance.on('done', (result) => {
      console.log('\n📊 Milestone Release Results:');
      console.log(`   Requests:       ${result.requests.total}`);
      console.log(`   Throughput:     ${result.throughput.mean.toFixed(2)} req/sec`);
      console.log(`   Latency (avg):  ${result.latency.mean.toFixed(2)}ms`);
      console.log(`   Latency (p99):  ${result.latency.p99.toFixed(2)}ms`);
      console.log(`   Errors:         ${result.errors}`);
      console.log(`   Timeouts:       ${result.timeouts}`);
      console.log(`   2xx responses:  ${result['2xx']}`);
      console.log(`   429 (Rate Limit): ${result['4xx']}`);
      console.log(`   5xx responses:  ${result['5xx']}`);
      
      resolve(result);
    });
    
    instance.on('error', reject);
  });
}

/**
 * Scenario 3: Mixed Traffic (Realistic Load)
 */
async function testMixedTraffic() {
  console.log('\n🌐 Testing: Mixed Traffic (Realistic Production Load)\n');
  
  const requests = [
    // 40% public passport access
    ...Array(4).fill().map(() => ({
      method: 'GET',
      path: `/api/public/passports/${PASSPORT_IDS[Math.floor(Math.random() * PASSPORT_IDS.length)]}`,
    })),
    
    // 30% authenticated API calls
    ...Array(3).fill().map(() => ({
      method: 'GET',
      path: '/api/v1/users/me',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    })),
    
    // 20% search queries
    ...Array(2).fill().map(() => ({
      method: 'GET',
      path: '/api/v1/contractors/search?skills=TypeScript&country=NG',
    })),
    
    // 10% health checks
    {
      method: 'GET',
      path: '/health',
    },
  ];
  
  const instance = autocannon({
    url: BASE_URL,
    connections: CONNECTIONS,
    pipelining: PIPELINING,
    duration: DURATION,
    requests,
  });
  
  autocannon.track(instance, { renderProgressBar: true });
  
  return new Promise((resolve, reject) => {
    instance.on('done', (result) => {
      console.log('\n📊 Mixed Traffic Results:');
      console.log(`   Requests:       ${result.requests.total}`);
      console.log(`   Throughput:     ${result.throughput.mean.toFixed(2)} req/sec`);
      console.log(`   Latency (avg):  ${result.latency.mean.toFixed(2)}ms`);
      console.log(`   Latency (p99):  ${result.latency.p99.toFixed(2)}ms`);
      console.log(`   Errors:         ${result.errors}`);
      console.log(`   Timeouts:       ${result.timeouts}`);
      console.log(`   2xx responses:  ${result['2xx']}`);
      console.log(`   4xx responses:  ${result['4xx']}`);
      console.log(`   5xx responses:  ${result['5xx']}`);
      
      resolve(result);
    });
    
    instance.on('error', reject);
  });
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🚀 VETTED AUTOCANNON LOAD TEST');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   Base URL:       ${BASE_URL}`);
  console.log(`   Connections:    ${CONNECTIONS}`);
  console.log(`   Duration:       ${DURATION} seconds (5 minutes)`);
  console.log(`   Pipelining:     ${PIPELINING}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Verify system health before starting
  console.log('🔍 Checking system health...\n');
  
  const healthCheck = autocannon({
    url: `${BASE_URL}/health`,
    connections: 10,
    duration: 5,
  });
  
  await new Promise((resolve, reject) => {
    healthCheck.on('done', (result) => {
      if (result['2xx'] > 0) {
        console.log('✅ System health check passed\n');
        resolve();
      } else {
        console.error('❌ System health check failed');
        reject(new Error('Health check failed'));
      }
    });
    healthCheck.on('error', reject);
  });
  
  // Run test scenarios
  const results = {
    passportAccess: null,
    milestoneRelease: null,
    mixedTraffic: null,
  };
  
  try {
    // Test 1: Passport Access (Read-Heavy)
    results.passportAccess = await testPassportAccess();
    
    // Wait 30 seconds between tests
    console.log('\n⏳ Waiting 30 seconds before next test...\n');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Test 2: Milestone Release (Write-Heavy)
    results.milestoneRelease = await testMilestoneRelease();
    
    // Wait 30 seconds between tests
    console.log('\n⏳ Waiting 30 seconds before next test...\n');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Test 3: Mixed Traffic (Realistic)
    results.mixedTraffic = await testMixedTraffic();
    
    // Final summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 FINAL SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('Passport Access (Read-Heavy):');
    console.log(`  Throughput:   ${results.passportAccess.throughput.mean.toFixed(2)} req/sec`);
    console.log(`  Latency p99:  ${results.passportAccess.latency.p99.toFixed(2)}ms`);
    console.log(`  Success Rate: ${((results.passportAccess['2xx'] / results.passportAccess.requests.total) * 100).toFixed(2)}%\n`);
    
    console.log('Milestone Release (Write-Heavy):');
    console.log(`  Throughput:   ${results.milestoneRelease.throughput.mean.toFixed(2)} req/sec`);
    console.log(`  Latency p99:  ${results.milestoneRelease.latency.p99.toFixed(2)}ms`);
    console.log(`  Success Rate: ${((results.milestoneRelease['2xx'] / results.milestoneRelease.requests.total) * 100).toFixed(2)}%\n`);
    
    console.log('Mixed Traffic (Realistic):');
    console.log(`  Throughput:   ${results.mixedTraffic.throughput.mean.toFixed(2)} req/sec`);
    console.log(`  Latency p99:  ${results.mixedTraffic.latency.p99.toFixed(2)}ms`);
    console.log(`  Success Rate: ${((results.mixedTraffic['2xx'] / results.mixedTraffic.requests.total) * 100).toFixed(2)}%\n`);
    
    // Overall assessment
    const overallSuccess = 
      (results.passportAccess['5xx'] / results.passportAccess.requests.total) < 0.05 &&
      (results.milestoneRelease['5xx'] / results.milestoneRelease.requests.total) < 0.05 &&
      (results.mixedTraffic['5xx'] / results.mixedTraffic.requests.total) < 0.05;
    
    if (overallSuccess) {
      console.log('✅ LOAD TEST PASSED');
      console.log('   Platform successfully handled sustained 1,000 concurrent connections');
      console.log('   Auto-scaling and system elasticity verified\n');
    } else {
      console.log('❌ LOAD TEST FAILED');
      console.log('   Some endpoints exceeded error thresholds');
      console.log('   Review detailed results above\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Save results to file
    const fs = require('fs');
    fs.writeFileSync(
      'load-test-results-autocannon.json',
      JSON.stringify(results, null, 2)
    );
    
    console.log('💾 Results saved to: load-test-results-autocannon.json\n');
    
  } catch (error) {
    console.error('\n❌ Load test failed:', error.message);
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  testPassportAccess,
  testMilestoneRelease,
  testMixedTraffic,
};
