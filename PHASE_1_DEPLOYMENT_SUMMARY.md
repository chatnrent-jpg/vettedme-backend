# 🚀 Phase 1: Production Deployment - Ready to Launch

## Executive Summary

**VETTED is ready to go LIVE in production!** All deployment scripts, configurations, and checklists have been prepared for a seamless multi-cloud launch.

**Timeline**: 2-3 hours (first-time setup)  
**Deployment Stack**: Vercel (Frontend) + Railway (Backend) + PostgreSQL (Database)  
**Domains**: vettedme.app, vettedme.co, vettedforce.com, vettedenterprise.com

---

## ✅ Deliverables

### 1. **Complete Deployment Guide** (10,000+ words)
**File**: `PRODUCTION_DEPLOYMENT_GUIDE.md`

**Covers**:
- Pre-deployment checklist (accounts, tools, domains)
- Frontend deployment (Vercel + Next.js 15)
- Backend deployment (Railway + Node.js/Express)
- Database setup (PostgreSQL + multi-region replicas)
- Domain mapping (4 domains)
- Environment variable configuration
- Post-deployment verification
- Troubleshooting guide

---

### 2. **Automated Deployment Scripts**

**Frontend (Vercel)**:
- `deploy-vercel.sh` (Mac/Linux)
- `deploy-vercel.bat` (Windows)
- `frontend/vercel.json` (Vercel configuration)

**Backend (Railway)**:
- `deploy-railway.sh` (Mac/Linux)
- `deploy-railway.bat` (Windows)
- `railway.json` (Railway configuration - existing)

**Features**:
- ✅ One-click deployment
- ✅ Automatic dependency installation
- ✅ Production build optimization
- ✅ Linting checks
- ✅ Database migrations
- ✅ Health checks

---

### 3. **Production Environment Checklist**
**File**: `.env.production.checklist.md`

**Covers**:
- 50+ environment variables
- Production API key requirements
- Step-by-step key acquisition guides
- Security checklist
- Verification scripts
- Final deployment commands

**Critical Variables**:
- ✅ **Airwallex**: Production API keys + webhook secrets
- ✅ **Smile ID**: Production partner ID + API keys (Nigeria, Kenya)
- ✅ **Persona**: Production API keys (Brazil)
- ✅ **Onfido**: Production API tokens (global backup)
- ✅ **Upstash Redis**: Production connection string
- ✅ **Database**: Railway PostgreSQL URL
- ✅ **JWT Secret**: Strong 32+ character secret
- ✅ **CORS**: Production domains only
- ✅ **Sentry**: Error tracking DSN
- ✅ **Datadog**: APM API key

---

## 🌐 Domain Architecture

### Production URLs

| Domain | Purpose | Deployment | Status |
|--------|---------|------------|--------|
| **vettedme.app** | Talent portal (main) | Vercel | 🟡 Pending DNS |
| **vettedme.co** | Redirect to .app | Vercel | 🟡 Pending DNS |
| **vettedforce.com** | B2B landing page | Vercel | 🟡 Pending DNS |
| **vettedenterprise.com** | Redirect to vettedforce.com | Vercel | 🟡 Pending DNS |
| **api.vettedforce.com** | Backend API | Railway | 🟡 Pending DNS |

### DNS Configuration Required

**For vettedme.app** (at domain registrar):
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel)
TTL: 3600
```

**For api.vettedforce.com**:
```
Type: CNAME
Name: api
Value: YOUR_PROJECT.up.railway.app
TTL: 3600
```

---

## 🚀 Deployment Steps (Quick Start)

### Option A: Automated Deployment (Recommended)

**Windows**:
```cmd
REM Deploy frontend
cd C:\VETTEDCARE.AI\vettedcare-backend
deploy-vercel.bat

REM Deploy backend
deploy-railway.bat
```

**Mac/Linux**:
```bash
# Deploy frontend
cd /path/to/vettedcare-backend
chmod +x deploy-vercel.sh
./deploy-vercel.sh

