# 🎯 VETTED - Enterprise Lead Generation Matrix

## Executive Overview

This document defines the **exact Boolean search strings, firmographic filters, and targeting criteria** for sourcing high-value B2B enterprise client targets via Apollo.io and LinkedIn Sales Navigator.

**Target**: 500 qualified enterprise leads across US, UK, and Eurozone  
**Focus**: Technical decision-makers at companies with proven offshore engineering demand  
**Timeline**: 4 weeks to complete full list generation

---

## 📋 Table of Contents

1. [Target Company Profile (ICP)](#target-company-profile-icp)
2. [Apollo.io Search Matrix](#apolloio-search-matrix)
3. [LinkedIn Sales Navigator Search Matrix](#linkedin-sales-navigator-search-matrix)
4. [Lead Scoring Criteria](#lead-scoring-criteria)
5. [Data Export & Validation](#data-export--validation)
6. [Campaign Segmentation](#campaign-segmentation)

---

## 🎯 Target Company Profile (ICP)

### Firmographic Criteria

| Parameter | Target Value | Rationale |
|-----------|--------------|-----------|
| **Company Size** | 50-500 employees | Sweet spot: Post-Series A scaling, budget for offshore |
| **Geographic HQ** | US, UK, Eurozone | High-value markets with offshore engineering demand |
| **Funding Stage** | Series A - Series C | Proven product-market fit, growth capital deployed |
| **Industry** | FinTech, SaaS, HealthTech, Web3, PropTech | High engineering density, offshore-friendly |
| **Engineering Team** | 10-100 engineers | Large enough to need scaling, small enough to be agile |
| **Growth Signal** | Recent funding or headcount growth | Active hiring = pain point |

---

### Technographic Signals (Bonus)

| Signal | Indicator | Value |
|--------|-----------|-------|
| **Tech Stack** | TypeScript, React, Node.js, Go, Rust | Matches our supply-side talent pool |
| **Cloud Provider** | AWS, GCP, Azure | Modern infrastructure = offshore-ready |
| **Remote Work Policy** | Remote-first or hybrid | Already comfortable with distributed teams |
| **Job Postings** | Active engineering hiring | Immediate need for talent |

---

## 🔍 Apollo.io Search Matrix

### Primary Search: Technical Decision-Makers

#### Search 1: CTOs at High-Growth SaaS Companies

**Filters**:
- **Job Titles**: CTO, Chief Technology Officer
- **Company Size**: 50-500 employees
- **Industry**: Computer Software, SaaS, Internet
- **Location**: United States, United Kingdom, Germany, France, Netherlands
- **Funding**: Series A, Series B, Series C
- **Keywords**: "remote engineering", "distributed team", "offshore", "global talent"

**Boolean Search String**:
```
(CTO OR "Chief Technology Officer") AND 
(SaaS OR "Software as a Service" OR "cloud software") AND
(50..500 employees) AND
(Series A OR Series B OR Series C) AND
(location:US OR location:UK OR location:DE OR location:FR OR location:NL)
```

**Expected Results**: 150-200 leads

---

#### Search 2: VP of Engineering at FinTech Startups

**Filters**:
- **Job Titles**: VP of Engineering, VP Engineering, Head of Engineering
- **Company Size**: 50-300 employees
- **Industry**: Financial Services, FinTech, Payments, Banking
- **Location**: United States, United Kingdom, Germany
- **Funding**: Series A, Series B, Series C, Series D
- **Keywords**: "engineering team", "technical hiring", "scaling engineering"

**Boolean Search String**:
```
("VP of Engineering" OR "VP Engineering" OR "Head of Engineering") AND
(FinTech OR "Financial Technology" OR Payments OR Banking) AND
(50..300 employees) AND
(Series A OR Series B OR Series C OR Series D) AND
(location:US OR location:UK OR location:DE)
```

**Expected Results**: 100-150 leads

---

#### Search 3: Directors of Engineering at HealthTech Scale-Ups

**Filters**:
- **Job Titles**: Director of Engineering, Engineering Director
- **Company Size**: 75-500 employees
- **Industry**: Healthcare, HealthTech, Digital Health, Telemedicine
- **Location**: United States, United Kingdom
- **Funding**: Series B, Series C
- **Keywords**: "healthcare technology", "digital health", "remote engineering"

**Boolean Search String**:
```
("Director of Engineering" OR "Engineering Director") AND
(HealthTech OR "Digital Health" OR Telemedicine OR "Healthcare Technology") AND
(75..500 employees) AND
(Series B OR Series C) AND
(location:US OR location:UK)
```

**Expected Results**: 80-120 leads

---

#### Search 4: Technical Co-Founders at Web3 Startups

**Filters**:
- **Job Titles**: Co-Founder, Founder, Technical Co-Founder, CTO & Founder
- **Company Size**: 10-200 employees
- **Industry**: Blockchain, Web3, Cryptocurrency, DeFi
- **Location**: United States, United Kingdom, Germany, Switzerland
- **Funding**: Seed, Series A, Series B
- **Keywords**: "blockchain", "web3", "crypto", "smart contracts"

**Boolean Search String**:
```
("Co-Founder" OR Founder OR "Technical Co-Founder" OR "CTO & Founder") AND
(Blockchain OR Web3 OR Cryptocurrency OR DeFi OR "Decentralized Finance") AND
(10..200 employees) AND
(Seed OR Series A OR Series B) AND
(location:US OR location:UK OR location:DE OR location:CH)
```

**Expected Results**: 100-150 leads

---

### Apollo.io Export Process

1. **Run Each Search**: Execute 4 searches above in Apollo.io
2. **Export to CSV**: Download CSV with following fields:
   - First Name, Last Name, Email, Job Title
   - Company Name, Company Size, Industry, Location
   - LinkedIn URL, Company Website
   - Funding Stage, Last Funding Date, Total Funding
3. **Deduplicate**: Remove duplicate contacts across searches
4. **Merge Files**: Combine into single master CSV
5. **Run Validation**: Pass through `lead_validator.ts` (see below)

**Total Expected**: 430-620 raw leads → **500 validated leads**

---

## 🔍 LinkedIn Sales Navigator Search Matrix

### Primary Search: Technical Decision-Makers

#### Search 1: CTOs at US Tech Startups

**Filters**:
- **Job Title**: CTO, Chief Technology Officer
- **Company Headcount**: 51-500
- **Geography**: United States
- **Industry**: Software Development, Internet, FinTech
- **Seniority Level**: C-Suite
- **Company Growth**: Hiring on LinkedIn (10+ job postings)

**Advanced Search URL Pattern**:
```
https://www.linkedin.com/sales/search/people?
keywords=CTO%20OR%20Chief%20Technology%20Officer
&companySize=D,E,F (51-200, 201-500, 501-1000)
&geoUrn=103644278 (United States)
&seniorityLevel=DIRECTOR,VP,CXO
```

**Expected Results**: 200-300 leads

---

#### Search 2: VPs of Engineering at UK/EU SaaS Companies

**Filters**:
- **Job Title**: VP of Engineering, Head of Engineering, VP Engineering
- **Company Headcount**: 51-500
- **Geography**: United Kingdom, Germany, France, Netherlands
- **Industry**: SaaS, Cloud Computing, Software Development
- **Seniority Level**: VP, Director
- **Recent Activity**: Posted in last 90 days (active on LinkedIn)

**Advanced Search URL Pattern**:
```
https://www.linkedin.com/sales/search/people?
keywords=VP%20of%20Engineering%20OR%20Head%20of%20Engineering
&companySize=D,E,F
&geoUrn=101165590,106155005,105015875,102890719 (UK, DE, FR, NL)
&seniorityLevel=DIRECTOR,VP
```

**Expected Results**: 150-250 leads

---

#### Search 3: Engineering Leaders at Recently Funded Companies

**Filters**:
- **Job Title**: Director of Engineering, Engineering Manager, VP Engineering
- **Company Headcount**: 50-500
- **Geography**: United States, United Kingdom
- **Company Signals**: Recent funding announcement (last 12 months)
- **Industry**: Technology, Software, FinTech, HealthTech
- **Keywords**: "hiring", "scaling", "team growth"

**Advanced Search URL Pattern**:
```
https://www.linkedin.com/sales/search/people?
keywords=Director%20of%20Engineering%20OR%20Engineering%20Manager
&companySize=D,E,F
&geoUrn=103644278,101165590
&companySignals=FUNDING_EVENT
```

**Expected Results**: 100-150 leads

---

### LinkedIn Sales Navigator Export Process

1. **Run Each Search**: Execute 3 searches above in Sales Navigator
2. **Export Lists**: Save to CSV (25 leads at a time, max 2,500/month)
3. **Extract Emails**: Use Apollo.io or Hunter.io for email enrichment
4. **Merge with Apollo Data**: Combine with Apollo exports
5. **Run Validation**: Pass through `lead_validator.ts`

**Total Expected**: 450-700 raw leads → **500 validated leads** (after deduplication with Apollo)

---

## 📊 Lead Scoring Criteria (0-100)

### Firmographic Score (0-50 points)

| Factor | Weight | Scoring |
|--------|--------|---------|
| **Company Size** | 15 pts | 50-100: 15pts, 100-200: 12pts, 200-500: 10pts, 500+: 5pts |
| **Funding Stage** | 15 pts | Series B/C: 15pts, Series A: 12pts, Seed: 8pts, Bootstrapped: 5pts |
| **Industry Match** | 10 pts | FinTech/SaaS/Web3: 10pts, HealthTech/PropTech: 8pts, Other: 5pts |
| **Geographic HQ** | 10 pts | US: 10pts, UK: 9pts, Eurozone: 8pts, Other: 3pts |

---

### Technographic Score (0-30 points)

| Factor | Weight | Scoring |
|--------|--------|---------|
| **Tech Stack Match** | 15 pts | TypeScript/React/Go: 15pts, Python/Java: 10pts, PHP/.NET: 5pts |
| **Engineering Team Size** | 10 pts | 25-75 engineers: 10pts, 10-25: 8pts, 75-100: 6pts, <10 or >100: 3pts |
| **Remote Work Policy** | 5 pts | Remote-first: 5pts, Hybrid: 3pts, Office-only: 0pts |

---

### Behavioral Score (0-20 points)

| Factor | Weight | Scoring |
|--------|--------|---------|
| **Recent Funding** | 10 pts | <6 months: 10pts, 6-12 months: 7pts, 12-24 months: 4pts, >24 months: 0pts |
| **Active Hiring** | 5 pts | 10+ open roles: 5pts, 5-10: 3pts, 1-5: 1pt, 0: 0pts |
| **LinkedIn Activity** | 5 pts | Posted last 30 days: 5pts, Last 90 days: 3pts, Inactive: 0pts |

---

### Total Score Tiers

| Score Range | Tier | Priority | Action |
|-------------|------|----------|--------|
| **85-100** | Tier 1 | Highest | Personalized outreach, direct research |
| **70-84** | Tier 2 | High | Standard outreach sequence, A/B testing |
| **55-69** | Tier 3 | Medium | Automated sequence, lower frequency |
| **<55** | Tier 4 | Low | Exclude or nurture campaign |

**Target Distribution**:
- Tier 1 (85+): 100 leads (20%)
- Tier 2 (70-84): 200 leads (40%)
- Tier 3 (55-69): 200 leads (40%)
- **Total**: 500 qualified leads

---

## 📥 Data Export & Validation

### Required CSV Fields

| Field | Source | Example |
|-------|--------|---------|
| `firstName` | Apollo/LinkedIn | "Sarah" |
| `lastName` | Apollo/LinkedIn | "Chen" |
| `email` | Apollo/Hunter.io | "sarah.chen@example.com" |
| `jobTitle` | Apollo/LinkedIn | "VP of Engineering" |
| `companyName` | Apollo/LinkedIn | "Acme SaaS Inc." |
| `companySize` | Apollo/LinkedIn | "150" |
| `industry` | Apollo/LinkedIn | "SaaS" |
| `location` | Apollo/LinkedIn | "San Francisco, CA" |
| `linkedinUrl` | Apollo/LinkedIn | "linkedin.com/in/sarahchen" |
| `companyWebsite` | Apollo/LinkedIn | "acmesaas.com" |
| `fundingStage` | Apollo/Crunchbase | "Series B" |
| `fundingAmount` | Apollo/Crunchbase | "$25M" |
| `lastFundingDate` | Apollo/Crunchbase | "2025-08-15" |

---

### Validation Checklist

Before importing leads into outreach platform:
- [ ] All emails have valid syntax (regex check)
- [ ] No generic domains (gmail.com, yahoo.com, hotmail.com)
- [ ] No duplicate emails across entire list
- [ ] Company size between 50-500 employees
- [ ] Job title matches target list (CTO, VP Eng, Director Eng, Co-Founder)
- [ ] Location is US, UK, or Eurozone country
- [ ] Lead score calculated (0-100)
- [ ] LinkedIn URL format validated

**Use**: `scripts/demand/lead_validator.ts` (see below) to automate validation

---

## 📊 Campaign Segmentation

### Segment 1: US CTOs at Series B+ SaaS Companies
- **Size**: 150 leads
- **Persona**: Risk-averse, proven budget, compliance-focused
- **Message Angle**: "Instant biometric trust + automated W-8BEN compliance"
- **Timing**: Week 1

### Segment 2: UK/EU VPs of Engineering at FinTech Scale-Ups
- **Size**: 100 leads
- **Persona**: Cost-conscious, GDPR-aware, cross-border experience
- **Message Angle**: "Sub-100ms latency routing + GDPR-compliant identity verification"
- **Timing**: Week 2

### Segment 3: US Directors of Engineering at HealthTech Companies
- **Size**: 100 leads
- **Persona**: Compliance-heavy, security-focused, HIPAA concerns
- **Message Angle**: "SOC 2 Type II + field-level encryption + audit trail"
- **Timing**: Week 3

### Segment 4: Technical Co-Founders at Web3 Startups
- **Size**: 150 leads
- **Persona**: Crypto-native, fast-moving, developer-first
- **Message Angle**: "Cryptographic trust passports + programmatic escrow settlement"
- **Timing**: Week 4

---

## 🎯 Success Metrics

### Lead Generation KPIs

| Metric | Target | Notes |
|--------|--------|-------|
| **Total Leads Generated** | 500 | Across all segments |
| **Average Lead Score** | >= 72/100 | Quality threshold |
| **Email Validity Rate** | >= 95% | Post-validation |
| **Job Title Match Rate** | >= 90% | CTO, VP, Director, Co-Founder only |
| **Company Size Match Rate** | >= 85% | 50-500 employees |

---

### Outreach Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Email Deliverability** | >= 98% | Avoid bounces |
| **Open Rate** | >= 45% | Industry benchmark: 30-40% |
| **Reply Rate** | >= 8% | Industry benchmark: 3-5% |
| **Demo Booking Rate** | >= 2% | 10 demos from 500 emails |
| **Demo → Contract Conversion** | >= 30% | 3 contracts from 10 demos |

**ROI Calculation**:
- 500 emails → 40 replies → 10 demos → 3 contracts
- Average contract value: $25,000 (first engagement)
- Revenue: $75,000
- Cost: $2,500 (tooling + time)
- **ROI**: 30x

---

## 🛠️ Tools & Resources

### Lead Generation Tools
- **Apollo.io**: Primary lead source, email enrichment
- **LinkedIn Sales Navigator**: Secondary source, LinkedIn data
- **Hunter.io**: Email finder & verifier
- **Clearbit**: Company enrichment (funding, tech stack)
- **RocketReach**: Email enrichment backup

### Data Validation Tools
- **lead_validator.ts** (custom script, see `scripts/demand/`)
- **NeverBounce** or **ZeroBounce**: Email verification API
- **Clearbit Risk API**: Email domain quality check

### Outreach Tools
- **Instantly.ai**: Email automation platform
- **Lemlist**: Alternative email automation
- **Reply.io**: Alternative email automation
- **Slack**: Real-time lead notifications

---

## 📚 Next Steps

### Week 1: Apollo.io Search & Export
1. Run 4 Apollo searches (CTOs, VPs, Directors, Co-Founders)
2. Export to CSV (430-620 leads)
3. Merge CSVs into master file

### Week 2: LinkedIn Sales Navigator Search & Export
1. Run 3 LinkedIn searches (CTOs, VPs, Engineering Leaders)
2. Export to CSV (450-700 leads)
3. Enrich with Hunter.io for emails

### Week 3: Data Validation & Scoring
1. Merge Apollo + LinkedIn data (deduplicate)
2. Run `lead_validator.ts` script
3. Calculate lead scores (0-100)
4. Filter to top 500 leads (Tier 1-3)

### Week 4: Campaign Segmentation & Launch
1. Segment leads by persona (4 segments)
2. Import to Instantly.ai / Lemlist
3. Configure 3-step email sequence (from Phase 1)
4. Launch campaigns (50 emails/day per segment)

---

## ✅ Deliverables Checklist

- [ ] Apollo.io searches configured (4 searches)
- [ ] LinkedIn Sales Navigator searches configured (3 searches)
- [ ] Master CSV exported (500+ leads)
- [ ] Lead validation script executed (`lead_validator.ts`)
- [ ] Lead scoring applied (0-100)
- [ ] Leads segmented by persona (4 segments)
- [ ] Outreach platform configured (Instantly.ai / Lemlist)
- [ ] Email sequences loaded (3-step from Phase 1)
- [ ] Slack webhook configured (real-time notifications)
- [ ] Campaign launched (Week 1 segment)

---

**Built with 💙 by the VETTED Team**  
**Phase 3: Enterprise Lead Generation Matrix**  
**Last Updated**: July 20, 2026
