# VETTED - System Architecture

This document provides a comprehensive overview of the VETTED infrastructure architecture.

---

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SYSTEMS                            │
├──────────────────────┬─────────────────────┬────────────────────────┤
│   Smile ID (Nigeria) │   Airwallex (Global)│   Nigerian Banks       │
│   • NIN Verification │   • Sub-Accounts    │   • Local Transfers    │
│   • BVN Verification │   • FX Routing      │   • NGN Settlement     │
│   • Liveness Checks  │   • W-8BEN Gen      │                        │
└──────────────────────┴─────────────────────┴────────────────────────┘
                    ▲                ▲                ▲
                    │                │                │
                    │   Webhooks     │   API Calls    │
                    │                │                │
┌───────────────────▼────────────────▼────────────────▼───────────────┐
│                     VETTED BACKEND (Node.js + TypeScript)           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   API GATEWAY (Express)                      │ │
│  │  • CORS, Helmet, Rate Limiting                               │ │
│  │  • JWT Authentication                                        │ │
│  │  • Request Validation (Zod)                                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────┐         ┌──────────────┐         ┌────────────┐ │
│  │  VettedME    │         │  VettedPay   │         │  Webhook   │ │
│  │  Service     │ ◄─────► │  Service     │ ◄─────► │  Bridge    │ │
│  │              │         │              │         │            │ │
│  │ • Smile ID   │         │ • Airwallex  │         │ • Event    │ │
│  │ • Biometrics │         │ • Escrow     │         │   Dispatch │ │
│  │ • Skills     │         │ • Payouts    │         │ • Retry    │ │
│  └──────────────┘         └──────────────┘         └────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              DATA ACCESS LAYER (Prisma ORM)                  │ │
│  │  • Type-safe database queries                                │ │
│  │  • Connection pooling                                        │ │
│  │  • Migration management                                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL 15+)                      │
├─────────────────────────────────────────────────────────────────────┤
│  • users                    • contracts                             │
│  • vettedme_passports       • milestones                            │
│  • skill_assessment_logs    • airwallex_subaccounts                 │
│  • webhook_events           • audit_logs                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Core Data Flow: Trust → Payment

### Phase 1: Identity Verification (VettedME)

```
Talent → Register → Initiate Biometric Verification
                                   │
                                   ▼
                        Smile ID Verification Portal
                                   │
                                   ├─► Liveness Check (Anti-Deepfake)
                                   ├─► Face Capture
                                   ├─► NIN Verification
                                   └─► BVN Cross-Check
                                   │
                                   ▼
                         Webhook → VettedME Service
                                   │
                                   ▼
                       Update VettedMEPassport Status
                                   │
                                   ├─► biometricStatus: VERIFIED
                                   ├─► ninVerified: true
                                   ├─► bvnVerified: true
                                   ├─► trustScore: 85
                                   └─► passportIssuedAt: NOW
                                   │
                                   ▼
                        Issue Digital Passport
                        (https://vettedme.com/talent/{id})
```

### Phase 2: Skill Assessment (VettedME)

```
Talent → Take Coding Challenge → Sandboxed Execution Environment
                                           │
                                           ▼
                                  Execute Code Safely
                                  Score Algorithm
                                  AI Portfolio Audit
                                           │
                                           ▼
                          skill_assessment_logs.create()
                                           │
                                           ├─► assessmentType: CODING_CHALLENGE
                                           ├─► rawScore: 87
                                           ├─► passed: true
                                           └─► codeSubmitted: <encrypted>
                                           │
                                           ▼
                         Update VettedMEPassport
                         skillVerificationStatus: VERIFIED
```

### Phase 3: Contract Creation (VettedPay)

```
Buyer → Create Contract → Specify Milestones
                                │
                                ▼
                  Create Airwallex Sub-Account
                  (Non-Custodial, Buyer-Owned)
                                │
                                ├─► Account Type: BUSINESS
                                ├─► Legal Owner: Buyer Entity
                                ├─► Currency: USD
                                └─► Initial Balance: $10,000
                                │
                                ▼
                     airwallex_subaccounts.create()
                                │
                                ▼
                    contracts.create() with milestones[]
```

### Phase 4: Escrow Locking (VettedPay)

```
Contract Active → Milestone Starts → Lock Escrow Funds
                                           │
                                           ▼
                           Airwallex API: Lock Funds
                           Amount: $5,000
                           Reference: MILESTONE_uuid
                                           │
                                           ▼
                        milestones.update()
                        ├─► status: IN_PROGRESS
                        ├─► escrowedAmount: 5000
                        └─► biometricHandshakeRequired: true
                                           │
                                           ▼
                          Talent Begins Work
```

### Phase 5: Work Delivery & Biometric Handshake

