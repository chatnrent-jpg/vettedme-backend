# VETTED Test Suite

## 🧪 Quick Start

```bash
# Run end-to-end test suite (recommended)
npm run test:e2e

# Run all tests
npm run test:all

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode (for development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

---

## 📁 Directory Structure

```
tests/
├── integration/
│   └── end-to-end.test.ts          # Complete E2E test suite
├── mocks/
│   ├── SmileIDMock.ts              # Biometric verification mock
│   └── AirwallexMock.ts            # Payment API mock
├── utils/
│   └── testHelpers.ts              # Test utilities & helpers
├── test.config.ts                  # Centralized test configuration
└── README.md                       # This file
```

---

## 🎯 What Tests Cover

### **End-to-End Flow**
1. ✅ Health Check - API availability
2. ✅ Skill Assessment - VettedME 3-tier gauntlet
3. ✅ Deposit Webhook - Airwallex inbound funding
4. ✅ Biometric Release - Face verification + payout
5. ✅ Audit Trail - Cryptographic integrity

### **Mock Services**
- ✅ Smile ID (98% success rate)
- ✅ Airwallex (99% success rate)
- ✅ Webhook signature generation
- ✅ JWT token generation

---

## 📊 Expected Output

```
╔════════════════════════════════════════════╗
║  ⚡ VETTED Test Suite ⚡                   ║
╚════════════════════════════════════════════╝

Total Tests: 5
✅ Passed: 5
❌ Failed: 0
Success Rate: 100.0%

⏱️  Duration: 1.2s
```

---

## 🔧 Configuration

**Environment Variables:**
```bash
TEST_API_URL=http://localhost:8080/api/v1
AIRWALLEX_WEBHOOK_SECRET_KEY=your_secret
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/vetted_test
```

**Edit Configuration:**
- `tests/test.config.ts` - Main configuration file
- Adjust success rates, thresholds, test data

---

## 📚 Documentation

**Full documentation:** `../TESTING_COMPLETE.md`

**Quick Reference:**
- Writing custom tests
- Using mock services
- Test helpers
- CI/CD integration
- Troubleshooting

---

## ✅ Status

**Test Suite:** 100% Complete  
**Execution Time:** <30 seconds  
**External API Calls:** 0 (fully isolated)  
**Coverage:** Ready for CI/CD  

---

**Need help?** See `TESTING_COMPLETE.md` for comprehensive guide.
