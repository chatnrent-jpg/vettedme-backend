# VETTED - Deployment Guide

This guide covers deploying the VETTED backend infrastructure to production.

---

## 🎯 Pre-Deployment Checklist

### 1. External Service Accounts

#### Smile ID (VettedME - Biometric Verification)
- [ ] Create production Smile ID account
- [ ] Verify Partner ID and API Key
- [ ] Set up webhook endpoint URL
- [ ] Configure NIN/BVN verification permissions
- [ ] Test in sandbox mode first

**Webhook URL**: `https://your-domain.com/api/v1/webhooks/vettedme`

#### Airwallex (VettedPay - Payment Settlement)
- [ ] Create production Airwallex account
- [ ] Complete business verification (KYB)
- [ ] Get Client ID and API Key
- [ ] Set up webhook endpoint URL
- [ ] Configure payment corridors (US/UK/EU → Nigeria)
- [ ] Test in demo mode first

**Webhook URL**: `https://your-domain.com/api/v1/webhooks/vettedpay/airwallex`

### 2. Infrastructure Requirements
- [ ] PostgreSQL 14+ database (RDS, Railway, Supabase, etc.)
- [ ] Redis instance for caching (optional but recommended)
- [ ] SSL certificate for HTTPS
- [ ] Domain name configured
- [ ] CI/CD pipeline (GitHub Actions, Railway, etc.)

### 3. Environment Variables
- [ ] All production credentials configured
- [ ] JWT secret generated (32+ character random string)
- [ ] Database connection string
- [ ] CORS origin set to frontend domain
- [ ] Webhook secrets configured

---

## 🚀 Deployment Options

### Option 1: Railway (Recommended - Fastest)

Railway provides zero-config deployment with automatic HTTPS, environment variables, and database provisioning.

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Initialize project
railway init

# 4. Provision PostgreSQL
railway add --database postgresql

# 5. Set environment variables
railway variables set SMILE_ID_PARTNER_ID="your-id"
railway variables set SMILE_ID_API_KEY="your-key"
railway variables set AIRWALLEX_CLIENT_ID="your-id"
railway variables set AIRWALLEX_API_KEY="your-key"
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set NODE_ENV="production"
railway variables set SMILE_ID_SANDBOX_MODE="false"
railway variables set AIRWALLEX_ENVIRONMENT="production"

# 6. Deploy
railway up

# 7. Run database migrations
railway run npx prisma migrate deploy

# 8. Get deployment URL
railway domain
```

**Post-Deployment**:
1. Configure Smile ID webhook to point to `https://your-railway-domain.railway.app/api/v1/webhooks/vettedme`
2. Configure Airwallex webhook to point to `https://your-railway-domain.railway.app/api/v1/webhooks/vettedpay/airwallex`

---

### Option 2: Docker + Cloud Provider (AWS, GCP, Azure)

#### Prerequisites
- Docker installed
- Cloud account (AWS ECS, GCP Cloud Run, Azure Container Instances)
- Container registry (ECR, GCR, ACR, Docker Hub)

#### Build and Push Docker Image

```bash
# 1. Build image
docker build -t vetted-backend:latest .

# 2. Tag for registry (example: Docker Hub)
docker tag vetted-backend:latest your-username/vetted-backend:latest

# 3. Push to registry
docker push your-username/vetted-backend:latest
```

#### Deploy to AWS ECS (Example)

```bash
# 1. Create ECS task definition
aws ecs register-task-definition \
  --family vetted-backend \
  --container-definitions file://ecs-task-definition.json

# 2. Create ECS service
aws ecs create-service \
  --cluster your-cluster \
  --service-name vetted-backend \
  --task-definition vetted-backend \
  --desired-count 2 \
  --launch-type FARGATE

# 3. Configure load balancer
# ... (configure ALB to route traffic to ECS service)
```

---

### Option 3: Traditional VPS (DigitalOcean, Linode, Vultr)

#### Server Setup

```bash
# 1. SSH into server
ssh root@your-server-ip

# 2. Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# 4. Install PM2 (process manager)
sudo npm install -g pm2

# 5. Clone repository
git clone https://github.com/your-org/vetted-backend.git
cd vetted-backend

# 6. Install dependencies
npm ci --only=production

# 7. Set up environment variables
cp .env.example .env
nano .env  # Edit with production values

# 8. Build application
npm run build

# 9. Run database migrations
npx prisma migrate deploy

# 10. Start with PM2
pm2 start dist/index.js --name vetted-backend

# 11. Configure PM2 to restart on reboot
pm2 startup
pm2 save
```

#### Nginx Reverse Proxy Configuration

```nginx
server {
    listen 80;
    server_name api.vetted.ai;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### SSL with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.vetted.ai
```

