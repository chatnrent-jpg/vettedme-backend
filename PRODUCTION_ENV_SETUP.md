# VETTED Production Environment Setup Guide

## 🎯 Quick Start

This guide walks you through setting up the production environment configuration for VETTED in **5 minutes**.

---

## 📋 Prerequisites

Before configuring production environment:

```
✅ Production server provisioned (4+ cores, 8+ GB RAM)
✅ Docker & Docker Compose installed
✅ Domain configured (api.vetted.com)
✅ SSL certificate ready
✅ Smile ID production account created
✅ Airwallex production account created
```

---

## 🚀 Step-by-Step Setup

### **Step 1: Copy Production Template**

```bash
# SSH into your production server
ssh user@your-production-server

# Navigate to VETTED directory
cd /opt/vetted

# Copy production template
cp .env.production.template .env.production
```

---

### **Step 2: Generate Strong Secrets**

```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32
# Copy output → JWT_SECRET_SIGNING_KEY

# Generate encryption key (32+ characters)
openssl rand -base64 32
# Copy output → ENCRYPTION_KEY

# Generate database password (32+ characters)
openssl rand -base64 32
# Copy output → Update DATABASE_URL password
```

**Example outputs:**
```
JWT_SECRET_SIGNING_KEY="7Kx9mP2qR8tY4wE6vN0aB5cD1fG3hJ8k"
ENCRYPTION_KEY="9Lm2nO4pQ6rS8tU0vW1xY3zA5bC7dE9f"
Database password="4Hj6kL8mN0pQ2rS4tU6vW8xY0zA2bC4d"
```

---

### **Step 3: Update Database Configuration**

```bash
nano .env.production

# Find this line:
DATABASE_URL="postgresql://vetted_master:SecOpr_9921_xX@localhost:5432/vetted_ledger?schema=public"

# Replace with your generated password:
DATABASE_URL="postgresql://vetted_master:4Hj6kL8mN0pQ2rS4tU6vW8xY0zA2bC4d@localhost:5432/vetted_ledger?schema=public"
```

---

### **Step 4: Configure Smile ID (Production)**

**A. Get Production Credentials:**
1. Login to Smile ID Portal: https://portal.smileidentity.com
2. Navigate to **Settings** → **API Keys**
3. Create production API key
4. Copy **Partner ID** and **API Key**
5. Copy **Webhook Secret**

**B. Update .env.production:**
```bash
SMILE_ID_API_KEY="prod_sk_smile_live_abc123..."
SMILE_ID_PARTNER_ID="12345"
SMILE_ID_SANDBOX_MODE="false"
SMILE_ID_WEBHOOK_SECRET="whsec_smile_prod_xyz789..."
```

**C. Register Webhook URL:**
In Smile ID Portal:
- Go to **Webhooks** → **Add Webhook**
- URL: `https://api.vetted.com/api/v1/webhooks/vettedme`
- Events: `verification.completed`, `verification.failed`
- Save webhook secret to `.env.production`

---

### **Step 5: Configure Airwallex (Production)**

**A. Get Production Credentials:**
1. Login to Airwallex: https://www.airwallex.com/app
2. Navigate to **Developer** → **API Keys**
3. Create production API key
4. Copy **Client ID** and **API Key**
5. Navigate to **Webhooks** → Copy **Webhook Secret**

**B. Update .env.production:**
```bash
AIRWALLEX_CLIENT_ID="prod_client_abc123..."
AIRWALLEX_API_KEY="prod_ak_airwallex_xyz789..."
AIRWALLEX_ENVIRONMENT="production"
AIRWALLEX_WEBHOOK_SECRET_KEY="whsec_airwallex_prod_def456..."
```

**C. Register Webhook URLs:**
In Airwallex Portal:
- Go to **Webhooks** → **Add Webhook**
- Add two endpoints:

**Deposit Webhook:**
- URL: `https://api.vetted.com/api/v1/webhooks/airwallex/deposit`
- Events: `payment.inbound_transfer.success`

**Payout Webhook:**
- URL: `https://api.vetted.com/api/v1/webhooks/airwallex/payout`
- Events: `payout.completed`, `payout.failed`

**D. Get Wallet IDs:**
In Airwallex Portal:
- Create **Treasury Wallet** (for platform fees)
- Create **Arbitration Wallet** (for dispute escrow)
- Copy wallet IDs to `.env.production`:

```bash
VETTED_TREASURY_WALLET_ID="clw_treasury_abc123"
VETTED_ARBITRATION_WALLET_ID="clw_arbitration_xyz789"
```

---

### **Step 6: Update Security Settings**

```bash
nano .env.production

# Update these values (generated in Step 2):
JWT_SECRET_SIGNING_KEY="7Kx9mP2qR8tY4wE6vN0aB5cD1fG3hJ8k"
ENCRYPTION_KEY="9Lm2nO4pQ6rS8tU0vW1xY3zA5bC7dE9f"

# Update CORS origins (production domains only):
CORS_ORIGIN="https://app.vetted.com,https://vetted.com"

# Update webhook base URL:
WEBHOOK_BASE_URL="https://api.vetted.com"
```

---

### **Step 7: Verify Configuration**

```bash
# Check for any example values still present
cat .env.production | grep -E "(CHANGE_THIS|example|template|...)"

# Should return NO matches
# If matches found, update those values

# Verify all critical values are set
cat .env.production | grep -E "(JWT_SECRET|ENCRYPTION_KEY|SMILE_ID_API_KEY|AIRWALLEX_API_KEY|TREASURY_WALLET)"

# All should show actual values (not placeholders)
```

---

### **Step 8: Secure the File**

