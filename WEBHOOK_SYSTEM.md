# VETTED Webhook System Documentation

## 🎯 Overview

The VETTED webhook system is the **critical infrastructure bridge** that connects external services (Smile ID, Airwallex) with the internal platform logic. It enables **real-time, event-driven automation** for identity verification, payment deposits, and payout completions.

---

## 🏗️ Architecture

### **Webhook Flow:**
```
External Service (Smile ID, Airwallex)
      │
      │ (Fires webhook event)
      ▼
┌─────────────────────────────────┐
│  VETTED Webhook Endpoint        │
│  /api/v1/webhooks/*             │
├─────────────────────────────────┤
│  1. Signature Verification      │◄── HMAC SHA-256 validation
│  2. Event Parsing               │
│  3. Database Updates            │◄── Atomic transactions
│  4. Audit Logging               │◄── Cryptographic trail
│  5. Response (200 OK)           │
└─────────────────────────────────┘
      │
      │ (Updates platform state)
      ▼
User sees updated status in UI
```

---

## 🔐 Security

### **Webhook Signature Verification:**

Every webhook endpoint validates incoming requests using **HMAC SHA-256** cryptographic signatures:

```typescript
const computedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET_KEY)
  .update(rawPayload)
  .digest('hex');

if (computedSignature !== incomingSignature) {
  // Reject tampering attempt
  return 401 Unauthorized
}
```

**Why this matters:**
- Prevents malicious actors from sending fake webhooks
- Ensures only authorized external services can trigger actions
- Protects against man-in-the-middle attacks
- Meets banking-grade security standards

---

## 📡 Webhook Endpoints

### **1. VettedME Identity Verification Webhook**

**Endpoint:** `POST /api/v1/webhooks/vettedme`

**Purpose:** Receives biometric verification completion events from Smile ID

**Events:**
- `verification.completed` - Identity successfully verified
- `verification.failed` - Identity verification failed

**Payload Example:**
```json
{
  "event_type": "verification.completed",
  "user_id": "user_123",
  "session_id": "smile_session_456",
  "verification_type": "biometric_kyc",
  "verification_status": "PASSED",
  "biometric_data": {
    "confidence": 98.5,
    "liveness": "PASSED",
    "face_match": "PASSED"
  },
  "kyc_data": {
    "nin": "12345678901",
    "bvn": "22334455667",
    "full_name": "John Doe",
    "dob": "1990-01-01"
  }
}
```

**Processing Flow:**
1. Validate Smile ID webhook signature
2. Find VettedMEPassport by userId
3. Update passport status:
   - `PENDING` → `BIOMETRIC_PASSED` (if verification succeeded)
   - `PENDING` → `FAILED` (if verification failed)
4. Store biometric hash and KYC data
5. Log audit event: `PASSPORT_VERIFICATION_SUCCESS` or `PASSPORT_VERIFICATION_FAILED`
6. Send notification to user

**Signature Header:** `X-Signature`

**Secret Key:** `SMILE_ID_WEBHOOK_SECRET`

---

### **2. VettedPay Biometric Handshake Webhook**

**Endpoint:** `POST /api/v1/webhooks/vettedpay/handshake`

**Purpose:** Receives biometric handshake completion events for milestone releases

**Events:**
- `handshake.verified` - Biometric scan successful
- `handshake.failed` - Biometric scan failed

**Payload Example:**
```json
{
  "event_type": "handshake.verified",
  "milestone_id": "milestone_123",
  "user_id": "user_456",
  "biometric_session_id": "session_789",
  "handshake_verified": true,
  "confidence": 97.8,
  "timestamp": "2026-07-19T22:45:00Z"
}
```

**Processing Flow:**
1. Find MilestoneHandshake record
2. Update handshake status: `PENDING_APPROVAL` → `PAYMENT_RELEASED`
3. Trigger Airwallex payout
4. Update milestone status: `WORK_SUBMITTED` → `PAID`
5. Log audit event: `BIOMETRIC_HANDSHAKE_TRIGGERED`
6. Send notification to enterprise client

---

### **3. Airwallex Deposit Webhook** ⭐ NEW

**Endpoint:** `POST /api/v1/webhooks/airwallex/deposit`

**Purpose:** Handles enterprise escrow funding events