---

## 🔐 Security Hardening

### 1. Environment Variables
Never commit `.env` files to Git. Use secure secret management:

**Railway**: Built-in encrypted variables  
**AWS**: Secrets Manager or Parameter Store  
**Kubernetes**: Kubernetes Secrets  

### 2. Database Security
- Enable SSL/TLS for database connections
- Use strong passwords (32+ characters)
- Restrict database access to application IPs only
- Regular backups (automated daily)

### 3. API Rate Limiting
Already configured in `src/index.ts`:
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});
```

Adjust based on expected traffic.

### 4. CORS Configuration
Update `CORS_ORIGIN` in `.env` to match your frontend domain:
```env
CORS_ORIGIN="https://app.vetted.ai"
```

### 5. Helmet Security Headers
Already configured with:
- Content Security Policy
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- XSS Protection

---

## 📊 Monitoring & Logging

### Application Logs
Logs are written to `logs/combined.log` and `logs/error.log`.

**View logs**:
```bash
# Railway
railway logs

# PM2
pm2 logs vetted-backend

# Docker
docker logs -f container-name
```

### Recommended Monitoring Tools
1. **Sentry** - Error tracking
2. **Datadog** - Infrastructure monitoring
3. **LogRocket** - Session replay
4. **PagerDuty** - Incident alerting

### Health Check Endpoint
```
GET /health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2026-07-19T20:30:00.000Z",
  "service": "VETTED Backend",
  "version": "v1"
}
```

Configure uptime monitoring (UptimeRobot, Pingdom) to hit this endpoint every 5 minutes.

---

## 🔄 Database Migrations

### Production Migration Strategy

```bash
# 1. Backup database first
pg_dump -U vetted_user -d vetted_db > backup_$(date +%Y%m%d).sql

# 2. Run migrations
npx prisma migrate deploy

# 3. Verify data integrity
npx prisma db seed  # If you have seed data
```

### Rollback Plan
If migration fails:
```bash
# Restore from backup
psql -U vetted_user -d vetted_db < backup_20260719.sql

# Revert code to previous version
git checkout previous-commit
npm run build
pm2 restart vetted-backend
```

---

## 🧪 Post-Deployment Testing

### 1. Health Check
```bash
curl https://api.vetted.ai/health
```

### 2. Authentication
```bash
curl -X POST https://api.vetted.ai/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","firstName":"Test","lastName":"User","role":"TALENT"}'
```

### 3. VettedME Verification (Sandbox)
```bash
curl -X POST https://api.vetted.ai/api/v1/vettedme/verification/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"userId":"user-uuid","idType":"NIN","idNumber":"12345678901","firstName":"Test","lastName":"User"}'
```

### 4. Webhook Endpoints
Test webhook signature validation:
```bash
# Use Smile ID test webhook payload
curl -X POST https://api.vetted.ai/api/v1/webhooks/vettedme \
  -H "Content-Type: application/json" \
  -H "X-Signature: test-signature" \
  -d '{"user_id":"test","session_id":"test","verification_status":"VERIFIED"}'
```

---

## 📈 Scaling Strategy

### Horizontal Scaling
1. Deploy multiple instances behind load balancer
2. Use Redis for session storage (currently stateless JWT)
3. Database read replicas for query performance

### Vertical Scaling
- **Starter**: 512MB RAM, 0.5 CPU (handles ~100 req/s)
- **Growth**: 2GB RAM, 1 CPU (handles ~500 req/s)
- **Scale**: 4GB RAM, 2 CPU (handles ~2000 req/s)

### Database Optimization
- Index frequently queried columns (already configured in Prisma schema)
- Connection pooling (configure in `DATABASE_URL`)
- Periodic VACUUM and ANALYZE in PostgreSQL

---

## 🚨 Incident Response

### Common Issues

#### 1. Database Connection Errors
```bash
# Check database status
pg_isready -h your-db-host -p 5432

# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Restart application
pm2 restart vetted-backend
```

#### 2. Webhook Signature Validation Failures
- Verify `SMILE_ID_API_KEY` and `AIRWALLEX_WEBHOOK_SECRET` match dashboard
- Check system time is synchronized (NTP)
- Review webhook logs in Smile ID/Airwallex dashboard

#### 3. High Error Rate
```bash
# Check error logs
tail -f logs/error.log

# Monitor system resources
htop

# Check for memory leaks
pm2 monit
```

---

## 📞 Support

For deployment issues:
- **Engineering**: engineering@vetted.ai
- **DevOps**: devops@vetted.ai
- **On-Call**: +1-XXX-XXX-XXXX (PagerDuty)

---

**Last Updated**: July 19, 2026
