# Database Migration Guide

## 🗄️ VETTED Platform - PostgreSQL Schema Setup

This guide walks you through setting up the complete database infrastructure for VETTED.

---

## 📋 Prerequisites

```bash
# Required Software
- PostgreSQL 14+ installed
- Node.js 18+ installed
- npm or yarn package manager

# Required Environment Variables
DATABASE_URL=postgresql://username:password@localhost:5432/vetted_db
```

---

## 🚀 Initial Setup

### **Step 1: Install Dependencies**

```bash
# Navigate to backend directory
cd vettedcare-backend

# Install Prisma CLI
npm install -D prisma

# Install Prisma Client
npm install @prisma/client
```

### **Step 2: Create PostgreSQL Database**

```bash
# Using psql
psql -U postgres

# Create database
CREATE DATABASE vetted_db;

# Create user (optional)
CREATE USER vetted_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE vetted_db TO vetted_admin;

# Exit psql
\q
```

### **Step 3: Configure Environment**

```bash
# Create .env file
cp .env.example .env

# Edit .env
DATABASE_URL="postgresql://vetted_admin:your_secure_password@localhost:5432/vetted_db?schema=public"
```

### **Step 4: Run Initial Migration**

```bash
# Generate Prisma Client
npx prisma generate

# Create and run migration
npx prisma migrate dev --name init

# This will:
# 1. Create all tables
# 2. Create all indexes
# 3. Create all relationships
# 4. Generate Prisma Client
```

---

## 📊 Database Schema Overview

### **Total Models: 23**

#### **Identity & Verification (4 models)**
```
1. User
2. VettedMEPassport
3. BiometricVerification
4. SkillAssessmentLog
```

#### **Contracts & Escrow (3 models)**
```
5. Contract
6. AirwallexSubAccount
7. Milestone
```

#### **Payments (5 models)**
```
8. MilestoneHandshake
9. PaymentTransaction
10. Invoice
11. MultiCurrencyWallet
12. LedgerTransaction
```

#### **Revenue & GTM (5 models)**
```
13. RevenueEntry
14. Lead
15. OutreachSequence
16. OutreachTouch
17. Deal
```

#### **Infrastructure (2 models)**
```
18. WebhookEvent
19. AuditLog
```

---

## 🔍 Database Inspection

### **View Schema in Prisma Studio**

```bash
npx prisma studio

# Opens browser at http://localhost:5555
# Visual interface for all tables
```

### **Generate ERD Diagram**

```bash
# Install prisma-erd-generator
npm install -D prisma-erd-generator @mermaid-js/mermaid-cli

# Update schema.prisma
generator erd {
  provider = "prisma-erd-generator"
  output   = "../docs/erd.svg"
}

# Generate ERD
npx prisma generate
```

---

## 🌱 Seed Database

### **Create Seed Script**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@vettedpay.com',
      passwordHash: 'hashed_password_here', // Use bcrypt
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      isVerified: true,
    },
  });
  console.log('✓ Admin user created');

  // 2. Create Test Talent User
  const talent = await prisma.user.create({
    data: {
      email: 'chidi.okafor@example.com',
      passwordHash: 'hashed_password_here',
      role: 'TALENT',
      firstName: 'Chidi',
      lastName: 'Okafor',
      phoneNumber: '+234 803 123 4567',
      location: 'Lagos, Nigeria',
      isVerified: true,
    },
  });
  console.log('✓ Talent user created');

  // 3. Create VettedME Passport
  const passport = await prisma.vettedMEPassport.create({
    data: {
      userId: talent.id,
      passportId: 'vettedme-abc123xyz',
      verificationStatus: 'BIOMETRIC_PASSED',
      trustScore: 94,
      smileIdUserId: 'smile_user_123',
      governmentIdType: 'NIN',
      governmentIdNumber: '12345678901',
      governmentIdVerified: true,
      faceMatchScore: 0.97,
      livenessCheckPassed: true,
      primarySkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      yearsOfExperience: 5,
      hourlyRateUSD: 45.00,
      publicProfileUrl: 'https://vettedme.com/passport/vettedme-abc123xyz',
      verifiedAt: new Date(),
    },
  });
  console.log('✓ VettedME Passport created');

  // 4. Create Test Business User
  const business = await prisma.user.create({
    data: {
      email: 'cto@techventures.com',
      passwordHash: 'hashed_password_here',
      role: 'BUSINESS',
      firstName: 'Sarah',
      lastName: 'Chen',
      phoneNumber: '+1 415 555 0123',
      location: 'San Francisco, CA',
      isVerified: true,
    },
  });
  console.log('✓ Business user created');

  // 5. Create Test Contract
  const contract = await prisma.contract.create({
    data: {
      contractNumber: 'CTR-2026-001',
      businessId: business.id,
      talentId: talent.id,
      projectName: 'E-commerce Platform Rebuild',
      projectDescription: 'Complete rebuild of e-commerce platform using modern tech stack',
      totalContractValueUSD: 15000.00,
      status: 'CAPITAL_ESCROWED',
      startDate: new Date('2026-07-01'),
      expectedEndDate: new Date('2026-08-31'),
    },
  });
  console.log('✓ Contract created');

  // 6. Create Airwallex Sub-Account
  const airwallexAccount = await prisma.airwallexSubAccount.create({
    data: {
      contractId: contract.id,
      airwallexAccountId: 'aw_acc_test123',
      airwallexVirtualAccountId: 'aw_va_test456',
      fundingAccountRoutingNumber: '121000248',
      fundingAccountAccountNumber: '1234567890',
      fundingAccountSwiftCode: 'AIRWUS33',
      bankName: 'Airwallex US',
      bankCountry: 'US',
      currentBalanceUSD: 15000.00,
      availableBalanceUSD: 15000.00,
      activatedAt: new Date(),
    },
  });
  console.log('✓ Airwallex sub-account created');

  // 7. Create Milestones
  const milestone1 = await prisma.milestone.create({
    data: {
      contractId: contract.id,
      milestoneNumber: 1,
      title: 'Project Setup & Architecture',
      description: 'Initial setup, architecture design, and tech stack selection',
      amountUSD: 3000.00,
      dueDate: new Date('2026-07-15'),
      status: 'PAID',
      complianceTaxFormSigned: true,
      paidAt: new Date('2026-07-16'),
    },
  });

  const milestone2 = await prisma.milestone.create({
    data: {
      contractId: contract.id,
      milestoneNumber: 2,
      title: 'Database Schema & API Integration',
      description: 'Complete database schema design and REST API endpoints',
      amountUSD: 3000.00,
      dueDate: new Date('2026-07-25'),
      status: 'PAID',
      complianceTaxFormSigned: true,
      submittedAt: new Date('2026-07-24'),
      approvedAt: new Date('2026-07-25'),
      paidAt: new Date('2026-07-25'),
    },
  });

  const milestone3 = await prisma.milestone.create({
    data: {
      contractId: contract.id,
      milestoneNumber: 3,
      title: 'Frontend Development',
      description: 'Build frontend components and user interface',
      amountUSD: 4500.00,
      dueDate: new Date('2026-08-10'),
      status: 'IN_PROGRESS',
      complianceTaxFormSigned: true,
    },
  });

  console.log('✓ Milestones created');

  // 8. Create Platform Treasury Wallet
  const treasuryWallet = await prisma.multiCurrencyWallet.create({
    data: {
      walletType: 'PLATFORM_TREASURY',
      ownerId: 'platform',
      balances: {
        USD: 465.00, // From milestone 1 & 2 revenue
        NGN: 0,
      },
    },
  });
  console.log('✓ Platform treasury wallet created');

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### **Run Seed**

