# VETTED Production Deployment Guide

## 🎯 Overview

This guide covers **production deployment** of the VETTED platform using Docker Compose. It includes security hardening, monitoring setup, backup strategies, and disaster recovery procedures.

---

## 🏗️ Architecture Overview

### **Production Stack:**
```
┌─────────────────────────────────────────────────┐
│            Load Balancer (Nginx/HAProxy)        │
│            SSL/TLS Termination                  │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         VETTED Core API (Node.js/Express)       │
│         Container: vetted_api_node              │
│         Port: 8080                              │
└─────────────────────────────────────────────────┘
          │                            │
          ▼                            ▼
┌──────────────────────┐    ┌──────────────────────┐
│ PostgreSQL Database  │    │   Redis Cache        │
│ vetted_postgres_db   │    │   (Optional)         │
│ Port: 5432           │    │   Port: 6379         │
└──────────────────────┘    └──────────────────────┘
```

---

## 📋 Pre-Deployment Checklist

### **1. Server Requirements:**
```
Minimum (Development/Staging):
├── CPU: 2 cores
├── RAM: 4 GB
├── Disk: 50 GB SSD
└── OS: Ubuntu 22.04 LTS or higher

Recommended (Production):
├── CPU: 4 cores (8+ for high load)
├── RAM: 8 GB (16+ for high load)
├── Disk: 100 GB SSD (with backup)
└── OS: Ubuntu 22.04 LTS or higher
```

### **2. Software Requirements:**
```bash
# Docker & Docker Compose
Docker: 24.0+ 
Docker Compose: 2.20+

# Check versions
docker --version
docker compose version

# Install if missing (Ubuntu)
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
```

### **3. Domain & SSL:**
```
Domain: api.vetted.com
SSL Certificate: Let's Encrypt or commercial

Subdomains needed:
├── api.vetted.com (Backend API)
├── app.vetted.com (Frontend)
└── webhooks.vetted.com (Webhook endpoints - optional)
```

### **4. External Services:**
```
[ ] Smile ID production account
    - Partner ID
    - API Key
    - Webhook secret

[ ] Airwallex production account
    - Client ID
    - API Key
    - Webhook secret
    - Treasury wallet ID
    - Arbitration wallet ID

[ ] Email provider (SendGrid, AWS SES)
[ ] Monitoring (Datadog, New Relic) - optional
[ ] Error tracking (Sentry) - optional
[ ] Cloud storage (AWS S3) - optional
```

---

## 🚀 Deployment Steps

### **Step 1: Clone Repository**
```bash
# SSH into your server
ssh user@your-server-ip

# Navigate to deployment directory
cd /opt

# Clone repository
sudo git clone https://github.com/your-org/vettedcare-backend.git vetted
cd vetted

# Set ownership
sudo chown -R $USER:$USER /opt/vetted
```

---

### **Step 2: Configure Environment**
```bash
# Copy production environment file
cp .env.production.example .env.production

# Edit with production values
nano .env.production

# CRITICAL: Update these values:
# 1. JWT_SECRET_SIGNING_KEY (generate: openssl rand -base64 32)
# 2. ENCRYPTION_KEY (generate: openssl rand -base64 32)
# 3. DATABASE_URL password (change SecOpr_9921_xX)
# 4. SMILE_ID_API_KEY (production)
# 5. AIRWALLEX_API_KEY (production)
# 6. VETTED_TREASURY_WALLET_ID (production)
# 7. All webhook secrets

# Verify configuration
cat .env.production | grep -v "CHANGE_THIS"
# Should return no matches if all secrets are updated
```

---

### **Step 3: Database Setup**
```bash
# Start database only (first time)
docker compose -f docker-compose.production.yml up -d vetted-db-cluster

# Wait for database to be healthy
docker compose -f docker-compose.production.yml ps

# Run migrations
docker compose -f docker-compose.production.yml run --rm vetted-core-engine npx prisma migrate deploy

# (Optional) Seed production data
docker compose -f docker-compose.production.yml run --rm vetted-core-engine npx prisma db seed
```

---

### **Step 4: Build & Start Services**
```bash
# Build production images
docker compose -f docker-compose.production.yml build

# Start all services
docker compose -f docker-compose.production.yml up -d

# Verify all containers are running
docker compose -f docker-compose.production.yml ps

# Expected output:
# NAME                 STATUS        PORTS
# vetted_api_node      Up (healthy)  0.0.0.0:8080->8080/tcp
# vetted_postgres_db   Up (healthy)  0.0.0.0:5432->5432/tcp
# vetted_redis_cache   Up (healthy)  0.0.0.0:6379->6379/tcp
```

---

### **Step 5: Verify Deployment**
```bash
# Check API health
curl http://localhost:8080/api/v1/health

# Expected response:
# {"status":"healthy","timestamp":"...","services":{...}}

# Check logs
docker compose -f docker-compose.production.yml logs -f vetted-core-engine

# Check database connection
docker compose -f docker-compose.production.yml exec vetted-db-cluster psql -U vetted_master -d vetted_ledger -c "SELECT version();"
```