**Events:**
- `payment.inbound_transfer.success` - Funds deposited successfully

**Payload Example:**
```json
{
  "event": "payment.inbound_transfer.success",
  "data": {
    "virtual_account_id": "va_abc123",
    "transaction_id": "txn_xyz789",
    "amount": 10000.00,
    "currency": "USD",
    "source": {
      "bank_name": "Chase Bank",
      "account_number": "****1234",
      "routing_number": "021000021"
    },
    "timestamp": "2026-07-19T22:30:00Z"
  }
}
```

**Processing Flow:**
1. **Validate signature** (HMAC SHA-256 with `AIRWALLEX_WEBHOOK_SECRET_KEY`)
2. **Lookup sub-account** by `virtual_account_id`
3. **Atomic database transaction:**
   ```typescript
   await prisma.$transaction([
     // Update sub-account balance
     prisma.airwallexSubAccount.update({
       where: { id: subAccount.id },
       data: { 
         currentBalanceUSD: previousBalance + depositAmount 
       }
     }),
     
     // Activate contract
     prisma.contract.update({
       where: { id: contractId },
       data: { status: 'CAPITAL_ESCROWED' }
     }),
     
     // Create ledger entry
     prisma.ledgerTransaction.create({
       data: {
         walletId: subAccount.id,
         transactionType: 'CREDIT',
         amount: depositAmount,
         currency: 'USD',
         description: 'Capital deposit from enterprise',
         externalTransactionId: transactionId,
       }
     })
   ]);
   ```
4. **Log audit event:** `CAPITAL_DEPOSIT_CONFIRMED`
5. **Notify contractor:** "Contract funded - you can start work!"

**Critical Impact:**
- Contract status changes: `AWAITING_FUNDS` → `CAPITAL_ESCROWED`
- Contractor can now begin development
- Milestone queue activated
- Escrow secured and visible in dashboard

**Signature Header:** `X-Signature`

**Secret Key:** `AIRWALLEX_WEBHOOK_SECRET_KEY`

---

### **4. Airwallex Payout Webhook** ⭐ NEW

**Endpoint:** `POST /api/v1/webhooks/airwallex/payout`

**Purpose:** Handles payout completion and failure events

**Events:**
- `payout.completed` - Payout successfully sent to contractor
- `payout.failed` - Payout failed (bank error, invalid account, etc.)

**Payload Example (Success):**
```json
{
  "event": "payout.completed",
  "data": {
    "payout_id": "payout_abc123",
    "amount": 8450.00,
    "currency": "USD",
    "beneficiary_id": "ben_xyz789",
    "beneficiary": {
      "name": "John Doe",
      "bank_name": "GTBank",
      "account_number": "0123456789"
    },
    "status": "COMPLETED",
    "completed_at": "2026-07-19T22:50:00Z"
  }
}
```

**Payload Example (Failure):**
```json
{
  "event": "payout.failed",
  "data": {
    "payout_id": "payout_abc123",
    "amount": 8450.00,
    "currency": "USD",
    "status": "FAILED",
    "failure_reason": "Invalid bank account number",
    "failed_at": "2026-07-19T22:48:00Z"
  }
}
```

**Processing Flow (Success):**
1. **Validate signature**
2. **Lookup PaymentTransaction** by `externalTransactionId`
3. **Atomic database transaction:**
   ```typescript
   await prisma.$transaction([
     // Mark transaction complete
     prisma.paymentTransaction.update({
       where: { id: transaction.id },
       data: { 
         status: 'COMPLETED',
         completedAt: new Date()
       }
     }),
     
     // Mark milestone paid
     prisma.milestone.update({
       where: { id: milestoneId },
       data: { status: 'PAID' }
     })
   ]);
   ```
4. **Log audit event:** `PAYOUT_DISBURSEMENT_EXECUTED`
5. **Notify contractor:** "Payment sent to your bank!"

**Processing Flow (Failure):**
1. **Validate signature**
2. **Lookup PaymentTransaction**
3. **Atomic database transaction:**
   ```typescript
   await prisma.$transaction([
     // Mark transaction failed
     prisma.paymentTransaction.update({
       where: { id: transaction.id },
       data: { 
         status: 'FAILED',
         metadata: { failureReason, failedAt }
       }
     }),
     
     // Revert milestone for retry
     prisma.milestone.update({
       where: { id: milestoneId },
       data: { status: 'WORK_SUBMITTED' }
     })
   ]);
   ```
