# 🚀 VETTED Production Deployment Guide - Launch Checklist

## Executive Overview

This guide walks you through the **complete production deployment** of VETTED from local development to live multi-cloud infrastructure.

**Deployment Stack**:
- **Frontend**: Vercel (Next.js 15)
- **Backend**: Railway or AWS ECS (Node.js + Express)
- **Database**: Railway PostgreSQL with multi-region read replicas
- **Domains**: vettedme.app, vettedme.co, vettedforce.com, vettedenterprise.com

**Estimated Time**: 2-3 hours (first-time setup)

---

## 📋 Pre-Deployment Checklist

### Required Accounts & Services

- [ ] **Vercel Account** (free tier works, Pro recommended for production)
- [ ] **Railway Account** (Starter plan: $5/month, Pro: $20/month recommended)
- [ ] **Domain Registrar** (GoDaddy, Namecheap, Cloudflare)
- [ ] **GitHub Repository** (public or private)
- [ ] **Airwallex Account** (production API keys)
- [ ] **Smile ID Account** (production API keys)
- [ ] **Persona Account** (production API keys)
- [ ] **Upstash Redis** (free tier works, paid recommended)

### Required Tools

- [ ] **Node.js 20+** (`node --version`)
- [ ] **Git** (`git --version`)
- [ ] **Vercel CLI** (`npm install -g vercel`)
- [ ] **Railway CLI** (`npm install -g @railway/cli`)
- [ ] **Prisma CLI** (`npm install -g prisma`)

---

## 🎯 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRODUCTION ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  vettedme.app    │────────▶│  Vercel CDN      │
│  vettedme.co     │         │  (Frontend)      │
└──────────────────┘         └──────────────────┘
         │                            │
         │                            ▼
         │                   ┌──────────────────┐
         │                   │  Next.js 15 App  │
         │                   │  (React 19)      │
         │                   └──────────────────┘
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│ vettedforce.com  │────────▶│  Railway/AWS     │
│vettedenterprise  │         │  (Backend API)   │
└──────────────────┘         └──────────────────┘
         │                            │
         │                            ▼
         │                   ┌──────────────────┐
         │                   │  Node.js + Exprs │
         │                   │  TypeScript      │
         │                   └──────────────────┘
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│  Database        │────────▶│  Railway Postgres│
│  Primary (US)    │         │  + Read Replicas │
└──────────────────┘         └──────────────────┘
         │
         ├──────────────────────────────┐
         │                              │
         ▼                              ▼
┌──────────────────┐         ┌──────────────────┐
│  Lagos Replica   │         │  Nairobi Replica │
│  (West Africa)   │         │  (East Africa)   │
└──────────────────┘         └──────────────────┘
         │
         ▼
┌──────────────────┐
│ São Paulo Replica│
│ (Latin America)  │
└──────────────────┘

┌──────────────────┐
│  Upstash Redis   │────────▶ Rate Limiting
│  (Global)        │          Session Storage
└──────────────────┘
```

---

## 🌐 PART 1: Frontend Deployment (Vercel)

### Step 1: Optimize Next.js 15 Production Build

**Navigate to frontend directory**:
```bash
cd frontend
```

**Install dependencies**:
```bash
npm install
```

**Build production bundle**:
```bash
npm run build
```

**Expected output**:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB          87.3 kB
├ ○ /business/dashboard                  8.4 kB          95.5 kB
├ ○ /talent/onboarding                   6.7 kB          93.8 kB
└ ○ /talent/passport/[id]                4.9 kB          86.0 kB

○  (Static)  prerendered as static content
```

**Verify build success**:
```bash
npm run start
# Visit http://localhost:3000 to test production build locally
```

---

### Step 2: Push to GitHub

**Initialize Git repository** (if not already done):
```bash
git init
git add .
git commit -m "feat: VETTED production deployment ready"
```

**Create GitHub repository**:
1. Go to https://github.com/new
2. Repository name: `vettedcare-backend` (or your preferred name)
3. Visibility: Private (recommended for now)
4. Click "Create repository"

**Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/vettedcare-backend.git
git branch -M main
git push -u origin main
```

---

### Step 3: Deploy to Vercel

**Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

**Login to Vercel**:
```bash
vercel login
```

**Deploy frontend to Vercel**:
```bash
cd frontend
vercel --prod
```

**Follow the prompts**:
```
? Set up and deploy "frontend"? [Y/n] Y
? Which scope? [Your Account]
? Link to existing project? [y/N] N
? What's your project's name? vetted-frontend
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

**Deployment complete**:
```
✅  Deployed to production: https://vetted-frontend.vercel.app
```

---

### Step 4: Configure Custom Domains (vettedme.app, vettedme.co)

**Add vettedme.app domain**:
```bash
vercel domains add vettedme.app
```

**Add DNS records** (at your domain registrar):

**For vettedme.app**:
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**Verify domain**:
```bash
vercel domains verify vettedme.app
```

**Add vettedme.co domain** (redirect to vettedme.app):
```bash
vercel domains add vettedme.co
```

**Configure redirect** (in Vercel dashboard):
1. Go to: https://vercel.com/your-username/vetted-frontend/settings/domains
2. Click "vettedme.co" → "Edit"
3. Set redirect to: `https://vettedme.app`
4. Enable "Permanent (308)" redirect
5. Save

**Add DNS records for vettedme.co**:
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

---

### Step 5: Configure Environment Variables (Frontend)

**In Vercel dashboard**:
1. Go to: https://vercel.com/your-username/vetted-frontend/settings/environment-variables
2. Add the following variables:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.vettedforce.com

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token_here

# Feature Flags
NEXT_PUBLIC_ENABLE_BETA=true
```

**Save and redeploy**:
```bash
vercel --prod
```

---

## 🖥️ PART 2: Backend Deployment (Railway)

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

**Login to Railway**:
```bash
railway login
```

---

### Step 2: Initialize Railway Project

**Navigate to backend root**:
```bash
cd C:\VETTEDCARE.AI\vettedcare-backend
```

**Initialize Railway project**:
```bash
railway init
```

**Follow the prompts**:
```
? Project name: vetted-backend
? Environment: production
✅  Created project "vetted-backend"
```

---

### Step 3: Provision PostgreSQL Database

**Add PostgreSQL service**:
```bash
railway add --database postgres
```

**Expected output**:
```
✅  Created PostgreSQL database
📝  DATABASE_URL: postgresql://postgres:password@containers-us-west-1.railway.app:5432/railway
```

**Save DATABASE_URL** (copy from Railway dashboard or terminal output)

---

### Step 4: Configure Multi-Region Read Replicas

**Option A: Railway (Simpler, Higher Cost)**

Railway doesn't natively support read replicas. Use **single database** for MVP, then migrate to AWS Aurora for scale.

**Option B: AWS Aurora (Production-Grade, Complex Setup)**

See **PART 4: Multi-Region Database Setup** below for AWS Aurora configuration.

**For MVP, proceed with single Railway PostgreSQL instance.**

---

### Step 5: Run Prisma Migrations (Production)

**Set DATABASE_URL environment variable**:
```bash
# Windows
set DATABASE_URL=postgresql://postgres:password@containers-us-west-1.railway.app:5432/railway

# Mac/Linux
export DATABASE_URL=postgresql://postgres:password@containers-us-west-1.railway.app:5432/railway
```

**Generate Prisma client**:
```bash
npx prisma generate
```

**Run production migrations**:
```bash
npx prisma migrate deploy
```

**Expected output**:
```
✅  Applied 23 migrations
✅  Database schema is up to date
```

**Seed production database** (optional, for demo data):
```bash
npm run db:seed
```

---

### Step 6: Configure Environment Variables (Backend)

**In Railway dashboard**:
1. Go to: https://railway.app/project/YOUR_PROJECT_ID/service/YOUR_SERVICE_ID/variables
2. Click "Raw Editor"
3. Paste the following:

```bash
# Application
NODE_ENV=production
PORT=8080
API_VERSION=v1

# Database
DATABASE_URL=postgresql://postgres:password@containers-us-west-1.railway.app:5432/railway

# Redis (Upstash)
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_UPSTASH_URL:6379

# JWT
JWT_SECRET=GENERATE_STRONG_SECRET_HERE_MIN_32_CHARS
JWT_EXPIRES_IN=15m