```
Talent Submits Work → Buyer Approves → Biometric Handshake Required
                                               │
                                               ▼
                                  Talent Opens Mobile App
                                  Facial Recognition Scan
                                  (Smile ID Liveness Check)
                                               │
                                               ▼
                            Webhook: Handshake Verified
                            POST /webhooks/vettedpay/handshake
                                               │
                                               ▼
                         WebhookOrchestrator.handleBiometricHandshake()
                                               │
                                               ├─► Verify handshake signature
                                               ├─► Update milestone:
                                               │   biometricHandshakeCompleted: true
                                               └─► Trigger payout
                                               │
                                               ▼
                              CRITICAL: initiateMilestonePayout()
```

### Phase 6: Automated Payout Execution

```
initiateMilestonePayout() → Validate Prerequisites
                                     │
                                     ├─► VettedMEPassport.biometricStatus === VERIFIED
                                     ├─► Milestone.biometricHandshakeCompleted === true
                                     ├─► Milestone.status === APPROVED
                                     └─► Airwallex Account Active
                                     │
                                     ▼
                          AirwallexService.initiatePayout()
                                     │
                                     ├─► sourceAccountId: buyer-account
                                     ├─► beneficiary: talent-bank-account
                                     ├─► amount: $5,000
                                     ├─► currency: USD → NGN
                                     ├─► reference: MILESTONE_uuid
                                     └─► purposeCode: CONTRACTOR_PAYMENT
                                     │
                                     ▼
                           Airwallex Processes Payout
                           (FX Conversion, Banking Rails)
                                     │
                                     ▼
                          Funds Land in Talent's Nigerian Bank
                          (Local NGN Transfer)
                                     │
                                     ▼
                         milestones.update()
                         ├─► status: PAID
                         ├─► payoutCompletedAt: NOW
                         └─► airwallexPayoutId: payout-uuid
                                     │
                                     ▼
                        webhook_events.create()
                        eventType: VETTEDPAY_PAYOUT_COMPLETED
```

---

## 🔗 Integration Points

### 1. Smile ID Integration (VettedME)

**Purpose**: Nigerian biometric and government registry verification

**API Endpoints Used**:
- `POST /id_verification` - Initiate verification session
- `GET /id_verification/{sessionId}` - Check status
- `POST /verify_id` - Direct NIN/BVN verification

**Webhook Events**:
- `verification.completed` - Verification finished
- `liveness.passed` - Anti-deepfake check passed
- `id.verified` - Government registry confirmed

**Security**:
- HMAC-SHA256 signature validation
- Partner ID + API Key authentication
- Encrypted transmission of PII

### 2. Airwallex Integration (VettedPay)

**Purpose**: Cross-border payment settlement infrastructure

**API Endpoints Used**:
- `POST /accounts/create` - Create sub-account
- `POST /accounts/lock_funds` - Escrow locking
- `POST /payouts/create` - Initiate payout
- `GET /payouts/{payoutId}` - Check payout status
- `POST /compliance/w8ben/generate` - Tax form generation

**Webhook Events**:
- `payout.processing` - Payout initiated
- `payout.completed` - Funds delivered
- `payout.failed` - Payout error

**Security**:
- OAuth 2.0 authentication (Client Credentials)
- Token refresh mechanism
- Webhook signature validation

### 3. Nigerian Banking Integration

**Indirect**: Via Airwallex's local payment rails

**Flow**:
```
USD (Airwallex) → FX Conversion → NGN Transfer → Nigerian Bank Account
```

**Supported Banks**:
- First Bank of Nigeria
- GTBank
- Zenith Bank
- Access Bank
- All major Nigerian banks

---

## 🗄️ Database Architecture

### Table Relationships

```
users (1) ──────────────────────────► (1) vettedme_passports
  │                                         │
  │                                         │
  ├─────────────────────────────────► (N) skill_assessment_logs
  │
  ├─────────────────────────────────► (N) contracts
  │                                         │
  │                                         ├─────► (N) milestones
  │                                         │
  │                                         └─────► (1) airwallex_subaccounts
  │
  └─────────────────────────────────► (N) airwallex_subaccounts


webhook_events (independent audit table)
audit_logs (independent audit table)
```

### Critical Indexes

```sql
-- High-frequency lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_status ON users(role, status);

-- VettedME queries
CREATE INDEX idx_vettedme_user_id ON vettedme_passports(userId);
CREATE INDEX idx_vettedme_status ON vettedme_passports(biometricStatus, skillVerificationStatus);

-- VettedPay queries
CREATE INDEX idx_milestones_contract ON milestones(contractId);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_payout ON milestones(airwallexPayoutId);

-- Webhook processing
CREATE INDEX idx_webhooks_type_status ON webhook_events(eventType, status);
CREATE INDEX idx_webhooks_created ON webhook_events(createdAt);
```

### Data Encryption

**Encrypted Fields** (using `@db.Text` + application-level encryption):
- `governmentIdNumber` (NIN/BVN)
- `bankAccountNumber`
- `bankRoutingNumber`
- `iban`
- `taxIdNumber`

**Encryption Key**: `ENCRYPTION_KEY` environment variable (AES-256-GCM)

---

## 🔐 Security Architecture

### Authentication Flow