4. **Log audit event:** `PAYOUT_DISBURSEMENT_FAILED`
5. **Alert support team:** Manual intervention required
6. **Notify contractor:** "Payment failed - we're investigating"

**Signature Header:** `X-Signature`

**Secret Key:** `AIRWALLEX_WEBHOOK_SECRET_KEY`

---

## 🔧 Configuration

### **Environment Variables:**

```bash
# Smile ID Webhooks
SMILE_ID_WEBHOOK_SECRET=your_smile_id_webhook_secret_here

# Airwallex Webhooks
AIRWALLEX_WEBHOOK_SECRET_KEY=your_airwallex_webhook_secret_here

# Webhook URLs (for external service configuration)
WEBHOOK_BASE_URL=https://api.vetted.com
```

### **External Service Configuration:**

**Smile ID Dashboard:**
```
Webhook URL: https://api.vetted.com/api/v1/webhooks/vettedme
Events: verification.completed, verification.failed
Signature Method: HMAC SHA-256
```

**Airwallex Dashboard:**
```
Deposit Webhook URL: https://api.vetted.com/api/v1/webhooks/airwallex/deposit
Events: payment.inbound_transfer.success

Payout Webhook URL: https://api.vetted.com/api/v1/webhooks/airwallex/payout
Events: payout.completed, payout.failed

Signature Method: HMAC SHA-256
```

---

## 🧪 Testing

### **Health Check:**
```bash
curl -X GET https://api.vetted.com/api/v1/webhooks/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-07-19T22:30:00Z",
  "webhooks": {
    "vettedme": {
      "endpoint": "/api/v1/webhooks/vettedme",
      "events": ["verification.completed", "verification.failed"],
      "status": "active"
    },
    "vettedpay_handshake": {
      "endpoint": "/api/v1/webhooks/vettedpay/handshake",
      "events": ["handshake.verified", "handshake.failed"],
      "status": "active"
    },
    "airwallex_deposit": {
      "endpoint": "/api/v1/webhooks/airwallex/deposit",
      "events": ["payment.inbound_transfer.success"],
      "status": "active"
    },
    "airwallex_payout": {
      "endpoint": "/api/v1/webhooks/airwallex/payout",
      "events": ["payout.completed", "payout.failed"],
      "status": "active"
    }
  }
}
```

---

### **Testing Deposit Webhook (Local):**

```bash
# Generate signature
SECRET="your_airwallex_webhook_secret"
PAYLOAD='{"event":"payment.inbound_transfer.success","data":{"virtual_account_id":"va_test123","transaction_id":"txn_test456","amount":10000.00,"currency":"USD"}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

# Send webhook
curl -X POST http://localhost:5000/api/v1/webhooks/airwallex/deposit \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Expected Response:**
```json
{
  "success": true,
  "status": "Ledger cleared: Escrow secured.",
  "contractId": "contract_123",
  "newBalance": 10000.00
}
```

---

### **Testing Payout Webhook (Local):**

```bash
SECRET="your_airwallex_webhook_secret"
PAYLOAD='{"event":"payout.completed","data":{"payout_id":"payout_test123","amount":8450.00,"currency":"USD","status":"COMPLETED"}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST http://localhost:5000/api/v1/webhooks/airwallex/payout \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payout completed"
}
```

---

## 🚨 Error Handling

### **Signature Validation Failures:**
```
Status: 401 Unauthorized
Body: { "error": "Invalid webhook signature" }

Reason: Signature mismatch (tampering detected)
Action: External service should retry with correct signature
```

### **Missing Resources:**
```
Status: 404 Not Found
Body: { "error": "Transaction not found" }

Reason: Referenced resource doesn't exist in database
Action: External service should check transaction ID
```

### **Processing Failures:**
```
Status: 500 Internal Server Error
Body: { "error": "Webhook processing failed", "details": "..." }