---

### **Step 6: Configure Reverse Proxy (Nginx)**
```bash
# Install Nginx
sudo apt install -y nginx

# Create configuration
sudo nano /etc/nginx/sites-available/vetted

# Add this configuration:
```

```nginx
upstream vetted_backend {
    server localhost:8080;
    keepalive 64;
}

server {
    listen 80;
    server_name api.vetted.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.vetted.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.vetted.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.vetted.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Logging
    access_log /var/log/nginx/vetted-access.log;
    error_log /var/log/nginx/vetted-error.log;
    
    # Proxy to backend
    location / {
        proxy_pass http://vetted_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer sizes
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Rate limiting for webhooks
    location /api/v1/webhooks {
        limit_req zone=webhook_limit burst=10 nodelay;
        proxy_pass http://vetted_backend;
    }
    
    # Static files (if any)
    location /static {
        alias /opt/vetted/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Rate limit zone (add to http block in nginx.conf)
limit_req_zone $binary_remote_addr zone=webhook_limit:10m rate=10r/s;
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/vetted /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### **Step 7: SSL Certificate (Let's Encrypt)**
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.vetted.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

---

### **Step 8: Configure Firewall**
```bash
# Install UFW (if not already installed)
sudo apt install -y ufw

# Allow SSH (CRITICAL - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny direct access to Docker ports (only allow via Nginx)
sudo ufw deny 8080/tcp
sudo ufw deny 5432/tcp
sudo ufw deny 6379/tcp

# Enable firewall
sudo ufw enable

# Verify rules
sudo ufw status
```

---

## 🔐 Security Hardening

### **1. Database Security:**
```bash
# Change default database password
docker compose -f docker-compose.production.yml exec vetted-db-cluster psql -U vetted_master -d vetted_ledger

# In PostgreSQL prompt:
ALTER USER vetted_master WITH PASSWORD 'NEW_STRONG_PASSWORD';

# Update .env.production with new password
nano .env.production

# Restart services
docker compose -f docker-compose.production.yml restart
```

### **2. Secrets Management:**
```bash
# Use environment-specific files
# Production: .env.production (never commit)
# Staging: .env.staging
# Development: .env.local

# Ensure .gitignore includes:
echo ".env.production" >> .gitignore
echo ".env.staging" >> .gitignore
echo ".env.local" >> .gitignore

# For AWS: Use AWS Secrets Manager
# For Azure: Use Azure Key Vault
# For GCP: Use Google Secret Manager
```

### **3. Regular Updates:**
```bash
# Update Docker images monthly
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d

# Update system packages
sudo apt update && sudo apt upgrade -y
```

---

## 📊 Monitoring & Logging

### **1. View Logs:**
```bash
# All services
docker compose -f docker-compose.production.yml logs -f

# Specific service
docker compose -f docker-compose.production.yml logs -f vetted-core-engine

# Last 100 lines
docker compose -f docker-compose.production.yml logs --tail=100 vetted-core-engine

# Filter by error
docker compose -f docker-compose.production.yml logs | grep ERROR
```

### **2. Health Checks:**
```bash
# API health
curl https://api.vetted.com/api/v1/health

# Webhook health
curl https://api.vetted.com/api/v1/webhooks/health

# Database health
docker compose -f docker-compose.production.yml exec vetted-db-cluster pg_isready -U vetted_master
```

### **3. Resource Monitoring:**
```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

---

## 💾 Backup Strategy

### **1. Automated Database Backups:**
```bash
# Create backup script
sudo nano /opt/vetted/scripts/backup-db.sh
```

```bash
#!/bin/bash
# VETTED Database Backup Script

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="vetted_ledger_${TIMESTAMP}.sql.gz"

# Create backup
docker compose -f /opt/vetted/docker-compose.production.yml exec -T vetted-db-cluster \
    pg_dump -U vetted_master -d vetted_ledger | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Verify backup
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    echo "Backup successful: ${BACKUP_FILE}"
    
    # Delete backups older than 30 days
    find ${BACKUP_DIR} -name "vetted_ledger_*.sql.gz" -mtime +30 -delete
else
    echo "Backup failed!"
    exit 1
fi
```

```bash
# Make executable
sudo chmod +x /opt/vetted/scripts/backup-db.sh

# Test backup
sudo /opt/vetted/scripts/backup-db.sh

# Schedule daily backups (2 AM)
sudo crontab -e

# Add this line:
0 2 * * * /opt/vetted/scripts/backup-db.sh >> /var/log/vetted-backup.log 2>&1
```

### **2. Upload Backups to S3:**
```bash
# Install AWS CLI
sudo apt install -y awscli

# Configure AWS credentials
aws configure

# Update backup script to upload to S3
# Add this to backup-db.sh after successful backup:
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" s3://vetted-backups/database/
```

---

## 🔄 Disaster Recovery

