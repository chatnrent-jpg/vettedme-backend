# 📧 VETTED Developer Outreach Campaign - Setup Guide

## Executive Overview

This guide walks you through importing your scraped GitHub developers into an email outreach platform (Instantly.ai / Lemlist / Reply.io) and launching your invite-only beta campaign.

**Timeline**: 30 minutes setup → 3 weeks execution  
**Target**: 50 verified VettedME Passports issued  
**Expected Conversion**: 15-20% (email → signup), 50% (signup → verified)

---

## 📋 Table of Contents

1. [Choose Your Outreach Platform](#choose-your-outreach-platform)
2. [Import Developer CSV](#import-developer-csv)
3. [Configure Email Sequence](#configure-email-sequence)
4. [Set Up Personalization](#set-up-personalization)
5. [Launch Campaign](#launch-campaign)
6. [Monitor & Optimize](#monitor--optimize)

---

## 1️⃣ Choose Your Outreach Platform

### Recommended: Instantly.ai (Best for Cold Email)

**Why Instantly.ai?**
- ✅ Unlimited email accounts (warm-up multiple domains)
- ✅ Built-in deliverability optimizer
- ✅ Advanced personalization (AI variables)
- ✅ Real-time analytics
- ✅ Affordable ($37/month for unlimited emails)

**Alternatives**:
- **Lemlist**: Best for personalized videos/images ($59/month)
- **Reply.io**: Best for multi-channel (email + LinkedIn) ($70/month)
- **Mailshake**: Best for simple sequences ($58/month)

**For this guide, we'll use Instantly.ai** (but steps are similar for all platforms).

---

## 2️⃣ Import Developer CSV

### Step 2.1: Prepare Your CSV Files

You should have 3 CSV files from the GitHub scraper:
- `lagos_developers_2026-07-20.csv`
- `nairobi_developers_2026-07-20.csv`
- `saopaulo_developers_2026-07-20.csv`

**Location**: `C:\VETTEDCARE.AI\vettedcare-backend\output\talent\`

---

### Step 2.2: Merge CSVs (Optional - for single campaign)

**Option A: Keep Separate** (Recommended for corridor-specific messaging)
- Import each CSV as a separate campaign
- Customize messaging per corridor (Lagos vs São Paulo)

**Option B: Merge into One**
```bash
# PowerShell
cd output\talent
Get-Content lagos_developers_*.csv, nairobi_developers_*.csv, saopaulo_developers_*.csv | Set-Content all_developers.csv
```

---

### Step 2.3: Filter to Top Tier Only

⚠️ **IMPORTANT**: Only invite developers with **quality score >= 70**

**In Excel/Google Sheets**:
1. Open CSV file
2. Filter column `qualityScore` >= 70
3. Sort by `qualityScore` (descending)
4. Take top 50-100 developers per corridor
5. Save as new CSV: `lagos_top_tier.csv`

**Expected Results**:
- Lagos: 200 scraped → 60 qualified (70+) → **20-25 invites**
- Nairobi: 150 scraped → 45 qualified → **15-20 invites**
- São Paulo: 150 scraped → 45 qualified → **15-20 invites**
- **Total**: 50-65 top-tier invites

---

### Step 2.4: Enrich with Email Addresses

⚠️ **CRITICAL**: GitHub scraper doesn't return emails. You need to find them.

**Method 1: Hunter.io (Recommended)**

1. Go to https://hunter.io
2. Sign up (100 free searches/month)
3. Use **Bulk Email Finder**:
   - Upload CSV with columns: `firstName`, `lastName`, `companyWebsite`
   - Hunter.io returns: email, confidence score
4. Download enriched CSV

**Method 2: LinkedIn + Apollo.io**
1. Search developer on LinkedIn (use `linkedinUrl` from CSV)
2. Use Apollo.io Chrome extension to find email
3. Add to CSV manually

**Method 3: GitHub Profile Email**
- Some developers list email on GitHub profile
- Check `githubUrl` from CSV
- If email listed, add to CSV

**Expected Email Discovery Rate**: 40-60%
- 50 top developers → 20-30 emails found
- Focus on Tier 1 (score 85+) first

---

### Step 2.5: Clean & Validate CSV

Before importing, ensure CSV has these columns:

| Required Column | Source | Example |
|----------------|---------|---------|
| `firstName` | Parse from `name` | "John" |
| `lastName` | Parse from `name` | "Doe" |
| `email` | Hunter.io enrichment | "john@example.com" |
| `location` | GitHub scraper | "Lagos, Nigeria" |
| `qualityScore` | GitHub scraper | "87" |
| `topLanguage` | Parse from `topLanguages[0]` | "TypeScript" |
| `githubUsername` | GitHub scraper | "john_doe" |
| `githubUrl` | GitHub scraper | "github.com/john_doe" |

**Sample Row**:
```csv
firstName,lastName,email,location,qualityScore,topLanguage,githubUsername,githubUrl
John,Doe,john@example.com,"Lagos, Nigeria",87,TypeScript,john_doe,github.com/john_doe
```

---

## 3️⃣ Configure Email Sequence

### Step 3.1: Log into Instantly.ai

1. Go to https://app.instantly.ai
2. Click **"Campaigns"** > **"New Campaign"**
3. Name: "VettedME Beta - Lagos Developers"
4. Click **"Create"**

---

### Step 3.2: Import CSV

1. In campaign, click **"Add Leads"**
2. Click **"Upload CSV"**
3. Select `lagos_top_tier.csv`
4. Map columns:
   - First Name → `firstName`
   - Last Name → `lastName`
   - Email → `email`
   - Custom Variable 1 → `location`
   - Custom Variable 2 → `qualityScore`
   - Custom Variable 3 → `topLanguage`
   - Custom Variable 4 → `githubUsername`

5. Click **"Import"** (should see X leads imported)

---

### Step 3.3: Set Up 2-Step Email Sequence

We'll use the templates from `docs/supply/developer_outreach.md`:

**Email 1 (Day 0)**: The Sovereign Infrastructure Invitation  
**Email 2 (Day 4)**: The Proof Point & Urgency Follow-Up

---

#### 📧 EMAIL 1: The Sovereign Infrastructure Invitation

**Subject Line Options** (Instantly.ai A/B tests these automatically):
```
A: Your invite to VettedME.ai - Sovereign Trust Passport
B: {{firstName}}, bypass the offshore payment delays
C: Elite developer infrastructure for {{location}}
```

**Email Body** (English - Lagos, Nairobi):

```
{{firstName}},

I came across your {{topLanguage}} work on GitHub (specifically {{githubUsername}}) and wanted to extend an invite to VettedME.ai—the first sovereign trust infrastructure for elite software engineers in {{location}}.

This isn't a talent marketplace. VettedME is a cryptographically verified identity passport that gives you:

1. Instant Payment Settlement: NGN/KES/USD payouts in <24hrs via Airwallex local clearing (no $45 SWIFT fees, no wire delays)

2. Programmatic Escrow Security: VettedPay.ai locks client funds in escrow before you start work. The moment you complete a milestone and pass a live face scan, your payment releases automatically.

3. Direct Access to US/EU Contracts: Bypass recruiters and traditional hiring delays. Your VettedME Passport gives you direct visibility to enterprise clients paying $50-$90/hour.

We're onboarding our first 20 {{location}} developers this month.

Your GitHub profile scored {{qualityScore}}/100 on our technical capability assessment (commit frequency, code complexity, authorship authenticity). You're exactly the type of elite engineer we built this for.

Next Step: Create your VettedME Passport (15 minutes)
👉 https://vettedme.app/join?ref={{githubUsername}}

The passport verification includes:
• GitHub OAuth (portfolio audit)
• 60-minute coding challenge (async data handling, API optimization, edge computing)
• Live biometric identity lock (Smile ID face matching)

Once verified, you'll have immediate access to our enterprise client pipeline.

Questions? Reply to this email or schedule a 10-minute intro call: https://calendly.com/vettedme/intro

Best,
[Your Name]
VettedME.ai | Elite Developer Infrastructure
{{location}} Hub
```

---

#### 📧 EMAIL 2: The Proof Point & Urgency Follow-Up

**Send on Day 4** (only if Email 1 not opened/replied)

**Subject Line Options**:
```
A: Re: Your invite to VettedME.ai - 5 {{location}} slots left
B: {{firstName}}, $25,000 escrow demo + your beta invite
C: Final call: VettedME Passport for {{location}} engineers
```

**Email Body**:

```
{{firstName}},

Quick follow-up on the VettedME invite.

Instead of pitch decks, we built a live $25,000 escrow demo so you can see exactly how the infrastructure works:

1. Client deposits $25,000 into VettedPay programmatic escrow (Airwallex multi-currency wallet)
2. Developer completes milestone and submits work for review
3. Client approves and requests payment release
4. Developer does live face scan (Smile ID biometric verification)
5. Payment auto-releases in <24hrs to developer's local bank account (NGN/KES/USD via Airwallex local clearing)

Zero manual intervention. Zero wire fees. Zero payment chasing.

Beta Status Update:
• Total {{location}} slots: 20
• Filled: 12
• Remaining: 8

We're prioritizing developers with 70+ GitHub quality scores. Your profile scored {{qualityScore}}/100, so you're pre-qualified.

If global payment infrastructure interests you, claim your VettedME Passport before slots fill:
👉 https://vettedme.app/join?ref={{githubUsername}}&urgency=1

If not, no worries—I'll stop here. Let me know either way.

Best,
[Your Name]
VettedME.ai | {{location}} Hub

P.S. Current {{location}} developers in beta:
• Chidinma O. (FinTech background, 91/100)
• Emmanuel K. (Open-source contributor, 88/100)
• Grace A. (Ex-Google engineer, 94/100)
```

---

### Step 3.4: Configure Sequence Settings

**In Instantly.ai Campaign Settings**:

1. **Timing**:
   - Email 1: Send immediately after import
   - Email 2: Send 4 days after Email 1 (only if no reply)

2. **Sending Schedule**:
   - Monday-Friday only
   - 9 AM - 5 PM (recipient's timezone)
   - Max 25 emails/day (warm-up gradually)

3. **Stop Conditions**:
   - Stop if lead replies
   - Stop if lead opens Email 2
   - Stop after Email 2 (don't spam)

4. **Tracking**:
   - Enable open tracking
   - Enable click tracking
   - Enable reply tracking

---

## 4️⃣ Set Up Personalization

### Step 4.1: Custom Variables in Instantly.ai

Map these variables from your CSV:

| Variable | CSV Column | Usage |
|----------|-----------|--------|
| `{{firstName}}` | firstName | Greeting |
| `{{location}}` | location | "Lagos, Nigeria" |
| `{{qualityScore}}` | qualityScore | "87" |
| `{{topLanguage}}` | topLanguage | "TypeScript" |
| `{{githubUsername}}` | githubUsername | "john_doe" |

---

### Step 4.2: Dynamic Content by Corridor

**Lagos-specific**:
```
Instant NGN payouts in <24hrs
Zero $45 SWIFT fees
$40-$80/hour from US/EU clients
```

**Nairobi-specific**:
```
M-Pesa integration (instant KES settlements)
$50-$90/hour premium rates
Direct access to UK/EU contracts
```

**São Paulo-specific** (Portuguese):
```
Subject: Seu convite para VettedME.ai - Passaporte de Confiança Soberano

{{firstName}},

Vi seu trabalho com {{topLanguage}} no GitHub (especialmente {{githubUsername}}) e gostaria de estender um convite para VettedME.ai...

[Use full Portuguese template from docs/supply/developer_outreach.md]
```

---

### Step 4.3: UTM Tracking (Optional)

Add UTM parameters to signup links for analytics:

```
https://vettedme.app/join?ref={{githubUsername}}&utm_source=email&utm_medium=cold_outreach&utm_campaign=beta_lagos&utm_content=email1
```

Track in Google Analytics:
- Which corridor converts best
- Which email (1 vs 2) drives more signups
- Which subject line has highest open rate

---

## 5️⃣ Launch Campaign

### Step 5.1: Domain Warm-Up (CRITICAL)

⚠️ **Don't skip this!** Cold domains get flagged as spam.

**Week 1**: 10 emails/day  
**Week 2**: 25 emails/day  
**Week 3**: 50 emails/day  
**Week 4+**: 100 emails/day

**Instantly.ai Auto-Warmup**:
1. Go to **"Settings"** > **"Email Accounts"**
2. Enable **"Warm-up"**
3. Set to **"Aggressive"** (sends emails between real accounts)
4. Wait 7 days before launching campaign

**Manual Warmup** (if no auto-warmup):
- Send 10 test emails to friends/colleagues
- Have them reply
- Gradually increase volume

---

### Step 5.2: Test Email Deliverability

Before launching to all 50 developers, test with 5:

1. Select 5 leads with different email providers:
   - Gmail
   - Outlook
   - Yahoo
   - Corporate domain
   - ProtonMail

2. Send Email 1 to these 5

3. Check:
   - ✅ Email lands in inbox (not spam)
   - ✅ Opens tracked correctly
   - ✅ Links work
   - ✅ Personalization renders correctly

**Tools**:
- https://www.mail-tester.com (test spam score)
- https://glockapps.com (test deliverability)

**Target Spam Score**: 8/10 or higher

---

### Step 5.3: Launch Campaign

**Week 1: Lagos** (20 developers)
```
Day 1: Import lagos_top_tier.csv (20 leads)
Day 1: Send Email 1 to all 20
Day 5: Send Email 2 to non-responders (15-18 leads)
```

**Week 2: Nairobi** (15 developers)
```
Day 8: Import nairobi_top_tier.csv (15 leads)
Day 8: Send Email 1 to all 15
Day 12: Send Email 2 to non-responders (12-14 leads)
```

**Week 3: São Paulo** (15 developers)
```
Day 15: Import saopaulo_top_tier.csv (15 leads)
Day 15: Send Email 1 to all 15 (Portuguese templates)
Day 19: Send Email 2 to non-responders (12-14 leads)
```

---

## 6️⃣ Monitor & Optimize

### Step 6.1: Key Metrics to Track

| Metric | Target | How to Track |
|--------|--------|--------------|
| **Email Deliverability** | 98%+ | Instantly.ai → Bounce rate |
| **Open Rate** | 60%+ | Instantly.ai → Opens |
| **Click Rate** | 25%+ | Instantly.ai → Clicks on signup link |
| **Reply Rate** | 5-10% | Instantly.ai → Replies |
| **Signup Rate** | 15-20% | Google Analytics → /join page visits |
| **Verification Rate** | 50%+ | Database → PASSPORT_ISSUED count |

---

### Step 6.2: Daily Monitoring Checklist

**Every Morning** (10 minutes):
- [ ] Check Instantly.ai dashboard for replies
- [ ] Respond to questions within 2 hours
- [ ] Check spam complaints (should be 0)
- [ ] Review bounce rate (<2%)
- [ ] Check signup page analytics (GA)

**Every Week** (30 minutes):
- [ ] A/B test subject lines (swap worst performer)
- [ ] Review email body (adjust messaging based on feedback)
- [ ] Check developer onboarding progress (database query)
- [ ] Update remaining slots count in Email 2

---

### Step 6.3: Optimization Strategies

**If Open Rate < 50%**:
- ✅ Change subject lines (more curiosity-driven)
- ✅ Send at different times (try 10 AM vs 2 PM)
- ✅ Check spam score (use mail-tester.com)

**If Click Rate < 20%**:
- ✅ Shorten email (aim for <150 words)
- ✅ Make CTA more prominent (use button instead of link)
- ✅ Add social proof (testimonials, logos)

**If Reply Rate < 5%**:
- ✅ Ask a question at the end
- ✅ Make value prop clearer (focus on pain point)
- ✅ Personalize more (mention specific GitHub repo)

**If Signup Rate < 15%**:
- ✅ Simplify signup process (reduce form fields)
- ✅ Add trust signals (security badges, testimonials)
- ✅ A/B test landing page

---

## 📊 Expected Results

### Funnel Breakdown (50 Developers)

| Stage | Count | % | Notes |
|-------|-------|---|-------|
| **Emails Sent** | 50 | 100% | Top-tier only (score 70+) |
| **Emails Opened** | 30 | 60% | Good subject line |
| **Links Clicked** | 12 | 24% | Interested in value prop |
| **Signups Started** | 8-10 | 16-20% | Created account |
| **Profile Completed** | 7-9 | 14-18% | Filled out professional details |
| **GitHub Connected** | 6-8 | 12-16% | OAuth successful |
| **Tier 2 Started** | 5-7 | 10-14% | Entered code lab |
| **Tier 2 Passed** | 4-6 | 8-12% | Passed coding challenge |
| **Tier 3 Started** | 4-6 | 8-12% | Initiated biometric scan |
| **Tier 3 Passed** | 3-5 | 6-10% | Biometric verified |
| **Passport Issued** | **3-5** | **6-10%** | ✅ Ready for clients |

**Per Corridor**:
- Lagos (20 emails) → **1-2 passports**
- Nairobi (15 emails) → **1 passport**
- São Paulo (15 emails) → **1 passport**

**Total**: 3-5 verified passports per 50 emails (6-10% conversion)

**To reach 50 passports**: Send to 500-1000 developers (but start with top 50-100)

---

## 🚨 Common Issues & Solutions

### Issue 1: Low Email Discovery Rate

**Problem**: Can't find emails for GitHub users

**Solutions**:
1. **LinkedIn → Hunter.io**: Search LinkedIn for GitHub username, use Hunter.io on company domain
2. **GitHub Profile**: Check if email listed publicly
3. **GitHub Commits**: Run `git log --format='%ae' | sort | uniq` on their repos
4. **Prioritize Tier 1**: Focus on score 85+ (worth the manual effort)

---

### Issue 2: High Spam Rate

**Problem**: Emails landing in spam folder

**Solutions**:
1. **SPF/DKIM/DMARC**: Verify DNS records configured correctly
2. **Warm-up longer**: Wait 14 days instead of 7
3. **Reduce volume**: Send 10/day instead of 25
4. **Improve content**: Remove spammy words (free, money, click here)
5. **Use custom domain**: vettedme.app instead of gmail.com

---

### Issue 3: Low Signup Rate

**Problem**: Opens/clicks are high, but signups are low

**Solutions**:
1. **Simplify landing page**: Remove unnecessary fields
2. **Add social proof**: Show existing developers, testimonials
3. **Clarify value prop**: Emphasize instant payment, zero fees
4. **Reduce friction**: Allow signup with just email (OAuth later)

---

### Issue 4: High Dropout at Tier 2 (Code Lab)

**Problem**: Developers sign up but don't complete coding challenge

**Solutions**:
1. **Reduce difficulty**: Lower from 85% to 80% pass threshold
2. **Extend time**: Give 90 minutes instead of 60
3. **Add video walkthrough**: Record 5-minute explanation
4. **Email reminder**: Send 24hr reminder if not started

---

## ✅ Launch Checklist

### Pre-Launch (Week 0)
- [ ] GitHub scraper completed (3 CSV files)
- [ ] CSVs filtered to top tier (score 70+)
- [ ] Emails enriched via Hunter.io (20-30 found)
- [ ] Instantly.ai account created ($37/month)
- [ ] Email domain warmed up (7-14 days)
- [ ] Email templates configured (2-step sequence)
- [ ] Personalization variables mapped
- [ ] Test emails sent (5 developers, all delivered)

### Week 1: Lagos Launch
- [ ] Import lagos_top_tier.csv (20 leads)
- [ ] Launch campaign (Email 1)
- [ ] Monitor open rates (target 60%)
- [ ] Respond to replies within 2 hours
- [ ] Send Email 2 to non-responders (Day 5)

### Week 2: Nairobi Launch
- [ ] Import nairobi_top_tier.csv (15 leads)
- [ ] Launch campaign (Email 1)
- [ ] Monitor Lagos conversions (track signups)
- [ ] Send Email 2 to Nairobi non-responders (Day 12)

### Week 3: São Paulo Launch
- [ ] Import saopaulo_top_tier.csv (15 leads)
- [ ] Use Portuguese templates
- [ ] Launch campaign (Email 1)
- [ ] Monitor Nairobi conversions
- [ ] Send Email 2 to São Paulo non-responders (Day 19)

### Week 4: Optimization
- [ ] Review funnel metrics (open → click → signup → verified)
- [ ] A/B test underperforming emails
- [ ] Respond to all questions/objections
- [ ] Plan second wave (if <50 passports reached)

---

## 🎯 Success Criteria

**Phase 2 Execution Complete When**:
- [x] GitHub scraper executed (3 CSVs exported)
- [ ] 50 top-tier developers identified (score 70+)
- [ ] 20-30 emails discovered via Hunter.io
- [ ] Email sequence configured (2 steps)
- [ ] Campaign launched (Week 1-3)
- [ ] **3-5 verified passports issued** (Week 4)

**If targeting 50 total passports**: Expand to 500-1000 emails over 3 months

---

## 🎉 YOU'RE READY TO LAUNCH!

**Quick Start Commands**:

```bash
# 1. Filter CSVs to top tier
# (Open in Excel, filter qualityScore >= 70, save as _top_tier.csv)

# 2. Enrich with Hunter.io
# (Upload to hunter.io/bulk-email-finder)

# 3. Import to Instantly.ai
# (campaigns > new campaign > upload CSV)

# 4. Launch!
# (activate campaign, set sending schedule)
```

**Expected Timeline**:
- **Week 1-3**: Send emails (50 developers)
- **Week 2-4**: Developers sign up, complete verification
- **Week 4**: **3-5 passports issued**, ready for enterprise matching

**You're about to activate the supply side! Let's go! 🚀**

---

**Built with 💙 by the VETTED Team**  
**Campaign Setup Guide**  
**Last Updated**: July 20, 2026