```
Client → POST /auth/login → Verify credentials
                                    │
                                    ├─► bcrypt.compare(password, hash)
                                    │
                                    ▼
                            Generate JWT Token
                            ├─► Payload: { userId, email, role }
                            ├─► Secret: JWT_SECRET
                            └─► Expiry: 7 days
                                    │
                                    ▼
                         Return Token to Client
                         Client stores in localStorage/cookie
                                    │
                                    ▼
                         Subsequent requests include:
                         Authorization: Bearer <token>
```

### Authorization Middleware

```typescript
// Example: Only BUYER can create Airwallex accounts
router.post('/account/create', 
  authenticate,  // Verify JWT
  authorize(['BUYER']),  // Check role
  asyncHandler(handler)
);
```

### Webhook Security

**Signature Validation**:
```typescript
const expectedSignature = crypto
  .createHmac('sha256', SECRET_KEY)
  .update(JSON.stringify(payload))
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

**Replay Attack Prevention**:
- Timestamp validation (reject webhooks > 5 minutes old)
- Idempotency keys for payment operations
- Unique session IDs for biometric verification

---

## 📊 Monitoring & Observability

### Logging Strategy

**Levels**:
- `error` - Critical failures (database errors, API failures)
- `warn` - Non-critical issues (retry attempts, validation warnings)
- `info` - Important events (user registration, payouts, verifications)
- `debug` - Detailed traces (development only)

**Structured Logging**:
```typescript
logger.info('Payout initiated', {
  milestoneId,
  amount,
  currency,
  payoutId,
  timestamp: Date.now()
});
```

### Key Metrics to Monitor

1. **Application Health**
   - Request rate (req/s)
   - Response time (p50, p95, p99)
   - Error rate (%)

2. **Business Metrics**
   - VettedME verifications initiated
   - VettedME verifications passed
   - VettedPay payouts initiated
   - VettedPay payouts completed
   - Average payout time

3. **Infrastructure**
   - CPU usage
   - Memory usage
   - Database connections
   - Disk I/O

4. **External APIs**
   - Smile ID response time
   - Airwallex response time
   - Third-party error rates

---

## 🚀 Scalability Considerations

### Current Capacity
- **Database**: 10,000 users, 50,000 milestones
- **API**: 100 req/s sustained, 500 req/s peak
- **Webhooks**: 1,000 events/hour

### Bottleneck Mitigation

1. **Database Connection Pooling**
   ```env
   DATABASE_URL="postgresql://...?connection_limit=20"
   ```

2. **Horizontal Scaling**
   - Stateless API design (JWT, no sessions)
   - Load balancer distributes traffic
   - Shared PostgreSQL instance

3. **Async Processing**
   - Webhook processing in background
   - Retry queue for failed operations
   - Celery/Bull for heavy tasks (future)

4. **Caching Strategy** (Future)
   - Redis for VettedME passport lookups
   - Cache trust scores (1 hour TTL)
   - Cache Airwallex account details

---

## 📚 Code Organization

```
src/
├── index.ts                    # Application entry point
├── config/                     # Configuration files
├── middleware/                 # Express middleware
│   ├── errorHandler.ts        # Global error handling
│   ├── authenticate.ts        # JWT verification
│   └── authorize.ts           # Role-based access
├── routes/                     # API route definitions
│   ├── auth.routes.ts         # /api/v1/auth/*
│   ├── vettedme.routes.ts     # /api/v1/vettedme/*
│   ├── vettedpay.routes.ts    # /api/v1/vettedpay/*
│   └── webhook.routes.ts      # /api/v1/webhooks/*
├── services/                   # Business logic
│   ├── vettedme/
│   │   └── SmileIDService.ts  # Smile ID integration
│   ├── vettedpay/
│   │   └── AirwallexService.ts # Airwallex integration
│   └── webhooks/
│       └── WebhookOrchestrator.ts # Core bridge logic
├── utils/                      # Utilities
│   ├── logger.ts              # Winston logger
│   ├── encryption.ts          # AES-256 encryption
│   └── validation.ts          # Zod schemas
└── types/                      # TypeScript types
    └── index.ts               # Shared type definitions
```

---

## 🔄 Event-Driven Architecture

### Webhook Event Flow

```
External System → Webhook Endpoint → Signature Validation
                                             │
                                             ▼
                                    Create webhook_event record
                                    (status: PROCESSING)
                                             │
                                             ▼
                                    WebhookOrchestrator
                                             │
                                             ├─► Process event
                                             ├─► Update database
                                             ├─► Trigger side effects
                                             │
                                             ▼
                                    Update webhook_event
                                    (status: COMPLETED or FAILED)
                                             │
                                             ├─► If FAILED: Schedule retry
                                             └─► If COMPLETED: Emit internal event
```

### Retry Strategy

```typescript
maxRetries: 3
retryDelay: exponential backoff (2^attempt * 1000ms)
retryOn: [500, 502, 503, 504] HTTP errors
```

---

**Last Updated**: July 19, 2026  
**Architecture Version**: 1.0