# CORS
CORS_ORIGIN=https://vettedme.app,https://vettedforce.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Airwallex (PRODUCTION)
AIRWALLEX_ENVIRONMENT=production
AIRWALLEX_API_KEY=AIRWALLEX_PRODUCTION_API_KEY_HERE
AIRWALLEX_CLIENT_ID=AIRWALLEX_PRODUCTION_CLIENT_ID_HERE
AIRWALLEX_CLIENT_SECRET=AIRWALLEX_PRODUCTION_CLIENT_SECRET_HERE
AIRWALLEX_WEBHOOK_SECRET=AIRWALLEX_PRODUCTION_WEBHOOK_SECRET_HERE

# Smile ID (PRODUCTION)
SMILE_ID_ENVIRONMENT=production
SMILE_ID_PARTNER_ID=SMILE_ID_PRODUCTION_PARTNER_ID_HERE
SMILE_ID_API_KEY=SMILE_ID_PRODUCTION_API_KEY_HERE

# Persona (PRODUCTION)
PERSONA_ENVIRONMENT=production
PERSONA_API_KEY=PERSONA_PRODUCTION_API_KEY_HERE

# Onfido (PRODUCTION)
ONFIDO_ENVIRONMENT=production
ONFIDO_API_TOKEN=ONFIDO_PRODUCTION_API_TOKEN_HERE

# Sentry
SENTRY_DSN=SENTRY_PRODUCTION_DSN_HERE

# Datadog
DD_API_KEY=DATADOG_PRODUCTION_API_KEY_HERE
DD_SERVICE=vetted-api
DD_ENV=production
```

**Click "Save"**

---

### Step 7: Deploy Backend to Railway

**Deploy from GitHub** (recommended):

1. Go to Railway dashboard: https://railway.app/project/YOUR_PROJECT_ID
2. Click "New Service" → "GitHub Repo"
3. Select your `vettedcare-backend` repository
4. Railway will auto-detect `package.json` and deploy

**Or deploy from CLI**:
```bash
railway up
```

**Expected output**:
```
✅  Build successful
✅  Deployment live at https://vetted-backend-production.up.railway.app
```

---

### Step 8: Configure Custom Domain (vettedforce.com)

**Add custom domain to Railway**:
1. Go to: https://railway.app/project/YOUR_PROJECT_ID/service/YOUR_SERVICE_ID/settings
2. Scroll to "Domains"
3. Click "Add Domain"
4. Enter: `api.vettedforce.com`

**Add DNS records** (at your domain registrar):
```
Type: CNAME
Name: api
Value: YOUR_PROJECT_ID.up.railway.app
TTL: 3600
```

**Verify domain**:
```
✅  Domain verified: https://api.vettedforce.com
```

---

## 🌐 PART 3: B2B Landing Page Domain Mapping

### Step 1: Deploy B2B Landing Page to Vercel

The B2B landing page (`frontend/app/page.tsx`) is already deployed as part of the frontend in **PART 1**.

### Step 2: Add Custom Domains (vettedforce.com, vettedenterprise.com)

**Add vettedforce.com**:
```bash
vercel domains add vettedforce.com
```

**Add DNS records**:
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**Add vettedenterprise.com** (redirect to vettedforce.com):
```bash
vercel domains add vettedenterprise.com
```

**Configure redirect** (in Vercel dashboard):
1. Go to: https://vercel.com/your-username/vetted-frontend/settings/domains
2. Click "vettedenterprise.com" → "Edit"
3. Set redirect to: `https://vettedforce.com`
4. Enable "Permanent (308)" redirect
5. Save

**Add DNS records for vettedenterprise.com**:
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

---

## 🗄️ PART 4: Multi-Region Database Setup (AWS Aurora)

**Note**: This is an **advanced setup** for production scale. For MVP, use single Railway PostgreSQL instance from **PART 2**.

### Overview

AWS Aurora PostgreSQL with global database and read replicas across:
- **Primary**: US East (N. Virginia) - Write operations
- **Replica 1**: EU West (Lagos routing via EU Ireland)
- **Replica 2**: AP Southeast (Nairobi routing via Singapore)
- **Replica 3**: SA East (São Paulo)

### Step 1: Create AWS Aurora Cluster