Reason: Database error, service unavailable
Action: External service should retry (with exponential backoff)
```

---

## 📊 Monitoring

### **Key Metrics to Track:**

**Webhook Reliability:**
- Signature validation success rate: > 99.9%
- Processing success rate: > 99.5%
- Average processing time: < 500ms
- Retry rate: < 1%

**Deposit Webhooks:**
- Daily deposit events: Track volume
- Average deposit amount: $10k+
- Contract activation time: < 5 minutes (from deposit to CAPITAL_ESCROWED)

**Payout Webhooks:**
- Payout success rate: > 99%
- Average payout time: 24-48 hours
- Failure reasons: Track categories (invalid account, insufficient funds, etc.)

---

## 🔄 Retry Logic

### **External Service Retries:**

Both Smile ID and Airwallex implement automatic retry logic:

**Standard Retry Pattern:**
```
Attempt 1: Immediate
Attempt 2: +1 minute
Attempt 3: +5 minutes
Attempt 4: +15 minutes
Attempt 5: +1 hour
Max attempts: 5
Timeout: 24 hours
```

**What This Means:**
- If our webhook endpoint is temporarily down, external services will retry
- No manual intervention needed for transient failures
- All events eventually processed (within 24 hours)

**Idempotency:**
- All webhook handlers are idempotent (safe to retry)
- Duplicate events won't cause double-processing
- Database transactions use unique constraints

---

## 📝 Audit Trail Integration

Every webhook event is logged to the immutable audit trail:

**Audit Log Entry:**
```typescript
{
  actorId: 'user_123',
  actionType: 'CAPITAL_DEPOSIT_CONFIRMED',
  resourceId: 'contract_456',
  payloadHash: 'sha256_hash_of_webhook_payload',
  previousHash: 'previous_audit_log_hash',
  ipAddress: '54.123.456.789',
  userAgent: 'Airwallex_Webhook_Engine',
  timestamp: '2026-07-19T22:30:00Z'
}
```

**Benefits:**
- Complete audit trail for compliance
- Tamper-proof record of all webhook events
- Banking-grade compliance
- Legal defensibility

---

## 🎯 Best Practices

### **For Development:**
1. **Test with sandbox/test mode** before production
2. **Validate signatures** on every endpoint
3. **Use atomic transactions** for database updates
4. **Log all events** to audit trail
5. **Return 200 OK quickly** (< 5 seconds)
6. **Process heavy work asynchronously** (if > 5 seconds)

### **For Production:**
1. **Monitor webhook endpoint uptime** (> 99.9%)
2. **Set up alerts** for signature failures
3. **Track processing times** (< 500ms average)
4. **Review failed events daily**
5. **Keep webhook secrets secure** (rotate quarterly)

---

## 🚀 Impact on User Experience

### **Deposit Webhook Impact:**
```
WITHOUT webhook:
Enterprise deposits funds → Waits 1-3 days → Manual verification → Contract activated

WITH webhook:
Enterprise deposits funds → Instant notification → Contract activated within minutes

Result: 10x faster contract activation ⚡
```

### **Payout Webhook Impact:**
```
WITHOUT webhook:
Milestone released → Manual payout → Contractor waits 5-7 days → Uncertainty

WITH webhook:
Milestone released → Instant payout → Real-time status → Contractor paid in 24-48h

Result: 3x faster payouts, complete transparency ⚡
```

---

## 📚 Related Documentation

1. [AIRWALLEX_INTEGRATION.md](AIRWALLEX_INTEGRATION.md) - Airwallex setup guide
2. [SMILE_ID_INTEGRATION.md](SMILE_ID_INTEGRATION.md) - Smile ID setup guide
3. [IMMUTABLE_AUDIT_TRAIL.md](IMMUTABLE_AUDIT_TRAIL.md) - Audit logging system
4. [FRAUD_MITIGATION_SYSTEM.md](FRAUD_MITIGATION_SYSTEM.md) - Security protocols

---

## ✅ Summary

The VETTED webhook system provides:

✅ **Real-time automation** (instant contract activation, instant payout tracking)  
✅ **Bank-grade security** (HMAC SHA-256 signature validation)  
✅ **Complete audit trail** (every event logged cryptographically)  
✅ **Fault tolerance** (automatic retries, idempotent handlers)  
✅ **Production-ready** (error handling, monitoring, logging)  

**Result:** Seamless integration with external services that powers the entire VETTED platform. 🚀
