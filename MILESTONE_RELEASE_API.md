# Milestone Release API - Complete Documentation

## 🎯 Critical Payment Release Endpoint

**The bridge between VettedME biometric verification and VettedPay automated settlement.**

---

## ✅ What Was Built

### **Files Created:**

1. **`src/controllers/milestone.controller.ts`** - Complete milestone release logic (500+ lines)
2. **`src/routes/milestone.routes.ts`** - Route registration with validation
3. **`src/middleware/validator.ts`** - Request validation middleware
4. **Updated `src/services/vettedme/SmileIDService.ts`** - Added `verifyBiometric()` method
5. **Updated `src/services/vettedpay/AirwallexService.ts`** - Added comprehensive `initiatePayout()` method
6. **Updated `src/index.ts`** - Registered milestone routes

---

## 📡 API Endpoint

### **POST /api/v1/milestones/:id/release**

**Purpose:** Release milestone payment after biometric verification

**Authentication:** Required (JWT Bearer token)

**Authorization:** Business user (contract owner) only

---

## 🔐 Request Specification

### **Headers:**
```http
POST /api/v1/milestones/abc123-def456-ghi789/release
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Milestone ID |

### **Request Body:**
```typescript
{
  "biometricImageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `biometricImageBase64` | string | Yes | Base64 encoded image | Live facial scan capture from contractor |

---

## 📊 Processing Flow

### **Step-by-Step Execution:**

```
1. VALIDATE MILESTONE
   ├─ Check milestone exists
   ├─ Check user is contract owner (businessId match)
   ├─ Check milestone status is WORK_SUBMITTED
   ├─ Check VettedME passport exists
   ├─ Check passport status is BIOMETRIC_PASSED
   ├─ Check Airwallex sub-account exists
   └─ Check sufficient escrow balance

2. CREATE HANDSHAKE RECORD
   ├─ Insert MilestoneHandshake row
   ├─ Status: IN_PROGRESS
   ├─ Store IP address, device fingerprint
   └─ Set expiry (7 days)

3. BIOMETRIC VERIFICATION (Smile ID)
   ├─ Compare live image vs baseline hash
   ├─ Check liveness detection (blink, head movement)
   ├─ Calculate confidence score (0-100%)
   ├─ Verify against government registry (NIN/BVN)
   ├─ Update handshake record
   └─ Fail if confidence < 95% or liveness failed

4. CALCULATE PAYMENT BREAKDOWN
   ├─ Milestone amount: $3,000
   ├─ Platform fee (15%): $450
   ├─ FX spread (0.5%): $15
   └─ Net contractor payout: $2,535

5. EXECUTE AIRWALLEX PAYOUT
   ├─ Create beneficiary record
   ├─ Initiate transfer with fee split
   ├─ Platform fee → Treasury wallet
   ├─ Net amount → Contractor bank
   └─ Get transfer ID & exchange rate

6. ATOMIC DATABASE UPDATES
   ├─ Update Milestone: status = PAID, paidAt = NOW()
   ├─ Update Contract: status = IN_PROGRESS or COMPLETED
   ├─ Update AirwallexSubAccount: balance -= $3,000
   ├─ Create PaymentTransaction record
   ├─ Create Invoice record
   ├─ Update VettedMEPassport stats
   └─ Create AuditLog entry

7. RETURN SUCCESS RESPONSE
   └─ Include transaction details, biometric confidence, processing time
```

---

## ✅ Success Response (200)

```json
{
  "success": true,
  "message": "Biometric verification passed. Milestone payment released successfully.",
  "data": {
    "milestoneId": "abc123-def456-ghi789",
    "status": "PAID",
    "amountReleased": 2535.00,
    "currency": "USD",
    "convertedAmount": 4183017.50,
    "convertedCurrency": "NGN",
    "transactionId": "aw_transfer_xyz123",
    "reference": "AW-CTR-2026-001-M2",
    "biometricVerification": {
      "sessionId": "smile_session_456789",
      "confidence": 0.97,
      "livenessDetected": true
    },
    "breakdown": {
      "grossAmount": 3000.00,
      "platformFee": 450.00,
      "fxSpread": 15.00,
      "netPayout": 2535.00
    },
    "processingTime": 4523
  }
}
```

---

## ❌ Error Responses

### **404 Not Found**
```json
{
  "success": false,
  "error": "Milestone not found"
}
```

### **403 Forbidden**
```json
{
  "success": false,
  "error": "Unauthorized: You are not the owner of this contract"
}
```

### **400 Bad Request - Invalid Status**
```json
{
  "success": false,
  "error": "Milestone is not ready for release. Current status: IN_PROGRESS"
}
```

### **400 Bad Request - No Passport**
```json
{
  "success": false,
  "error": "Contractor does not have a valid VettedME passport"
}
```

### **400 Bad Request - Insufficient Balance**
```json
{
  "success": false,
  "error": "Insufficient escrow balance. Available: $2000, Required: $3000"
}
```

### **401 Unauthorized - Biometric Failed**
```json
{
  "success": false,
  "error": "Biometric verification failed. Confidence: 87.3%, Liveness: true"
}
```

### **502 Bad Gateway - Airwallex Error**
```json
{
  "success": false,
  "error": "Payment processing failed. Funds remain in escrow. Please contact support."
}
```

### **500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal server error during milestone release"
}
```

---

## 📡 Additional Endpoint

### **GET /api/v1/milestones/:id/status**

**Purpose:** Check milestone release status

**Authentication:** Required

### **Success Response (200):**
```json
{
  "success": true,
  "data": {
    "milestoneId": "abc123-def456-ghi789",
    "status": "PAID",
    "amountUSD": 3000.00,
    "submittedAt": "2026-07-24T10:30:00Z",
    "approvedAt": "2026-07-25T09:15:00Z",
    "paidAt": "2026-07-25T14:35:00Z",
    "handshake": {
      "status": "VERIFIED",
      "faceMatchScore": 0.97,
      "livenessCheckPassed": true,
      "completedAt": "2026-07-25T14:32:00Z"
    },
    "transaction": {
      "transactionNumber": "TXN-2026-001",
      "status": "COMPLETED",
      "netAmount": 2535.00,
      "completedAt": "2026-07-25T14:35:00Z"
    }
  }
}
```

---

## 🔐 Security Features

### **Authentication & Authorization**
```
✓ JWT token required
✓ User must be contract owner
✓ Business role required
✓ Request validation (express-validator)
```

### **Biometric Security**
```
✓ Face match threshold: 95%+
✓ Liveness detection required
✓ Anti-deepfake checks
✓ Government ID cross-verification
✓ Device fingerprinting
✓ IP address logging
```

### **Financial Security**
```
✓ Atomic database transactions
✓ Balance validation before payout
✓ Platform fee auto-separation
✓ Audit trail logging
✓ Idempotency (via MilestoneHandshake)
```

---

## 🧪 Testing

### **Test with cURL:**
```bash
# 1. Get auth token
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cto@techventures.com","password":"business123"}' \
  | jq -r '.token')