**In AWS Console**:
1. Go to: RDS → Create database
2. Select: Amazon Aurora
3. Edition: PostgreSQL-compatible
4. Capacity type: Provisioned
5. DB cluster identifier: `vetted-production`
6. Master username: `vetted_admin`
7. Master password: [Generate strong password]
8. DB instance class: db.r6g.large (2 vCPU, 16 GB RAM)
9. Storage: Autoscaling enabled (max 1000 GB)
10. Multi-AZ: Yes
11. VPC: Default VPC
12. Public access: Yes (for development, restrict to VPN for production)
13. Create database

### Step 2: Create Read Replicas

**Create EU West replica**:
1. Select `vetted-production` cluster
2. Actions → Add reader
3. Identifier: `vetted-production-eu-west-1`
4. Region: EU (Ireland)
5. Instance class: db.r6g.large
6. Create reader

**Create AP Southeast replica**:
1. Repeat for `vetted-production-ap-southeast-1` (Singapore)

**Create SA East replica**:
1. Repeat for `vetted-production-sa-east-1` (São Paulo)

### Step 3: Configure Connection Strings

**Primary (Write)**:
```
DATABASE_URL=postgresql://vetted_admin:PASSWORD@vetted-production.cluster-ABC123.us-east-1.rds.amazonaws.com:5432/vetted
```

**EU West (Read)**:
```
DATABASE_READ_REPLICA_EU=postgresql://vetted_admin:PASSWORD@vetted-production-eu-west-1.cluster-ro-ABC123.eu-west-1.rds.amazonaws.com:5432/vetted
```

**AP Southeast (Read)**:
```
DATABASE_READ_REPLICA_AP=postgresql://vetted_admin:PASSWORD@vetted-production-ap-southeast-1.cluster-ro-ABC123.ap-southeast-1.rds.amazonaws.com:5432/vetted
```

**SA East (Read)**:
```
DATABASE_READ_REPLICA_SA=postgresql://vetted_admin:PASSWORD@vetted-production-sa-east-1.cluster-ro-ABC123.sa-east-1.rds.amazonaws.com:5432/vetted
```

**Add to Railway environment variables**.

---

## 🔐 PART 5: Production Environment Variable Audit

### Checklist: All Endpoints Point to Production

| Service | Environment | Endpoint | Status |
|---------|-------------|----------|--------|
| **Airwallex** | Production | `https://api.airwallex.com` | ⚠️ Update from sandbox |
| **Smile ID** | Production | `https://api.smileidentity.com` | ⚠️ Update from sandbox |
| **Persona** | Production | `https://api.withpersona.com` | ⚠️ Update from sandbox |
| **Onfido** | Production | `https://api.onfido.com` | ⚠️ Update from sandbox |
| **Wise** | Production | `https://api.transferwise.com` | ⚠️ Update from sandbox |
| **Payoneer** | Production | `https://api.payoneer.com` | ⚠️ Update from sandbox |
| **Upstash Redis** | Production | `redis://...@global.upstash.io` | ✅ Ready |

### Environment Variable Template

**Create `.env.production` file**:

```bash
# ============================================================================
# VETTED PRODUCTION ENVIRONMENT VARIABLES
# ============================================================================
# Last Updated: 2026-07-20
# ============================================================================

# APPLICATION
NODE_ENV=production
PORT=8080
API_VERSION=v1
APP_VERSION=1.0.0

# DATABASE (Railway PostgreSQL)
DATABASE_URL=postgresql://postgres:PASSWORD@containers-us-west-1.railway.app:5432/railway

# DATABASE (AWS Aurora - Optional for Scale)
# DATABASE_URL=postgresql://vetted_admin:PASSWORD@vetted-production.cluster-ABC123.us-east-1.rds.amazonaws.com:5432/vetted
# DATABASE_READ_REPLICA_EU=postgresql://vetted_admin:PASSWORD@vetted-production-eu-west-1.cluster-ro-ABC123.eu-west-1.rds.amazonaws.com:5432/vetted
# DATABASE_READ_REPLICA_AP=postgresql://vetted_admin:PASSWORD@vetted-production-ap-southeast-1.cluster-ro-ABC123.ap-southeast-1.rds.amazonaws.com:5432/vetted
# DATABASE_READ_REPLICA_SA=postgresql://vetted_admin:PASSWORD@vetted-production-sa-east-1.cluster-ro-ABC123.sa-east-1.rds.amazonaws.com:5432/vetted

# REDIS (Upstash)
REDIS_URL=redis://default:YOUR_UPSTASH_PASSWORD@YOUR_ENDPOINT.upstash.io:6379

# JWT
JWT_SECRET=GENERATE_STRONG_SECRET_HERE_MIN_32_CHARS_USE_openssl_rand_base64_32
JWT_EXPIRES_IN=15m

# CORS
CORS_ORIGIN=https://vettedme.app,https://vettedforce.com

# RATE LIMITING
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================================================
# AIRWALLEX PRODUCTION LEDGER API
# ============================================================================
AIRWALLEX_ENVIRONMENT=production
AIRWALLEX_API_KEY=AIRWALLEX_PRODUCTION_API_KEY_HERE
AIRWALLEX_CLIENT_ID=AIRWALLEX_PRODUCTION_CLIENT_ID_HERE
AIRWALLEX_CLIENT_SECRET=AIRWALLEX_PRODUCTION_CLIENT_SECRET_HERE
AIRWALLEX_WEBHOOK_SECRET=AIRWALLEX_PRODUCTION_WEBHOOK_SECRET_HERE
AIRWALLEX_TREASURY_WALLET_ID=AIRWALLEX_TREASURY_WALLET_ID_HERE

# ============================================================================
# SMILE ID LIVE BIOMETRIC GATEWAY
# ============================================================================
SMILE_ID_ENVIRONMENT=production
SMILE_ID_PARTNER_ID=SMILE_ID_PRODUCTION_PARTNER_ID_HERE
SMILE_ID_API_KEY=SMILE_ID_PRODUCTION_API_KEY_HERE
SMILE_ID_CALLBACK_URL=https://api.vettedforce.com/webhooks/smileid

# ============================================================================
# PERSONA KYC PRODUCTION WEBHOOKS
# ============================================================================
PERSONA_ENVIRONMENT=production
PERSONA_API_KEY=PERSONA_PRODUCTION_API_KEY_HERE
PERSONA_WEBHOOK_SECRET=PERSONA_WEBHOOK_SECRET_HERE
PERSONA_CALLBACK_URL=https://api.vettedforce.com/webhooks/persona

# ============================================================================
# ONFIDO ENTERPRISE VERIFICATION
# ============================================================================
ONFIDO_ENVIRONMENT=production
ONFIDO_API_TOKEN=ONFIDO_PRODUCTION_API_TOKEN_HERE
ONFIDO_WEBHOOK_SECRET=ONFIDO_WEBHOOK_SECRET_HERE

# ============================================================================
# WISE API (Backup Payment Provider)
# ============================================================================
WISE_ENVIRONMENT=live
WISE_API_TOKEN=WISE_PRODUCTION_API_TOKEN_HERE
WISE_PROFILE_ID=WISE_PROFILE_ID_HERE

# ============================================================================
# PAYONEER API (Backup Payment Provider)
# ============================================================================
PAYONEER_ENVIRONMENT=production
PAYONEER_USERNAME=PAYONEER_USERNAME_HERE
PAYONEER_PASSWORD=PAYONEER_PASSWORD_HERE
PAYONEER_PARTNER_ID=PAYONEER_PARTNER_ID_HERE

# ============================================================================
# SENTRY ERROR TRACKING
# ============================================================================
SENTRY_DSN=https://YOUR_SENTRY_KEY@o123456.ingest.sentry.io/123456
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# ============================================================================
# DATADOG APM
# ============================================================================
DD_API_KEY=DATADOG_PRODUCTION_API_KEY_HERE
DD_SERVICE=vetted-api
DD_ENV=production
DD_VERSION=1.0.0
DD_LOGS_INJECTION=true
DD_PROFILING_ENABLED=true

# ============================================================================
# AWS S3 (File Storage)
# ============================================================================
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=vetted-production-files

# ============================================================================
# SENDGRID (Email)
# ============================================================================
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
SENDGRID_FROM_EMAIL=noreply@vettedme.app
SENDGRID_FROM_NAME=VettedME

# ============================================================================
# GITHUB OAUTH (Developer Onboarding)
# ============================================================================
GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET
GITHUB_CALLBACK_URL=https://vettedme.app/auth/github/callback

# ============================================================================
# FEATURE FLAGS
# ============================================================================
ENABLE_BETA=true
ENABLE_REFERRAL_PROGRAM=true
ENABLE_VIDEO_INTERVIEWS=false
```