# Deploy backend
chmod +x deploy-railway.sh
./deploy-railway.sh
```

---

### Option B: Manual Deployment

**Step 1: Deploy Frontend to Vercel**
```bash
cd frontend
npm install
npm run build
vercel --prod
```

**Step 2: Configure Domains in Vercel Dashboard**
1. Go to: https://vercel.com/your-username/vetted-frontend/settings/domains
2. Add: vettedme.app, vettedme.co, vettedforce.com, vettedenterprise.com
3. Configure redirects: .co → .app, vettedenterprise.com → vettedforce.com

**Step 3: Deploy Backend to Railway**
```bash
cd C:\VETTEDCARE.AI\vettedcare-backend
npm install
npm run build
railway up
railway run npx prisma migrate deploy
```

**Step 4: Configure Custom Domain**
1. Go to: https://railway.app/project/YOUR_PROJECT/settings
2. Add custom domain: api.vettedforce.com
3. Add DNS CNAME record at domain registrar

**Step 5: Set Environment Variables**
1. Go to Railway dashboard → Variables
2. Copy from `.env.production.template`
3. Replace all placeholders with production keys
4. Save

---

## 🔐 Environment Variable Priorities

### Must Have (Critical for Launch)

| Variable | Priority | Notes |
|----------|----------|-------|
| `DATABASE_URL` | 🔴 CRITICAL | Railway PostgreSQL connection |
| `REDIS_URL` | 🔴 CRITICAL | Upstash Redis (rate limiting) |
| `JWT_SECRET` | 🔴 CRITICAL | Generate with `openssl rand -base64 32` |
| `AIRWALLEX_API_KEY` | 🔴 CRITICAL | Production Airwallex keys |
| `SMILE_ID_API_KEY` | 🔴 CRITICAL | Production Smile ID keys |
| `PERSONA_API_KEY` | 🔴 CRITICAL | Production Persona keys |
| `CORS_ORIGIN` | 🔴 CRITICAL | Production domains only |

### Nice to Have (Can Add Later)

| Variable | Priority | Notes |
|----------|----------|-------|
| `ONFIDO_API_TOKEN` | 🟡 MEDIUM | Backup identity provider |
| `WISE_API_TOKEN` | 🟡 MEDIUM | Backup payment provider |
| `PAYONEER_USERNAME` | 🟡 MEDIUM | Backup payment provider |
| `SENTRY_DSN` | 🟡 MEDIUM | Error tracking (recommended) |
| `DD_API_KEY` | 🟡 MEDIUM | APM monitoring (recommended) |
| `SENDGRID_API_KEY` | 🟡 MEDIUM | Email notifications |
| `AWS_ACCESS_KEY_ID` | 🟢 LOW | File storage (S3) |

---

## ✅ Post-Deployment Verification

### Step 1: Health Checks

**Backend API**:
```bash
curl https://api.vettedforce.com/health
# Expected: {"status":"healthy","timestamp":"2026-07-20T..."}
```

**Frontend**:
```bash
curl -I https://vettedme.app
# Expected: HTTP/2 200
```

**B2B Landing Page**:
```bash
curl -I https://vettedforce.com
# Expected: HTTP/2 200
```

---

### Step 2: Test Critical Endpoints

**Lead Capture (B2B)**:
```bash
curl -X POST https://api.vettedforce.com/api/v1/leads \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","budget":"20k-30k","techStack":"typescript-react"}'
```

**Expected**:
```json
{"success":true,"message":"Thank you! We will be in touch within 24 hours.","leadId":"..."}
```

---

### Step 3: Test Domain Redirects

**vettedme.co → vettedme.app**:
```bash
curl -I https://vettedme.co
# Expected: 308 Permanent Redirect → https://vettedme.app
```

**vettedenterprise.com → vettedforce.com**:
```bash
curl -I https://vettedenterprise.com
# Expected: 308 Permanent Redirect → https://vettedforce.com
```

---

### Step 4: Verify SSL/TLS

All domains should have valid SSL certificates (auto-provisioned by Vercel/Railway):

- ✅ https://vettedme.app
- ✅ https://vettedme.co
- ✅ https://vettedforce.com
- ✅ https://vettedenterprise.com
- ✅ https://api.vettedforce.com

**Test**:
```bash
curl -I https://vettedme.app
# Should NOT show SSL certificate errors
```

---

## 📊 Expected Performance Metrics

### Frontend (Vercel)

| Metric | Target | Notes |
|--------|--------|-------|
| **TTFB** (Time to First Byte) | <100ms | Vercel Edge Network |
| **FCP** (First Contentful Paint) | <1.2s | Next.js 15 optimization |
| **LCP** (Largest Contentful Paint) | <2.5s | Above-the-fold content |
| **TTI** (Time to Interactive) | <3.0s | JavaScript hydration |
| **Lighthouse Score** | 95+ | Performance, Accessibility, SEO |

---

### Backend (Railway)

| Metric | Target | Notes |
|--------|--------|-------|
| **API Latency** (P95) | <200ms | Express + PostgreSQL |
| **Database Query** (P95) | <50ms | Optimized Prisma queries |
| **Uptime** | 99.9%+ | Railway SLA |
| **Error Rate** | <0.1% | Sentry monitoring |
| **Throughput** | 1,000 req/min | Auto-scaling enabled |

---

## 🚨 Troubleshooting

### Issue 1: "Domain not verified"
**Solution**: Wait 24-48 hours for DNS propagation, verify DNS records with `nslookup`

### Issue 2: "502 Bad Gateway"
**Solution**: Check Railway logs (`railway logs`), verify environment variables

### Issue 3: "Database migration failed"
**Solution**: Verify DATABASE_URL format, ensure database is accessible

### Issue 4: "CORS error"
**Solution**: Update CORS_ORIGIN to include production domains, redeploy

### Issue 5: "Rate limit exceeded"
**Solution**: Verify REDIS_URL is set correctly, check Upstash dashboard

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| **PRODUCTION_DEPLOYMENT_GUIDE.md** | Complete deployment guide (10,000+ words) |
| **.env.production.checklist.md** | Environment variable checklist (50+ variables) |
| **PHASE_1_DEPLOYMENT_SUMMARY.md** | This file (deployment summary) |
| **deploy-vercel.sh / .bat** | Automated frontend deployment |
| **deploy-railway.sh / .bat** | Automated backend deployment |
| **frontend/vercel.json** | Vercel configuration |
| **railway.json** | Railway configuration (existing) |
| **.env.production.template** | Production environment template (existing) |

---

## 🎯 Next Steps After Deployment

### Immediate (Day 1)

1. **Verify all endpoints** (health checks, lead capture, GitHub OAuth)
2. **Test payment flows** (Airwallex sandbox → production)
3. **Test biometric verification** (Smile ID sandbox → production)
4. **Set up monitoring** (Sentry error tracking, Datadog APM)
5. **Configure uptime monitoring** (UptimeRobot, Pingdom)

### Short-Term (Week 1)

1. **Launch beta developer onboarding** (Lagos, Nairobi, São Paulo)
2. **Launch cold email outreach** (US/EU CTOs, 50 emails/day)
3. **Monitor conversion funnels** (landing page → lead → demo)
4. **Collect feedback** (first 10 developers, first 5 clients)
5. **Iterate on platform** (bug fixes, UX improvements)

### Long-Term (Month 1)

1. **Scale infrastructure** (AWS Aurora multi-region database)
2. **Expand to additional corridors** (Ghana, Uganda, Argentina)
3. **Launch referral program** (developers refer friends, earn $50)
4. **Build admin dashboard** (lead management, developer review queue)
5. **Achieve profitability** (10-20 enterprise customers, 50 verified developers)

---

## 🎉 Deployment Readiness: 100%

**You now have**:
- ✅ Complete deployment guide (10,000+ words)
- ✅ Automated deployment scripts (Windows + Mac/Linux)
- ✅ Production environment checklist (50+ variables)
- ✅ Domain configuration guide (4 domains)
- ✅ Post-deployment verification steps
- ✅ Troubleshooting guide
- ✅ Performance benchmarks

**Time to deploy and launch VETTED into the wild! 🚀**

---

**Deployment Command (One-Liner)**:

```bash
# Windows
deploy-vercel.bat && deploy-railway.bat

# Mac/Linux
./deploy-vercel.sh && ./deploy-railway.sh
```

---

**Built with 💙 by the VETTED Team**  
**Last Updated**: July 20, 2026