# 2. Release milestone
curl -X POST http://localhost:3000/api/v1/milestones/MILESTONE_ID/release \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "biometricImageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }' | jq
```

### **Test with Postman:**
```
1. POST /api/v1/auth/login
   Body: { "email": "cto@techventures.com", "password": "business123" }
   
2. Copy token from response

3. POST /api/v1/milestones/:id/release
   Headers: Authorization: Bearer {TOKEN}
   Body: { "biometricImageBase64": "..." }
```

---

## 💰 Revenue Capture Flow

### **Per-Transaction Breakdown:**
```
Milestone Amount:              $3,000.00

Deductions:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Platform Service Fee (15%):     -$450.00
  → Routed to: VETTED_TREASURY_WALLET_ID
  
FX Conversion Markup (0.5%):     -$15.00
  → Captured via Airwallex spread

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contractor Net Payout:        $2,535.00
  → Converted to: ₦4,183,017.50 (@ 1650.5)
  → Transferred to: Contractor's Nigerian bank

Platform Revenue:               $465.00 (15.5%)
```

### **Database Records Created:**
```
1. MilestoneHandshake
   - Biometric session tracking
   - Verification results
   - Fraud detection signals

2. PaymentTransaction
   - Transaction number
   - Amount breakdown
   - Airwallex transfer ID
   - Status tracking

