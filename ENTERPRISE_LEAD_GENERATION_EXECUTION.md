# 🎯 VETTED Enterprise Lead Generation - Execution Guide

## Executive Overview

This guide walks you through sourcing 500 high-value enterprise leads (CTOs, VPs, Directors) from Apollo.io, validating them with our scoring engine, and importing them into your cold outreach platform.

**Timeline**: 2 hours setup → 4 weeks execution  
**Target**: 500 qualified leads → 10 demos → 3 contracts  
**Expected Revenue**: $75,000 (@ $25K per contract)

---

## 📋 Table of Contents

1. [Apollo.io Lead Generation](#apolloio-lead-generation)
2. [Run Lead Validator](#run-lead-validator)
3. [Import to Outreach Platform](#import-to-outreach-platform)
4. [Launch Cold Outreach Campaign](#launch-cold-outreach-campaign)
5. [Track Sales Pipeline](#track-sales-pipeline)

---

## 1️⃣ Apollo.io Lead Generation (60 minutes)

### Step 1.1: Create Apollo.io Account

1. Go to https://apollo.io
2. Sign up for **Professional Plan** ($49/month for 2,000 exports)
3. Verify email and complete profile

**Alternative**: Use free tier (50 exports/month) + LinkedIn Sales Navigator

---

### Step 1.2: Run Search #1 - US CTOs at Series B+ SaaS Companies (150 leads)

**Navigate to**: Apollo.io → People Search

**Filters**:
```
Job Titles:
☑ CTO
☑ Chief Technology Officer
☑ VP of Engineering
☑ Head of Engineering

Company Headcount:
☑ 51-200
☑ 201-500

Location:
☑ United States

Industry:
☑ Computer Software
☑ SaaS
☑ Internet
☑ Cloud Computing

Funding:
☑ Series B
☑ Series C
☑ Series D

Keywords (optional):
"remote engineering" OR "distributed team" OR "offshore" OR "global talent"
```

**Expected Results**: 800-1,200 profiles

**Export**:
1. Click **"Export"** (top-right)
2. Select **"Current view"** (first 150 results)
3. Choose columns:
   - ☑ First Name
   - ☑ Last Name
   - ☑ Email
   - ☑ Job Title
   - ☑ Company Name
   - ☑ Company Size
   - ☑ Industry
   - ☑ Location
   - ☑ LinkedIn URL
   - ☑ Company Website
   - ☑ Funding Stage
   - ☑ Last Funding Amount
   - ☑ Last Funding Date
4. Click **"Export to CSV"**
5. Save as: `apollo_search1_us_ctos_saas.csv`

---

### Step 1.3: Run Search #2 - UK/EU VPs at FinTech Scale-Ups (100 leads)

**Filters**:
```
Job Titles:
☑ VP of Engineering
☑ VP Engineering
☑ Head of Engineering
☑ Engineering Director

Company Headcount:
☑ 51-300

Location:
☑ United Kingdom
☑ Germany
☑ France
☑ Netherlands
☑ Ireland

Industry:
☑ Financial Services
☑ FinTech
☑ Payments
☑ Banking

Funding:
☑ Series A
☑ Series B
☑ Series C

Keywords:
"engineering team" OR "technical hiring" OR "scaling engineering"
```

**Expected Results**: 400-600 profiles

**Export**: First 100 results → Save as `apollo_search2_eu_vps_fintech.csv`

---

### Step 1.4: Run Search #3 - US Directors at HealthTech Companies (100 leads)

**Filters**:
```
Job Titles:
☑ Director of Engineering
☑ Engineering Director
☑ Senior Engineering Manager

Company Headcount:
☑ 75-500

Location:
☑ United States

Industry:
☑ Healthcare
☑ HealthTech
☑ Digital Health
☑ Telemedicine

Funding:
☑ Series B
☑ Series C

Keywords:
"healthcare technology" OR "digital health" OR "remote engineering"
```

**Expected Results**: 300-500 profiles

**Export**: First 100 results → Save as `apollo_search3_us_directors_healthtech.csv`

---

### Step 1.5: Run Search #4 - Technical Co-Founders at Web3 Startups (150 leads)

**Filters**:
```
Job Titles:
☑ Co-Founder
☑ Founder
☑ Technical Co-Founder
☑ CTO & Founder

Company Headcount:
☑ 10-200

Location:
☑ United States
☑ United Kingdom
☑ Germany
☑ Switzerland

Industry:
☑ Blockchain
☑ Cryptocurrency
☑ Web3
☑ DeFi

Funding:
☑ Seed
☑ Series A
☑ Series B

Keywords:
"blockchain" OR "web3" OR "crypto" OR "smart contracts"
```

**Expected Results**: 500-800 profiles

**Export**: First 150 results → Save as `apollo_search4_cofounders_web3.csv`

---

### Step 1.6: Merge CSV Files

**Location**: Save all 4 CSV files to:
```
C:\VETTEDCARE.AI\vettedcare-backend\data\leads\apollo\
```

**Merge in PowerShell**:
```powershell
cd C:\VETTEDCARE.AI\vettedcare-backend\data\leads\apollo\

# Merge all CSVs (keep headers from first file only)
Get-Content apollo_search1_us_ctos_saas.csv | Set-Content apollo_master.csv
Get-Content apollo_search2_eu_vps_fintech.csv | Select-Object -Skip 1 | Add-Content apollo_master.csv
Get-Content apollo_search3_us_directors_healthtech.csv | Select-Object -Skip 1 | Add-Content apollo_master.csv
Get-Content apollo_search4_cofounders_web3.csv | Select-Object -Skip 1 | Add-Content apollo_master.csv
```

**Result**: `apollo_master.csv` with 500 raw leads

---

## 2️⃣ Run Lead Validator (10 minutes)

### Step 2.1: Prepare Environment

**Install Dependencies** (if not already done):
```bash
cd C:\VETTEDCARE.AI\vettedcare-backend
npm install
```

This installs:
- `csv-parse` (CSV parsing)
- `csv-stringify` (CSV export)
- `axios` (API calls for Clearbit/Hunter.io - optional)

---

### Step 2.2: Set API Keys (Optional)

**For Email Verification** (Hunter.io):
```powershell
$env:HUNTER_API_KEY="your_hunter_api_key"
```

**For Company Enrichment** (Clearbit):
```powershell
$env:CLEARBIT_API_KEY="your_clearbit_api_key"
```

⚠️ **Note**: These are optional. The validator works without them, but enrichment adds value.

---

### Step 2.3: Run Validation Script

```bash
npm run validate:leads -- --input=data/leads/apollo/apollo_master.csv --output=data/leads/validated_leads.csv
```

**What This Does**:
1. ✅ **Email Validation**: Checks syntax, filters generic domains (gmail, yahoo)
2. ✅ **Job Title Validation**: Matches CTO, VP Eng, Director, Co-Founder
3. ✅ **Company Size Validation**: Filters 50-500 employees
4. ✅ **Location Validation**: US, UK, Eurozone only
5. ✅ **Duplicate Detection**: Removes duplicate emails
6. ✅ **Lead Scoring** (0-100):
   - **Firmographic (0-50)**: Company size, funding stage, industry, geography
   - **Technographic (0-30)**: Tech stack (if available), eng team size
   - **Behavioral (0-20)**: Recent funding, active hiring, LinkedIn activity
7. ✅ **Tier Assignment**:
   - **Tier 1 (85-100)**: Highest priority (20%)
   - **Tier 2 (70-84)**: High priority (40%)
   - **Tier 3 (55-69)**: Medium priority (40%)
   - **Tier 4 (<55)**: Excluded

---

### Step 2.4: Review Validation Output

**Console Output**:
```
🔍 VETTED Lead Validator
============================================================
Input:  data/leads/apollo/apollo_master.csv
Output: data/leads/validated_leads.csv

📄 Parsing CSV...
   Found 500 leads

✅ Validating leads...
   Processed 50/500 leads...
   Processed 100/500 leads...
   ...
   Processed 500/500 leads ✓

🔍 Detecting duplicates...
   Found 23 duplicate emails

💾 Exporting validated leads...
   Exported to data/leads/validated_leads.csv ✓

📊 Validation Statistics:
============================================================
Total Processed:       500
Valid Leads:           412 (82%)
Invalid Leads:         88 (18%)
Duplicates:            23
Generic Domains:       31
Invalid Emails:        12
Wrong Job Title:       18
Wrong Company Size:    15
Wrong Location:        12
Average Lead Score:    74/100
============================================================

📊 Lead Score Distribution:
============================================================
Tier 1 (85-100):       98 (20%)
Tier 2 (70-84):        186 (37%)
Tier 3 (55-69):        128 (26%)
Tier 4 (<55):          88 (18%)
============================================================

✅ Validation complete!
```

**Output File**: `data/leads/validated_leads.csv`

**Columns**:
- All original columns from Apollo
- `leadScore` (0-100)
- `leadTier` ("Tier 1", "Tier 2", "Tier 3", "Tier 4")
- `isValid` (true/false)
- `validationErrors` (array of issues)

---

### Step 2.5: Filter to Top Tiers Only

**In Excel/Google Sheets**:
1. Open `validated_leads.csv`
2. Filter: `isValid = true` AND `leadTier IN ("Tier 1", "Tier 2")`
3. Sort: `leadScore` (descending)
4. Take top 500 leads
5. Save as: `validated_leads_top500.csv`

**Expected Result**:
- 500 raw leads
- 412 valid (82%)
- **284 Tier 1+2 (57%)**
- Filter to top 500 → Use Tier 1+2 + some Tier 3

---

## 3️⃣ Import to Outreach Platform (20 minutes)

### Step 3.1: Choose Platform

**Recommended**: Instantly.ai ($37/month, unlimited emails)

**Alternatives**:
- Lemlist ($59/month, personalized videos)
- Reply.io ($70/month, multi-channel)
- Mailshake ($58/month, simple sequences)

---

### Step 3.2: Create Instantly.ai Account

1. Go to https://app.instantly.ai
2. Sign up (use corporate email)
3. Connect email account (use custom domain: vettedforce.com)
4. Enable **email warm-up** (7-14 days before sending)

---

### Step 3.3: Create Campaign

1. Click **"Campaigns"** > **"New Campaign"**
2. Name: "VETTED Enterprise - US CTOs Series B+ SaaS"
3. Click **"Create"**

---

### Step 3.4: Import CSV

1. In campaign, click **"Add Leads"**
2. Click **"Upload CSV"**
3. Select `validated_leads_top500.csv`
4. Map columns:
   - **First Name** → `firstName`
   - **Last Name** → `lastName`
   - **Email** → `email`
   - **Company** → `companyName`
   - **Job Title** → `jobTitle`
   - **Custom Variable 1** → `companySize`
   - **Custom Variable 2** → `industry`
   - **Custom Variable 3** → `fundingStage`
   - **Custom Variable 4** → `leadScore`
   - **Custom Variable 5** → `leadTier`
   - **Custom Variable 6** → `location`
5. Click **"Import"**
6. Verify: "X leads imported successfully"

---

### Step 3.5: Segment by Tier

**Create 2 Separate Campaigns**:

**Campaign 1: Tier 1 (85-100)** - 100 leads
- Most personalized
- Manual research on each lead
- Higher effort, higher conversion

**Campaign 2: Tier 2 (70-84)** - 200 leads
- Standard personalization
- A/B test messaging
- Volume play

**Campaign 3: Tier 3 (55-69)** - 200 leads (optional)
- Automated sequence
- Lower priority
- Nurture campaign

---

## 4️⃣ Launch Cold Outreach Campaign (30 minutes)

### Step 4.1: Configure 3-Step Email Sequence

Use templates from `docs/outbound/cold_outreach_sequence.md`

---

#### 📧 EMAIL 1 (Day 0): The Infrastructure Angle

**Subject Line Options** (A/B test):
```
A: Quick question about {{company}}'s offshore engineering strategy
B: {{firstName}}, compliance friction with {{location}} contractors?
C: Sub-100ms latency for {{company}}'s remote engineering pipeline?
```

**Email Body**:
```
{{firstName}},

I noticed {{company}} recently {{trigger_event}} (congrats on the Series {{funding_stage[0]}}!).

Most teams scaling into Africa/LatAm hit the same two walls: identity trust and settlement friction.

We built an automated protocol that bridges these corridors with US enterprises. We run real-time biometric identity clearance (Smile ID/Persona) and programmatic milestone escrow (Airwallex), reducing your compliance/settlement friction by 85% and maintaining sub-100ms platform latency.

Instead of manually vetting contractors and juggling international wire transfers, you get:

• Cryptographically verified trust passports (government ID + live liveness check)
• Zero-click milestone releases (biometric handshake triggers payout)
• Automated IRS W-8BEN generation (full tax compliance)

Do you have 5 minutes this Thursday for a quick sandbox walkthrough?

Best,
{{sender_name}}
{{sender_title}} | VETTED
{{calendar_link}}

P.S. We already work with {{social_proof_company}} and {{social_proof_company_2}} for their {{location}} engineering teams.
```

---

#### 📧 EMAIL 2 (Day 3): The $25,000 Demo Verification

**Subject Line**:
```
Re: {{company}} offshore engineering
```

**Email Body**:
```
{{firstName}},

Quick follow-up — instead of slides, we built a live $25,000 escrow demonstration.

You can watch the entire automated clearing loop:
• Client deposits → Airwallex multi-currency escrow locks
• Developer completes milestone → Client approves work
• Developer completes biometric verification → Payment auto-releases (<24hr settlement)

Zero manual intervention. Zero $45 SWIFT fees. Zero payment chasing.

This is what we built for {{social_proof_company}} when they scaled to {{social_proof_count}} contractors across Lagos, Nairobi, and São Paulo.

Want a 45-second screen recording, or prefer to see it live on a 5-minute call?

Best,
{{sender_name}}
{{calendar_link}}
```

---

#### 📧 EMAIL 3 (Day 7): The Multi-Region Risk Mitigation

**Subject Line**:
```
Final check: {{company}}'s remote engineering footprint
```

**Email Body**:
```
{{firstName}},

Last check on this.

If you're hiring across Africa/LatAM, the three biggest engineering risks are:

1. Identity fraud (resume inflation, proxy interviews)
2. Payment gridlock (wire delays, currency conversion fees)
3. Compliance gaps (IRS W-8BEN, data sovereignty, local tax law)

We built infrastructure that algorithmically eliminates all three:

• Smile ID/Persona biometric binding (un-fakeable contractor identity)
• Airwallex programmatic escrow (instant settlement, local clearing networks)
• Automated W-8BEN + field-level encryption (SOC 2, GDPR, NDPR, LGPD compliant)

We ran a 1,000 concurrent user load test simulating milestone payouts under AWS Aurora Global Database replication. Response times stayed sub-100ms across all three corridors.

Is your remote engineering footprint a priority for Q4, or should I check back in 6 months?

Best,
{{sender_name}}
{{calendar_link}}
```

---

### Step 4.2: Configure Sequence Settings

**In Instantly.ai**:

**Timing**:
- Email 1: Send immediately
- Email 2: +3 days (if no reply)
- Email 3: +7 days (if no reply)

**Sending Schedule**:
- Monday-Friday only
- 9 AM - 5 PM (recipient's timezone)
- Start: 10 emails/day (Week 1)
- Ramp up: 25 emails/day (Week 2)
- Max: 50 emails/day (Week 3+)

**Stop Conditions**:
- Stop if lead replies
- Stop if lead books demo (via calendar link)
- Stop after Email 3
- Unsubscribe link in footer

**Tracking**:
- ✅ Open tracking
- ✅ Click tracking
- ✅ Reply tracking
- ✅ Calendar booking tracking

---

### Step 4.3: Set Up Personalization

**Required Variables**:
- `{{firstName}}` - First name
- `{{company}}` - Company name
- `{{trigger_event}}` - Recent news (funding, launch, etc.)
- `{{funding_stage}}` - Series A/B/C
- `{{location}}` - HQ location
- `{{sender_name}}` - Your name
- `{{sender_title}}` - Your title
- `{{calendar_link}}` - Calendly link
- `{{social_proof_company}}` - Client logo/name
- `{{social_proof_count}}` - "15", "30", etc.

**Research `{{trigger_event}}`** (Tier 1 only):
- Check Crunchbase for recent funding
- Check company blog for product launches
- Check LinkedIn for engineering hiring posts
- Personalize: "recently raised $25M" or "just launched in EMEA"

---

### Step 4.4: Launch Campaign

**Week 1: Tier 1 Leads** (100 leads, 10/day)
```
Segment: leadTier = "Tier 1" (85-100 score)
Volume: 10 emails/day
Duration: 10 days
Focus: Manual personalization (trigger_event research)
```

**Week 2-3: Tier 2 Leads** (200 leads, 25/day)
```
Segment: leadTier = "Tier 2" (70-84 score)
Volume: 25 emails/day
Duration: 8 days
Focus: Standard personalization (A/B test subject lines)
```

**Week 4-5: Tier 3 Leads** (200 leads, 50/day - optional)
```
Segment: leadTier = "Tier 3" (55-69 score)
Volume: 50 emails/day
Duration: 4 days
Focus: Automated sequence (lower priority)
```

---

## 5️⃣ Track Sales Pipeline (Ongoing)

### Step 5.1: Monitor Key Metrics

**In Instantly.ai Dashboard**:

| Metric | Target | Industry Benchmark |
|--------|--------|---------------------|
| **Deliverability** | 98%+ | 95%+ |
| **Open Rate** | 45%+ | 30-40% |
| **Reply Rate** | 8%+ | 3-5% |
| **Demo Booking Rate** | 2%+ | 1-2% |
| **Demo Show Rate** | 80%+ | 60-70% |

---

### Step 5.2: Update Sales Pipeline in Database

As leads engage, update their status using the pipeline service:

```typescript
import LeadPipeline from './services/lead-pipeline.service';

// 1. Lead replies to email
await LeadPipeline.markEmailReplied(leadId, replyText);

// 2. Demo call scheduled
await LeadPipeline.markDemoBooked(
  leadId,
  new Date('2026-07-28T14:00:00Z'),
  ['john@acme.com', 'sarah@acme.com']
);

// 3. Demo call completed
await LeadPipeline.markDemoCompleted(leadId, 'Great call! Very interested in Lagos pipeline.');

// 4. Contract sent
await LeadPipeline.markContractPending(leadId, 25000);

// 5. Contract signed! 🎉
await LeadPipeline.markEnterpriseActive(leadId, 25000);
```

---

### Step 5.3: Weekly Review

**Every Monday** (30 minutes):
- [ ] Review Instantly.ai metrics (opens, clicks, replies)
- [ ] Respond to all email replies within 2 hours
- [ ] Book demos (use Calendly link)
- [ ] A/B test subject lines (swap worst performer)
- [ ] Update pipeline states in database

---

## 📊 Expected Results (8 Weeks)

### Funnel Breakdown (500 Leads)

| Stage | Count | % | Notes |
|-------|-------|---|-------|
| **Emails Sent** | 500 | 100% | All validated, Tier 1-3 |
| **Emails Delivered** | 490 | 98% | <2% bounce rate |
| **Emails Opened** | 225 | 45% | Good subject lines |
| **Email Replies** | 40 | 8% | Interested in value prop |
| **Demos Booked** | 10 | 2% | Calendar link clicked |
| **Demos Completed** | 8 | 80% of booked | 2 no-shows |
| **Contracts Sent** | 4 | 50% of demos | Hot leads |
| **Contracts Signed** | **3** | **30% of demos** | ✅ **Revenue!** |

**Overall Conversion**: 0.6% (cold email → contract signed)

---

### Revenue Projection

| Metric | Value |
|--------|-------|
| **Contracts Signed** | 3 |
| **Avg Contract Value** | $25,000 |
| **Total Revenue** | **$75,000** |
| **Total Cost** | $2,500 |
| **ROI** | **30x** |

**Cost Breakdown**:
- Apollo.io: $49/month × 2 = $98
- Instantly.ai: $37/month × 2 = $74
- Domain/email: $20/month × 2 = $40
- Hunter.io (optional): $49/month × 2 = $98
- Time investment: ~20 hours @ $100/hr = $2,000
- **Total**: ~$2,500

---

### Timeline

| Week | Activity | Target |
|------|----------|--------|
| **Week 1** | Apollo.io search & export | 500 raw leads |
| **Week 2** | Validate & clean | 412 valid, 284 Tier 1+2 |
| **Week 3** | Import to Instantly.ai, warm-up | Campaign ready |
| **Week 4-5** | Tier 1 outreach (100 leads) | 5-8 replies, 2-3 demos |
| **Week 6-7** | Tier 2 outreach (200 leads) | 12-16 replies, 5-7 demos |
| **Week 8** | Follow-ups & close | **3 contracts signed** |

---

## ✅ Execution Checklist

### Pre-Launch (Week 1-2)
- [ ] Apollo.io account created ($49/month)
- [ ] 4 searches executed (CTOs, VPs, Directors, Co-Founders)
- [ ] 500 raw leads exported to CSV
- [ ] CSVs merged into apollo_master.csv
- [ ] Lead validator executed (`npm run validate:leads`)
- [ ] 412 valid leads, 284 Tier 1+2
- [ ] Filtered to top 500 (validated_leads_top500.csv)

### Campaign Setup (Week 3)
- [ ] Instantly.ai account created ($37/month)
- [ ] Custom domain connected (vettedforce.com)
- [ ] Email warm-up enabled (7-14 days)
- [ ] CSV imported (500 leads)
- [ ] 3-step sequence configured
- [ ] Personalization variables mapped
- [ ] Test emails sent (deliverability verified)

### Launch (Week 4-7)
- [ ] Week 4: Tier 1 campaign (100 leads, 10/day)
- [ ] Week 5-6: Tier 2 campaign (200 leads, 25/day)
- [ ] Week 7: Tier 3 campaign (200 leads, 50/day - optional)
- [ ] Daily: Respond to replies within 2 hours
- [ ] Weekly: Update pipeline states in database
- [ ] Book demos via Calendly

### Close (Week 8)
- [ ] Complete demos (8 total)
- [ ] Send contracts (4 sent)
- [ ] Sign contracts (**3 signed**)
- [ ] **$75,000 revenue generated!** 🎉

---

## 🚨 Common Issues & Solutions

### Issue 1: Low Email Discovery Rate (Apollo.io)

**Problem**: Apollo.io emails have low confidence scores

**Solutions**:
1. Filter Apollo.io to **"Verified emails only"**
2. Use Hunter.io for backup email enrichment
3. LinkedIn Sales Navigator + Apollo.io Chrome extension
4. Prioritize Tier 1 leads (worth the manual effort)

---

### Issue 2: High Bounce Rate

**Problem**: Emails bouncing (>5%)

**Solutions**:
1. Run emails through ZeroBounce or NeverBounce before sending
2. Remove generic domains (gmail, yahoo) - validator already does this
3. Check company websites are still active (no defunct startups)
4. Use only **"Verified"** emails from Apollo.io

---

### Issue 3: Low Reply Rate

**Problem**: Open rate is good (45%), but no replies (<3%)

**Solutions**:
1. **Shorten email**: <150 words (current templates are ~120 words ✅)
2. **Clearer CTA**: Make it a yes/no question
3. **Add social proof**: Mention specific client logos
4. **Research trigger events**: Personalize Email 1 for Tier 1 leads
5. **A/B test subject lines**: Swap worst performer weekly

---

### Issue 4: Low Demo Show Rate

**Problem**: Demos booked but high no-show rate (>30%)

**Solutions**:
1. **Calendar reminders**: Send 24hr and 1hr before demo
2. **Confirmation email**: After booking, send agenda + prep materials
3. **Reduce friction**: Offer multiple time slots (morning/afternoon)
4. **PagerDuty alerts**: Get notified 15 min before demo starts

---

## 🎉 YOU'RE READY TO LAUNCH!

**Your complete enterprise lead generation system is ready:**

✅ **Apollo.io search matrix** (4 searches defined)  
✅ **Lead validation engine** (0-100 scoring algorithm)  
✅ **Sales pipeline tracker** (6-state machine)  
✅ **Cold email templates** (3-step sequence)  
✅ **Personalization system** (trigger events, social proof)

**Next Steps**:

1. **Run Apollo.io searches** (4 searches, 500 leads)
2. **Merge CSVs** (apollo_master.csv)
3. **Run validator**: `npm run validate:leads`
4. **Import to Instantly.ai** (500 leads)
5. **Launch campaigns** (Tier 1 Week 4, Tier 2 Week 5-6)
6. **Track conversions** (email → reply → demo → contract)

**Expected Result**: **3 contracts signed ($75K revenue)** within 8 weeks

---

**Everything is documented. Time to close enterprise deals! 🎯**

---

**Built with 💙 by the VETTED Team**  
**Enterprise Lead Generation Execution Guide**  
**Last Updated**: July 20, 2026