### **1. Restore from Backup:**
```bash
# Stop application
docker compose -f docker-compose.production.yml stop vetted-core-engine

# Download backup from S3
aws s3 cp s3://vetted-backups/database/vetted_ledger_20260719_020000.sql.gz /backups/

# Restore database
gunzip -c /backups/vetted_ledger_20260719_020000.sql.gz | \
    docker compose -f docker-compose.production.yml exec -T vetted-db-cluster \
    psql -U vetted_master -d vetted_ledger

# Restart application
docker compose -f docker-compose.production.yml start vetted-core-engine
```

### **2. Full System Recovery:**
```bash
# On new server:

# 1. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Clone repository
cd /opt
sudo git clone https://github.com/your-org/vettedcare-backend.git vetted
cd vetted

# 3. Restore environment file from secure backup
# (stored in password manager or secure vault)

# 4. Start database
docker compose -f docker-compose.production.yml up -d vetted-db-cluster

# 5. Restore database backup
# (see step 1 above)

# 6. Start all services
docker compose -f docker-compose.production.yml up -d

# 7. Verify
curl http://localhost:8080/api/v1/health
```

---

## 🔧 Maintenance

### **1. Rolling Updates (Zero Downtime):**
```bash
# Pull latest code
git pull origin main

# Build new image
docker compose -f docker-compose.production.yml build vetted-core-engine

# Restart service (health check ensures smooth transition)
docker compose -f docker-compose.production.yml up -d vetted-core-engine

# Old container stops only after new one is healthy
```

### **2. Database Migrations:**
```bash
# Run migrations
docker compose -f docker-compose.production.yml run --rm vetted-core-engine \
    npx prisma migrate deploy

# Verify schema
docker compose -f docker-compose.production.yml run --rm vetted-core-engine \
    npx prisma migrate status
```

### **3. Scaling:**
```bash
# Scale API instances (requires load balancer)
docker compose -f docker-compose.production.yml up -d --scale vetted-core-engine=3

# Verify
docker compose -f docker-compose.production.yml ps
```

---

## 📈 Performance Optimization

### **1. Database Tuning:**
Already configured in `docker-compose.production.yml`:
- `max_connections=200`
- `shared_buffers=256MB`
- `effective_cache_size=1GB`
- Connection pooling
- Optimized WAL settings

### **2. Redis Caching:**
```bash
# Enable Redis in application
# Update .env.production:
REDIS_URL="redis://vetted-redis-cache:6379"

# Restart services
docker compose -f docker-compose.production.yml restart
```

### **3. CDN for Static Assets:**
- Use CloudFlare, AWS CloudFront, or Fastly
- Cache static files (images, CSS, JS)
- Reduce server load

---

## 🚨 Troubleshooting

### **Container won't start:**
```bash
# Check logs
docker compose -f docker-compose.production.yml logs vetted-core-engine

# Common issues:
# 1. Database not ready → Wait for health check
# 2. Port conflict → Change port mapping
# 3. Environment variables missing → Check .env.production
```

### **Database connection errors:**
```bash
# Test connection
docker compose -f docker-compose.production.yml exec vetted-db-cluster \
    psql -U vetted_master -d vetted_ledger -c "SELECT 1;"

# Check network
docker network inspect vetted_vetted-secure-mesh
```

### **High memory usage:**
```bash
# Check memory usage
docker stats

# Increase container memory limit in docker-compose.production.yml:
services:
  vetted-core-engine:
    deploy:
      resources:
        limits:
          memory: 2G
```

---

## ✅ Production Deployment Checklist

```
Pre-Deployment:
[ ] Server provisioned (4+ cores, 8+ GB RAM, 100+ GB disk)
[ ] Docker & Docker Compose installed
[ ] Domain configured (api.vetted.com)
[ ] SSL certificate obtained
[ ] Firewall configured (UFW)
[ ] Backup storage configured (S3)

Environment Configuration:
[ ] .env.production created
[ ] All secrets updated (no CHANGE_THIS values)
[ ] JWT_SECRET_SIGNING_KEY generated (32+ chars)
[ ] ENCRYPTION_KEY generated (32+ chars)
[ ] Database password changed
[ ] Smile ID production credentials configured
[ ] Airwallex production credentials configured
[ ] Treasury wallet ID configured
[ ] Webhook URLs registered with external services

Deployment:
[ ] Repository cloned
[ ] Database started and healthy
[ ] Migrations run successfully
[ ] All services started and healthy
[ ] API health check passing
[ ] Reverse proxy configured (Nginx)
[ ] SSL enabled and working
[ ] Firewall rules applied

Post-Deployment:
[ ] Monitoring configured (Datadog/Sentry)
[ ] Logging configured (CloudWatch/Logstash)
[ ] Automated backups scheduled (daily)
[ ] Backup restoration tested
[ ] Disaster recovery plan documented
[ ] Team notified of deployment
[ ] Documentation updated
```

---

**VETTED is now deployed to production!** 🚀✅🔐
