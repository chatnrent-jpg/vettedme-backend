# Railway Deployment - VettedPay Backend

**Goal**: Get your FastAPI backend live with PostgreSQL in 15 minutes

---

## 🚀 Quick Deploy to Railway

### Prerequisites
- [x] GitHub account
- [x] Railway account (sign up at railway.app)
- [x] Your code already on GitHub ✅

---

## Option 1: Deploy from GitHub (Easiest - 5 Minutes)

### Step 1: Connect Railway to GitHub
1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select: `chatnrent-jpg/offercare-backend`
4. Railway will auto-detect FastAPI

### Step 2: Add PostgreSQL
1. Click "New" → "Database" → "PostgreSQL"
2. Railway automatically creates `DATABASE_URL`
3. No configuration needed!

### Step 3: Run Migrations
```bash
# Railway will run this automatically
railway run alembic upgrade head
```

### Step 4: Set Environment Variables
```bash
# In Railway dashboard → Variables
VETTEDPAY_ACTIVE_PROVIDER=airwallex
VETTEDPAY_AIRWALLEX_API_URL=https://api.airwallex.com
VETTEDPAY_AIRWALLEX_API_TOKEN=mock_token_for_now

# CORS
CORS_ORIGINS=https://public-five-peach.vercel.app,https://vettedpay.com
```

### Step 5: Deploy
- Railway deploys automatically on push
- Your API will be live at: `https://your-app.up.railway.app`

---

## Option 2: Deploy via CLI (10 Minutes)

### Install Railway CLI
```powershell
npm install -g @railway/cli
```

### Login
```powershell
railway login
```

### Initialize Project
```powershell
# From project root
railway init

# Select "Create new project"
# Name: vettedpay-backend
```

### Add PostgreSQL
```powershell
railway add

# Select PostgreSQL
# Railway auto-configures DATABASE_URL
```

### Link GitHub (Optional)
```powershell
railway link
```

### Deploy
```powershell
railway up
```

### Run Migrations
```powershell
railway run alembic upgrade head
```

### Get Your URL
```powershell
railway status
# Copy your deployment URL
```

---

## 🔧 After Deployment

### 1. Test Your API
```powershell
# Health check
curl https://your-app.up.railway.app/health

# Waitlist endpoint
curl -X POST https://your-app.up.railway.app/api/v1/vettedpay/waitlist -H "Content-Type: application/json" -d '{"email":"test@company.com"}'

# Rail health
curl https://your-app.up.railway.app/api/v1/vettedpay/rails/health
```

### 2. Update Frontend
Update your `index.html` if you want form to save to database instead of email:

```javascript
// Change line 86 (or we'll do this with Formspree for now)
const API_URL = 'https://your-app.up.railway.app';
```

### 3. Verify Database
```powershell
# Connect to Railway PostgreSQL
railway connect postgres

# Check tables
\dt vettedpay*

# You should see:
# - vettedpay_transactions
# - vettedpay_rail_health
# - vettedpay_zk_verifications
# - vettedpay_waitlist
```

---

## 📊 What You Get

### Railway Free Tier
- ✅ $5/month credit (enough for testing)
- ✅ PostgreSQL database included
- ✅ Automatic HTTPS
- ✅ Auto-deploy from Git
- ✅ 500GB bandwidth/month
- ✅ Always-on containers

### Paid Tier ($20/month)
- Everything in free tier
- More resources
- Better performance
- Priority support

---

## 🎯 Quick Commands Reference

```powershell
# Start local dev
railway run uvicorn app.main:app --reload

# Check logs
railway logs

# Check status
railway status

# Open in browser
railway open

# Run migrations
railway run alembic upgrade head

# Connect to database
railway connect postgres

# Set environment variable
railway variables set KEY=value

# Deploy
railway up

# Redeploy
railway up --detach
```

---

## 🔐 Environment Variables Needed

### Required
```
DATABASE_URL=<auto-set-by-railway>
```

### Optional (For Full VettedPay)
```
VETTEDPAY_ACTIVE_PROVIDER=airwallex
VETTEDPAY_AIRWALLEX_API_URL=https://api.airwallex.com
VETTEDPAY_AIRWALLEX_API_TOKEN=your_token_here
VETTEDPAY_HMAC_SECRET=your_secret_here
SENDGRID_API_KEY=your_sendgrid_key (for emails)
SENTRY_DSN=your_sentry_dsn (for errors)
```

---

## 🚀 Expected Timeline

- **Minute 1-2**: Railway login + project creation
- **Minute 3-5**: PostgreSQL provisioning
- **Minute 6-8**: Code deployment
- **Minute 9-10**: Migrations running
- **Minute 11-12**: Testing endpoints
- **Minute 13-15**: Updating frontend URL

**Total**: 15 minutes to production-ready API!

---

## 🐛 Troubleshooting

### Issue: "Build failed"
**Solution**: Check `Procfile` exists with:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Issue: "Database connection failed"
**Solution**: Verify `DATABASE_URL` in environment variables

### Issue: "Migrations not running"
**Solution**: Run manually:
```powershell
railway run alembic upgrade head
```

### Issue: "CORS error"
**Solution**: Add frontend URL to CORS_ORIGINS

---

## ✅ Success Checklist

- [ ] Railway project created
- [ ] PostgreSQL database running
- [ ] Code deployed successfully
- [ ] Migrations completed
- [ ] All 4 VettedPay tables created
- [ ] API responding to health check
- [ ] Waitlist endpoint working
- [ ] Rail health endpoint working
- [ ] Frontend connected (optional for now)
- [ ] CORS configured

---

## 🎉 Next Steps After Railway

Once your API is live:

1. ✅ Update Vercel frontend with API URL
2. ✅ Test full end-to-end flow
3. ✅ Add Sentry error tracking
4. ✅ Enable SendGrid email notifications
5. ✅ Set up uptime monitoring
6. ✅ Configure custom domain (api.vettedpay.com)

---

**Ready to deploy in 15 minutes once you give me the go-ahead!**