```bash
# Add to package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}

# Install tsx
npm install -D tsx

# Run seed
npx prisma db seed
```

---

## 🔄 Migration Workflow

### **Development Migrations**

```bash
# Create new migration (development)
npx prisma migrate dev --name add_new_feature

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate
```

### **Production Migrations**

```bash
# Deploy migrations to production
npx prisma migrate deploy

# This applies all pending migrations
# Does NOT reset database
# Safe for production use
```

---

## 🔍 Common Queries

### **Check Migration Status**

```bash
npx prisma migrate status
```

### **View Database Schema**

```bash
npx prisma db pull

# Updates schema.prisma from existing database
```

### **Format Schema File**

```bash
npx prisma format
```

---

## 🛡️ Security Best Practices

### **1. Environment Variables**

```bash
# Never commit .env files
# Use strong passwords
# Rotate credentials regularly

# Production example
DATABASE_URL="postgresql://vetted_prod:STRONG_PASSWORD_HERE@db.example.com:5432/vetted_prod?ssl=true&sslmode=require"
```

### **2. Connection Pooling**

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### **3. Query Optimization**

```typescript
// Use indexes for common queries
await prisma.user.findMany({
  where: { isActive: true }, // Uses index
  include: {
    vettedMEPassport: true,
  },
});

// Use pagination
await prisma.contract.findMany({
  skip: 20,
  take: 10,
  orderBy: { createdAt: 'desc' },
});
```

---

## 📊 Performance Monitoring

### **Enable Query Logging**

```typescript
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});
```

### **Database Indexes**

```prisma
// Already included in schema:
@@index([email])
@@index([contractNumber])
@@index([status])
@@index([passportId])
// etc...
```

---

## 🚨 Troubleshooting

### **Issue: Migration Failed**

```bash
# Check migration status
npx prisma migrate status

# Resolve migration
npx prisma migrate resolve --applied migration_name

# Or reset (development only)
npx prisma migrate reset
```

### **Issue: Prisma Client Out of Sync**

```bash
# Regenerate client
npx prisma generate

# Restart TypeScript server in IDE
```

### **Issue: Connection Refused**

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check connection string
echo $DATABASE_URL

# Test connection
psql -d vetted_db
```

---

## ✅ Schema Validation Checklist

```
✓ All 23 models defined
✓ All relationships configured
✓ All indexes created
✓ All enums defined
✓ Cascading deletes configured
✓ Timestamps on all models
✓ Unique constraints added
✓ Default values set
```

---

## 🎯 Next Steps

After completing database setup:

1. ✅ Run migrations
2. ✅ Seed test data
3. ✅ Test queries in Prisma Studio
4. ✅ Build API routes
5. ✅ Connect frontend to backend
6. ✅ Deploy to production

---

**Database infrastructure is ready for VETTED platform! 🚀**