3. Invoice
   - Invoice number
   - Full financial breakdown
   - PDF-ready data

4. RevenueEntry (Future)
   - Platform fee tracking
   - FX spread capture
   - Treasury routing

5. AuditLog
   - Complete action trail
   - User, IP, timestamp
   - Before/after state
```

---

## 📊 Database Schema Impact

### **Tables Modified:**
```sql
-- Milestone status updated
UPDATE milestones 
SET status = 'PAID', 
    paid_at = NOW(), 
    handshake_completed_at = NOW()
WHERE id = :milestone_id;

-- Contract status updated
UPDATE contracts 
SET status = 'IN_PROGRESS' OR 'COMPLETED'
WHERE id = :contract_id;

-- Airwallex balance decremented
UPDATE airwallex_sub_accounts 
SET current_balance_usd = current_balance_usd - :amount,
    available_balance_usd = available_balance_usd - :amount
WHERE id = :sub_account_id;

-- VettedME passport stats updated
UPDATE vetted_me_passports 
SET contracts_completed = contracts_completed + 1,
    total_earned_usd = total_earned_usd + :net_payout,
    last_biometric_scan_at = NOW()
WHERE id = :passport_id;
```

### **Tables Inserted:**
```
✓ milestone_handshakes (2 inserts: initiate, complete)
✓ payment_transactions (1 insert)
✓ invoices (1 insert)
✓ audit_logs (1 insert)
```

---

## 🚨 Error Handling

### **Transaction Rollback Scenarios:**
```
IF biometric verification fails:
  → Update handshake to FAILED
  → No financial changes
  → Return 401

IF Airwallex payout fails:
  → No database updates
  → Funds remain in escrow
  → Return 502

IF database transaction fails:
  → All changes rolled back
  → Log error
  → Return 500
```

### **Idempotency:**
```
Multiple requests to same milestone:
  → Check if milestone already PAID
  → Return error if already processed
  → Prevent double-payment
```

---

## 📈 Performance Considerations

### **Typical Processing Time:**
```
Step 1: Validation           ~50ms
Step 2: Handshake create     ~30ms
Step 3: Smile ID verify      ~2000ms (external API)
Step 4: Calculate breakdown  ~5ms
Step 5: Airwallex payout     ~1500ms (external API)
Step 6: Database transaction ~100ms
Step 7: Response assembly    ~20ms

Total: ~3.7 seconds
```

### **Optimization Strategies:**
```
✓ Database indexes on milestone_id, contract_id, status
✓ Connection pooling for external APIs
✓ Async logging (Winston)
✓ Caching auth tokens (Airwallex)
✓ Request timeout: 30 seconds
```

---

## 🎯 Integration Points

### **External Services:**
```
1. Smile ID API
   - Endpoint: https://smileidentity.com/api/v1/compare
   - Purpose: Biometric verification
   - Timeout: 10 seconds
   - Retry: None (fail fast)

2. Airwallex API
   - Endpoint: https://api.airwallex.com/api/v1/payouts/create
   - Purpose: Cross-border payment
   - Timeout: 15 seconds
   - Retry: None (transaction integrity)
```

### **Internal Services:**
```
✓ SmileIDService.verifyBiometric()
✓ AirwallexService.initiatePayout()
✓ PrismaClient.$transaction()
✓ Logger.info/error()
✓ Authentication middleware
✓ Validation middleware
```

---

## ✅ Validation Rules

### **Milestone ID:**
```
✓ Must be valid UUID
✓ Must exist in database
✓ User must own contract
```

### **Biometric Image:**
```
✓ Required
✓ Must be base64 encoded
✓ Must be valid image format (JPEG, PNG)
✓ Size limit: 10MB
```

### **Milestone Status:**
```
✓ Must be WORK_SUBMITTED
✓ Cannot be LOCKED, IN_PROGRESS, PAID
```

### **Passport Status:**
```
✓ Must exist
✓ Must be BIOMETRIC_PASSED
✓ Cannot be PENDING, FAILED, REVOKED
```

### **Balance Check:**
```
✓ Available balance >= milestone amount
✓ Airwallex account must be active
```

---

**Milestone Release API is production-ready and fully documented! 🚀💰🔐**
