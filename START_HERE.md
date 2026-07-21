# 🚀 Quick Start Guide - VETTED Platform

## ✅ Issues Fixed

1. **Prisma v7 Configuration**: Created `prisma/prisma.config.ts` and updated schema
2. **Package Dependencies**: Updated to Prisma v7.9.0 in `package.json`
3. **Centralized Prisma Client**: Created `src/lib/prisma.ts` for consistent database access

---

## 🎯 Run These Commands Now (In Order)

### Step 1: Install Dependencies
```powershell
npm install
```
**What this does**: Installs `tsx`, Prisma v7, and all other dependencies.

---

### Step 2: Generate Prisma Client
```powershell
npx prisma generate
```
**What this does**: Generates the type-safe Prisma Client based on your schema.

---

### Step 3: Push Schema to Database
```powershell
npx prisma db push
```
**What this does**: Creates all database tables. No more P1012 error!

---

### Step 4: Seed the Database (Optional but Recommended)
```powershell
npm run db:seed
```
**What this does**: Populates database with 5 high-fidelity contractor profiles for demos.

---

### Step 5: Start Backend Server
```powershell
npm run dev
```
**What this does**: Starts the backend on `http://localhost:8080`

**Expected output**:
```
🚀 VETTED Backend Server running on http://localhost:8080
📊 Environment: development
🔐 Database: Connected
```

---

## 🌐 Step 6: Start Frontend (In a NEW Terminal)

Open a **second terminal** and run:

```powershell
cd C:\VETTEDCARE.AI\vettedcare-backend\frontend
npm install
npm run dev
```

Frontend will start on `http://localhost:3000`

---

## 🎉 You Should Now See

- **Backend**: `http://localhost:8080` ✅
- **Frontend**: `http://localhost:3000` ✅
- **Talent Portal**: `http://localhost:3000/talent` ✅
- **Business Portal**: `http://localhost:3000/business` ✅
- **B2B Landing Page**: `http://localhost:3000` ✅

---

## ⚡ Quick Health Check

Open your browser and visit:
- `http://localhost:8080/health` - Should return `{ "status": "ok" }`
- `http://localhost:3000` - Should show the B2B landing page

---

## 🔥 What Changed Under the Hood

### Prisma v7 Migration:

**Before (Prisma v5)**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  ❌ No longer supported
}
```

**After (Prisma v7)**:

1. **prisma/schema.prisma** - Removed `url` property
2. **prisma/prisma.config.ts** - NEW file with database config
3. **src/lib/prisma.ts** - Centralized Prisma Client instance

---

## 🐛 Troubleshooting

### If `tsx` is still not recognized:
1. Close PowerShell completely
2. Reopen PowerShell
3. Run `npm install` again

### If port 8080 is already in use:
```powershell
netstat -ano | findstr :8080
taskkill /PID <PID> /F
npm run dev
```

### If database connection fails:
Check your `.env` file:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/vetted_db"
```

---

## 📚 Full Documentation

- **Prisma v7 Migration**: See `PRISMA_V7_MIGRATION_FIX.md`
- **Production Deployment**: See `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Developer Outreach**: See `docs/supply/developer_outreach.md`
- **Lead Generation**: See `docs/demand/lead_generation_matrix.md`

---

## 🎯 Next Steps After System is Running

1. **Test the B2B Landing Page**: `http://localhost:3000`
2. **Submit a Test Lead**: Fill out the enterprise form
3. **Check Database**: Run `npx prisma studio` to see the data
4. **Test VettedME Passport**: Visit `http://localhost:3000/talent`
5. **Test Business Dashboard**: Visit `http://localhost:3000/business`

---

**Any issues? Check the troubleshooting section above or review `PRISMA_V7_MIGRATION_FIX.md`**