```bash
# Set strict permissions (owner read-only)
chmod 400 .env.production

# Verify permissions
ls -la .env.production
# Should show: -r-------- (400)

# Verify ownership
# Should be owned by deployment user (not root)
```

---

## 🔐 Security Best Practices

### **1. Never Commit .env.production**
```bash
# Verify it's in .gitignore
cat .gitignore | grep ".env.production"

# Should show:
# .env.production
```

### **2. Use Secrets Manager (Recommended)**

**AWS Secrets Manager:**
```bash
# Store secret
aws secretsmanager create-secret \
  --name vetted/production/jwt-secret \
  --secret-string "7Kx9mP2qR8tY4wE6vN0aB5cD1fG3hJ8k"

# Retrieve in application
aws secretsmanager get-secret-value \
  --secret-id vetted/production/jwt-secret \
  --query SecretString \
  --output text
```

**HashiCorp Vault:**
```bash
# Store secret
vault kv put secret/vetted/production \
  jwt_secret="7Kx9mP2qR8tY4wE6vN0aB5cD1fG3hJ8k"

# Retrieve in application
vault kv get -field=jwt_secret secret/vetted/production
```

### **3. Rotate Secrets Quarterly**
```bash
# Create rotation schedule (every 90 days)
0 0 1 */3 * /opt/vetted/scripts/rotate-secrets.sh
```

---

## ✅ Production Environment Checklist

```
Configuration:
[ ] .env.production created from template
[ ] All placeholder values replaced
[ ] Strong secrets generated (32+ characters)
[ ] Database password updated
[ ] Smile ID production credentials configured
[ ] Airwallex production credentials configured
[ ] Treasury wallet ID set
[ ] Arbitration wallet ID set
[ ] CORS origins whitelisted (production only)
[ ] Webhook base URL updated

External Services:
[ ] Smile ID webhooks registered
[ ] Airwallex deposit webhook registered
[ ] Airwallex payout webhook registered
[ ] Email provider configured (optional)
[ ] Monitoring configured (optional)

Security:
[ ] File permissions set to 400 (read-only)
[ ] Ownership verified (deployment user, not root)
[ ] .gitignore includes .env.production
[ ] Secrets backed up in secure vault
[ ] Rotation schedule configured

Testing:
[ ] Application starts without errors
[ ] Database connection successful
[ ] API health check passing
[ ] Webhook endpoints accessible
[ ] External services reachable
```

---

## 🧪 Testing Configuration

### **Test Database Connection:**
```bash
docker compose -f docker-compose.production.yml run --rm vetted-core-engine \
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$connect()
      .then(() => console.log('✅ Database connected'))
      .catch(err => console.error('❌ Database error:', err))
      .finally(() => prisma.\$disconnect());
  "
```

### **Test API Health:**
```bash
# Start services
docker compose -f docker-compose.production.yml up -d

# Wait for health check
sleep 10

# Test health endpoint
curl http://localhost:8080/api/v1/health

# Expected: {"status":"healthy",...}
```

### **Test Smile ID Connection:**
```bash
# Test API connectivity (without making actual verification)
curl -X POST https://api.smileidentity.com/v1/auth \
  -H "Content-Type: application/json" \
  -d '{
    "partner_id": "YOUR_PARTNER_ID",
    "api_key": "YOUR_API_KEY"
  }'

# Expected: {"token":"...", "expires_in":3600}
```

### **Test Airwallex Connection:**
```bash
# Test API authentication
curl -X POST https://api.airwallex.com/api/v1/authentication/login \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "api_key": "YOUR_API_KEY"
  }'

# Expected: {"token":"...", "expires_at":"..."}
```

---

## 🚨 Troubleshooting

### **Error: "Missing environment variable"**
```bash
# Check which variable is missing
docker compose -f docker-compose.production.yml config

# Verify .env.production has all required variables
cat .env.production | wc -l
# Should have 40+ lines
```

### **Error: "Database connection failed"**
```bash
# Check database is running
docker compose -f docker-compose.production.yml ps vetted-db-cluster

# Check database password matches
docker compose -f docker-compose.production.yml exec vetted-db-cluster \
  psql -U vetted_master -d vetted_ledger -c "SELECT version();"
```

### **Error: "Smile ID authentication failed"**
```bash
# Verify API key format (should start with "prod_sk_")
echo $SMILE_ID_API_KEY

# Verify sandbox mode is disabled
echo $SMILE_ID_SANDBOX_MODE
# Should show: false
```

### **Error: "Airwallex webhook signature invalid"**
```bash
# Verify webhook secret matches Airwallex portal
echo $AIRWALLEX_WEBHOOK_SECRET_KEY
# Should match secret shown in Airwallex dashboard
```

---

## 📚 Related Documentation

- [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) - Full deployment guide
- [WEBHOOK_SYSTEM.md](WEBHOOK_SYSTEM.md) - Webhook configuration
- [.env.production.template](.env.production.template) - Configuration template

---

## ✅ Summary

**Production environment setup complete! Your .env.production file now contains:**

```
✅ Strong secrets (32+ characters)
✅ Production API credentials (Smile ID, Airwallex)
✅ Treasury & arbitration wallet IDs
✅ Webhook URLs registered
✅ Security hardened (CORS, rate limiting)
✅ File permissions secured (400)

Ready to deploy! 🚀
```

---

**Next Steps:**
1. Start services: `docker compose -f docker-compose.production.yml up -d`
2. Run migrations: `npx prisma migrate deploy`
3. Verify health: `curl http://localhost:8080/api/v1/health`
4. Configure Nginx reverse proxy + SSL
5. Monitor logs: `docker compose logs -f`

**VETTED is production-ready!** 🚀✅🔐
