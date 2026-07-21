# VETTED Platform: Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
```bash
Node.js 18+
PostgreSQL 16
Docker & Docker Compose
npm or yarn
```

---

## 📦 Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/yourusername/vetted-platform.git
cd vetted-platform

# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.production.template .env

# Edit .env with your credentials:
# - SMILE_ID_API_KEY
# - AIRWALLEX_API_KEY
# - DATABASE_URL
# - JWT_SECRET
# etc.
```

See `PRODUCTION_ENV_SETUP.md` for detailed setup instructions.

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npm run seed
```

### 4. Start Development
```bash
# Backend (port 3000)
npm run dev

# Frontend (port 3001)
cd frontend
npm run dev
```

---

## 🐳 Docker Deployment

### Quick Start
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop services
docker-compose -f docker-compose.production.yml down
```

See `PRODUCTION_DEPLOYMENT.md` for comprehensive deployment guide.

---

## 📚 Documentation Map

### **For Developers**
- `VETTED_MASTER_ARCHITECTURE.md` - Complete system overview
- `SYSTEM_COMPLETE.md` - Feature inventory & status
- `DATABASE_SCHEMA.md` - Database structure

### **For Backend Work**
- `MILESTONE_RELEASE_COMPLETE.md` - Biometric release API
- `FRAUD_MITIGATION_SYSTEM.md` - Fraud detection
- `W8BEN_TAX_COMPLIANCE.md` - Tax automation
- `AUDIT_TRAIL_COMPLETE.md` - Audit logging
- `WEBHOOK_SYSTEM.md` - Webhook handlers

### **For Frontend Work**
- `frontend/PASSPORT_V2_COMPLETE.md` - Public trust passport
- `frontend/ADMIN_ARBITRATION_COMPLETE.md` - Admin panel

### **For DevOps**
- `PRODUCTION_DEPLOYMENT.md` - Docker & deployment
- `PRODUCTION_ENV_SETUP.md` - Environment config
- `.env.production.template` - Env schema

---

## 🗂️ Directory Structure

```
vetted-platform/
├── src/                          # Backend source
│   ├── controllers/              # API controllers (8 files)
│   ├── services/                 # Business logic (6 core services)
│   ├── routes/                   # Express routes
│   ├── middleware/               # Auth, security, etc.
│   ├── utils/                    # Utilities (auditLogger, etc.)
│   └── index.ts                  # Entry point
│
├── prisma/                       # Database
│   ├── schema.prisma             # 23 models
│   ├── migrations/               # Migration history
│   └── seed.ts                   # Seed data
│
├── frontend/                     # Next.js app
│   ├── src/app/                  # App router
│   │   ├── talent/               # Talent portal
│   │   ├── business/             # Business portal
│   │   └── admin/                # Admin portal ⭐
│   ├── src/components/           # React components (30+)
│   └── public/                   # Static assets
│
├── docker-compose.production.yml # Production deployment
├── Dockerfile                    # Multi-stage build
├── .env.production.template      # Env schema
│
└── Documentation/                # 15 comprehensive docs
    ├── VETTED_MASTER_ARCHITECTURE.md
    ├── SYSTEM_COMPLETE.md
    └── ... (see above)
```

---

## 🔑 Key Endpoints

### Authentication
```
POST /api/v1/auth/register - Register new user
POST /api/v1/auth/login    - Login user
GET  /api/v1/auth/me       - Get current user
```

### Milestone Release (Biometric)
```
POST /api/v1/milestones/:id/release
Body: {
  biometricPayload: { image, sessionId, ... },
  milestoneId: "milestone_id"
}
```

### Disputes (Admin)
```
POST /api/v1/disputes/initiate
POST /api/v1/disputes/:id/resolve
Body: {
  resolution: 'REFUND_BUYER' | 'PAY_CONTRACTOR',
  notes: "Admin notes..."
}
```

### Webhooks
```
POST /api/v1/webhooks/airwallex/deposit
POST /api/v1/webhooks/airwallex/payout
```

---

## 🎯 Quick Testing

### Test Biometric Release
```bash
curl -X POST http://localhost:3000/api/v1/milestones/milestone_id/release \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "biometricPayload": {
      "image": "base64_image_string",
      "sessionId": "test_session_id"
    }
  }'