---

## ✅ Post-Deployment Verification

### Step 1: Health Check Endpoints

**Test backend health**:
```bash
curl https://api.vettedforce.com/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-07-20T21:38:00Z",
  "service": "VETTED Backend",
  "version": "v1"
}
```

**Test frontend**:
```bash
curl https://vettedme.app
# Should return HTML
```

**Test B2B landing page**:
```bash
curl https://vettedforce.com
# Should return HTML
```

---

### Step 2: Domain Redirects

**Test vettedme.co → vettedme.app**:
```bash
curl -I https://vettedme.co
# Should return 308 Permanent Redirect
# Location: https://vettedme.app
```

**Test vettedenterprise.com → vettedforce.com**:
```bash
curl -I https://vettedenterprise.com
# Should return 308 Permanent Redirect
# Location: https://vettedforce.com
```

---

### Step 3: API Endpoints

**Test lead capture** (B2B landing page):
```bash
curl -X POST https://api.vettedforce.com/api/v1/leads \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "budget": "20k-30k",
    "techStack": "typescript-react"
  }'
```

**Expected response**:
```json
{
  "success": true,
  "message": "Thank you! We will be in touch within 24 hours.",
  "leadId": "uuid-here"
}
```

---

### Step 4: Database Connectivity

**Test database connection**:
```bash
railway run npx prisma db push
```

**Expected output**:
```
✅  Database connection successful
✅  Schema is up to date
```

---

### Step 5: SSL/TLS Certificates

**All domains should have valid SSL certificates** (provided automatically by Vercel and Railway):

- ✅ https://vettedme.app
- ✅ https://vettedme.co
- ✅ https://vettedforce.com
- ✅ https://vettedenterprise.com
- ✅ https://api.vettedforce.com

**Test SSL**:
```bash
curl -I https://vettedme.app
# Should NOT show SSL errors
```

---

## 🚨 Troubleshooting

### Issue 1: "Domain not verified"

**Solution**:
1. Wait 24-48 hours for DNS propagation
2. Check DNS records with: `nslookup vettedme.app`
3. Verify records match Vercel/Railway instructions

### Issue 2: "502 Bad Gateway"

**Solution**:
1. Check Railway logs: `railway logs`
2. Verify environment variables are set correctly
3. Ensure DATABASE_URL is correct
4. Check if backend service is running

### Issue 3: "Database migration failed"

**Solution**:
1. Check DATABASE_URL format: `postgresql://user:password@host:port/database`
2. Ensure database is accessible (not behind firewall)
3. Run migrations manually: `npx prisma migrate deploy`

### Issue 4: "CORS error"

**Solution**:
1. Check CORS_ORIGIN environment variable includes frontend domain
2. Update backend: `CORS_ORIGIN=https://vettedme.app,https://vettedforce.com`
3. Redeploy backend: `railway up`

---

## 🎉 Deployment Complete!

### Live URLs

- **Frontend (Talent Portal)**: https://vettedme.app
- **Frontend (Redirect)**: https://vettedme.co → https://vettedme.app
- **B2B Landing Page**: https://vettedforce.com
- **B2B Redirect**: https://vettedenterprise.com → https://vettedforce.com
- **Backend API**: https://api.vettedforce.com

### Next Steps

1. **Test all critical flows**:
   - B2B lead capture form
   - GitHub OAuth (developer onboarding)
   - Biometric verification (Smile ID/Persona)
   - Milestone release (Airwallex payout)

2. **Set up monitoring**:
   - Sentry error tracking
   - Datadog APM
   - Uptime monitoring (UptimeRobot, Pingdom)

3. **Launch beta**:
   - Execute developer sourcing (Lagos, Nairobi, São Paulo)
   - Launch cold email outreach (US/EU CTOs)
   - Onboard first 5 enterprise clients

---

**VETTED is now LIVE in production! Time to acquire customers and scale globally! 🚀**

---

**Built with 💙 by the VETTED Team**  
**Last Updated**: July 20, 2026