```

### Test Admin Dispute Resolution
```bash
curl -X POST http://localhost:3000/api/v1/disputes/dispute_id/resolve \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "PAY_CONTRACTOR",
    "notes": "Contractor provided sufficient evidence."
  }'
```

---

## 🔐 Security Checklist

Before going to production:

- [ ] Generate strong JWT_SECRET (64+ chars)
- [ ] Add real Smile ID API keys
- [ ] Add real Airwallex API keys
- [ ] Configure Airwallex webhook secrets
- [ ] Set up SSL/TLS certificates
- [ ] Enable rate limiting
- [ ] Configure CORS origins
- [ ] Set up monitoring (Datadog/Sentry)
- [ ] Enable audit logging
- [ ] Configure backup strategy
- [ ] Review admin access controls

---

## 📊 Frontend URLs

### Development
```
Talent Portal:    http://localhost:3001/talent
Business Portal:  http://localhost:3001/business
Admin Portal:     http://localhost:3001/admin
Public Passport:  http://localhost:3001/talent/passport/[id]
```

### Production
```
Talent Portal:    https://vettedme.ai
Business Portal:  https://vettedpay.ai
Admin Portal:     https://admin.vetted.com
```

---

## 🆘 Common Issues

### Issue: Prisma migration fails
```bash
# Reset database (⚠️ DELETES ALL DATA)
npx prisma migrate reset

# Generate fresh migration
npx prisma migrate dev --name init
```

### Issue: Docker container won't start
```bash
# Check logs
docker-compose logs vetted-core-engine

# Rebuild image
docker-compose build --no-cache vetted-core-engine
```

### Issue: Biometric verification fails
```bash
# Check Smile ID credentials in .env
SMILE_ID_API_KEY=your_key_here
SMILE_ID_PARTNER_ID=your_partner_id

# Check Smile ID service logs
tail -f logs/smileid.log
```

---

## 🎓 Learning Path

**Day 1: Understanding Architecture**
1. Read `VETTED_MASTER_ARCHITECTURE.md`
2. Explore database schema (`prisma/schema.prisma`)
3. Run local dev environment

**Day 2: Backend Deep Dive**
1. Study milestone release flow (`MILESTONE_RELEASE_COMPLETE.md`)
2. Review fraud detection (`FRAUD_MITIGATION_SYSTEM.md`)
3. Test API endpoints with Postman

**Day 3: Frontend Exploration**
1. Explore talent portal (`/talent`)
2. Review business portal (`/business`)
3. Test admin panel (`/admin`) ⭐

**Day 4: Production Deployment**
1. Configure environment (`PRODUCTION_ENV_SETUP.md`)
2. Deploy with Docker (`PRODUCTION_DEPLOYMENT.md`)
3. Set up monitoring & backups

---

## 📞 Support & Resources

**Documentation:** See `SYSTEM_COMPLETE.md` for full feature list

**Architecture:** See `VETTED_MASTER_ARCHITECTURE.md` for system design

**Deployment:** See `PRODUCTION_DEPLOYMENT.md` for deployment guide

**API Reference:** See individual component docs (e.g., `MILESTONE_RELEASE_COMPLETE.md`)

---

## ✅ Next Steps

After setup:

1. **Test locally** - Verify all endpoints work
2. **Load test** - Use k6 or Artillery to test 1,000+ concurrent users
3. **Security audit** - Run penetration tests
4. **Deploy staging** - Test in cloud environment
5. **Beta launch** - Onboard 50 contractors, 10 businesses
6. **Public launch** - Go live with marketing campaign

---

**VETTED Platform: From setup to production in 5 minutes.** 🚀

**Questions? See `SYSTEM_COMPLETE.md` for comprehensive documentation.** ✅
