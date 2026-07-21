# VettedPay Business Dashboard

## 💼 Corporate Workspace Portal

The **VettedPay Business Dashboard** is where Western enterprises manage their milestone-based contractor payments, track escrow funds, monitor verified talent, and oversee programmatic payouts through the Airwallex infrastructure.

---

## ✅ What Was Built

### **Files Created**

1. **`src/components/ui/table.tsx`** - Table component (shadcn/ui)
2. **`src/components/ui/dialog.tsx`** - Modal dialog component (shadcn/ui)
3. **`src/components/MetricCard.tsx`** - KPI metric card with trends
4. **`src/components/ContractorPassportModal.tsx`** - Contractor passport quick-view
5. **`src/app/business/dashboard/page.tsx`** - Main business dashboard
6. **`BUSINESS_DASHBOARD.md`** - Complete documentation

---

## 🎨 Dashboard Layout

```
┌────────────────────────────────────────────────────────┐
│  Header: VettedPay Dashboard | [Export] [Hire Talent] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌─────────────────┬─────────────────┬──────────────┐│
│  │ 💰 Total Funds  │ 👥 Active       │ 📈 Monthly   ││
│  │    Locked       │    Contractors  │    Payouts   ││
│  │                 │                 │              ││
│  │  $29,500        │      2          │   $6,000     ││
│  │  +12.5% ↑       │  +8.3% ↑        │   +23.1% ↑   ││
│  └─────────────────┴─────────────────┴──────────────┘│
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Active Contracts & Milestones   [Search] [Filter]│ │
│  ├──────────────────────────────────────────────────┤ │
│  │ Contract│Project │Contractor│Value│Miles│Status  │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ CTR-001│E-comm  │Chidi O.  │$15k │2/5  │Progress│ │
│  │        │        │[Passport]│     │▓▓░  │        │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ CTR-002│Mobile  │Amara N.  │$8.5k│1/3  │Awaiting│ │
│  │        │API     │[Passport]│     │▓░░  │Verify  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────┬──────────────────────────┐  │
│  │ Recent Milestones    │ Payout Schedule          │  │
│  ├──────────────────────┼──────────────────────────┤  │
│  │ ✅ M2 Completed      │ Jul 22: $2,833 [Pending] │  │
│  │    $3,000 released   │ Jul 25: $3,000 [Schedule]│  │
│  │                      │ Aug 5:  $3,000 [Schedule]│  │
│  │ ⚠️ Biometric Pending │                          │  │
│  │    Awaiting scan     │                          │  │
│  └──────────────────────┴──────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Features

### **1. KPI Metric Cards**

```
┌──────────────────────────────────┐
│ 💰 Total Milestone Funds Locked  │
├──────────────────────────────────┤
│          $29,500                 │
│  Across all active contracts     │
│                                  │
│  [+12.5%] vs last month          │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ 👥 Active Vetted Contractors     │
├──────────────────────────────────┤
│             2                    │
│     Currently engaged            │
│                                  │
│  [+8.3%] vs last month           │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ 📈 Monthly Programmatic Payouts  │
├──────────────────────────────────┤
│          $6,000                  │
│    Settled this month            │
│                                  │
│  [+23.1%] vs last month          │
└──────────────────────────────────┘
```

**Features:**
- Large, prominent values
- Currency formatting ($ with commas)
- Subtitle context
- Trend indicators (green/red badges)
- Comparison to previous month
- Icons for quick recognition

---

### **2. Active Contracts Table**

Full transaction data table with searchable, filterable contracts:

```
┌──────────────────────────────────────────────────────────────────┐
│ Active Contracts & Milestones          [Search...] [Filter]      │
├──────┬──────────┬────────────┬────────┬───────────┬─────────────┤
│ID    │Project   │Contractor  │Value   │Milestones │Status       │
├──────┼──────────┼────────────┼────────┼───────────┼─────────────┤
│CTR-  │E-commerce│   CO       │$15,000 │  2 / 5    │⏰ In Progress│
│2026- │Platform  │ Chidi O.   │  USD   │[████░]40% │             │
│001   │Rebuild   │[👁️ Passport]│        │   M3      │             │
│      │Jun 1     │            │        │           │             │
├──────┼──────────┼────────────┼────────┼───────────┼─────────────┤
│CTR-  │Mobile App│   AN       │$8,500  │  1 / 3    │⚠️ Awaiting  │
│2026- │Backend   │ Amara N.   │  USD   │[███░░]33% │  Verification│
│002   │API       │[👁️ Passport]│        │   M2      │             │
│      │Jun 15    │            │        │           │             │
├──────┼──────────┼────────────┼────────┼───────────┼─────────────┤
│CTR-  │DevOps    │   CO       │$6,000  │  4 / 4    │✅ Completed │
│2026- │Pipeline  │ Chidi O.   │  USD   │[████]100% │             │
│003   │Setup     │[👁️ Passport]│        │   -       │             │
│      │May 1     │            │        │           │             │
└──────┴──────────┴────────────┴────────┴───────────┴─────────────┘
```

**Columns:**
1. **Contract ID**: Unique identifier (CTR-YYYY-NNN)
2. **Project**: Project name + start date
3. **Contractor**: Avatar + name + passport link
4. **Total Value**: USD amount + currency
5. **Milestones**: Progress (N/M), visual bar, current milestone
6. **Status**: Badge (In Progress, Awaiting, Completed, Disputed)
7. **Next Payout**: Date + days remaining
8. **Actions**: Menu (•••)

**Status Badges:**
```
⏰ In Progress (gray outline)
⚠️ Awaiting Verification (yellow)
✅ Completed (green)
❌ Disputed (red)
```

**Milestone Progress:**
```
2 / 5  [██████░░░░] 40%  M3
      ↑           ↑      ↑
  Completed  Bar   Current
```

---

### **3. Contractor Passport Quick-View**

Click "View Passport" to see contractor's full VettedME credentials:

```
┌─────────────────────────────────────────┐
│ 🛡️ VettedME Trust Passport         [×] │
├─────────────────────────────────────────┤
│                                         │
│  [CO]  Chidi Okafor                 94  │
│        Lagos, Nigeria            ┌────┐ │
│        Joined Jun 2026           │ 94 │ │
│        ✅ Verified [Trust: 94]   │Trust│ │
│                                  └────┘ │
│                                         │
│  Primary Skills:                        │
│  [TypeScript] [React] [Node.js]         │
│  [PostgreSQL] [AWS] [Docker]            │
│                                         │
│  Skill Assessment Results:              │
│  ┌─────────────────────────────────┐   │
│  │ 🐙 Tier 1: Portfolio Audit      │   │
│  │    [████████████░░░░] 85/100    │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 💻 Tier 2: Code Lab             │   │
│  │    [█████████████████] 92/100   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 🎥 Tier 3: AI Viva              │   │
│  │    [███████████████████] 96/100 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Performance Stats:                     │
│  ┌───────┬────────┬──────────┐         │
│  │   2   │  5.0★  │ $23,500  │         │
│  │Contracts│Rating│  Earned  │         │
│  └───────┴────────┴──────────┘         │
│                                         │
│  [View Full Passport] [Close]           │
└─────────────────────────────────────────┘
```

**Features:**
- Full contractor profile
- Trust score (large circle badge)
- Skill tags
- All 3 tier scores with progress bars
- Performance metrics (contracts, rating, earnings)
- Link to full public passport page

---

### **4. Recent Milestones Activity**

```
┌─────────────────────────────────────┐
│ Recent Milestones                   │
├─────────────────────────────────────┤
│ ✅ Milestone 2 Completed            │
│    E-commerce Platform • Chidi O.   │
│    $3,000 released • 2 hours ago    │
│    [Green background]               │
├─────────────────────────────────────┤
│ ⚠️ Biometric Verification Pending   │
│    Mobile App Backend • Amara N.    │
│    Awaiting facial scan • 1 day ago │
│    [Yellow background]              │
├─────────────────────────────────────┤
│ ⏰ Milestone 3 In Progress          │
│    E-commerce Platform • Chidi O.   │
│    Expected completion: Jul 25      │
│    [Blue background]                │
└─────────────────────────────────────┘
```

**Activity Types:**
- ✅ Milestone completed (green)
- ⚠️ Verification pending (yellow)
- ⏰ In progress (blue)
- ❌ Disputed (red)

---

### **5. Payout Schedule**

Upcoming programmatic payouts:

```
┌──────────────────────────────────┐
│ Payout Schedule                  │
├──────────────────────────────────┤
│ Jul 22, 2026                     │
│ Mobile App Backend API           │
│ $2,833                  [Pending]│
├──────────────────────────────────┤
│ Jul 25, 2026                     │
│ E-commerce Platform Rebuild      │
│ $3,000               [Scheduled] │
├──────────────────────────────────┤
│ Aug 5, 2026                      │
│ E-commerce Platform Rebuild      │
│ $3,000               [Scheduled] │
└──────────────────────────────────┘
```

**Payout States:**
- **Pending**: Awaiting biometric verification
- **Scheduled**: Will auto-release on date
- **Processing**: Airwallex payment in progress
- **Complete**: Funds disbursed

---

## 📊 Data Flow

### **1. Load Dashboard**
```typescript
GET /api/v1/vettedpay/dashboard
{
  userId: "buyer-xyz"
}

Response: {
  metrics: {
    totalFundsLocked: 29500,
    activeContractors: 2,
    monthlyPayouts: 6000,
    trends: {...}
  },
  contracts: [...],
  recentActivity: [...],
  upcomingPayouts: [...]
}
```

### **2. View Contractor Passport**
```typescript
GET /api/v1/vettedme/passport/:userId

Response: {
  id, name, location, trustScore,
  skills: [...],
  tier1Score, tier2Score, tier3Score,
  contractsCompleted, averageRating,
  totalEarned
}
```

### **3. Search/Filter Contracts**
```typescript
GET /api/v1/vettedpay/contracts?search=query&status=IN_PROGRESS

Response: {
  contracts: [...],
  total: 25,
  page: 1,
  pageSize: 10
}
```

---

## 🔒 Contract Status Flow

```
1. Contract Created
   ↓
   Funds locked in Airwallex escrow
   ↓
2. Milestone Started (M1)
   ↓
3. Milestone Completed
   ↓
4. Biometric Handshake
   ↓
   VettedME facial scan + NIN/BVN check
   ↓
5. Payout Triggered
   ↓
   Airwallex API: Transfer funds
   ↓
6. Payout Complete
   ↓
   Talent receives NGN/USD
   ↓
7. Next Milestone (M2)
   ↓
   ... repeat ...
   ↓
8. All Milestones Complete
   ↓
   Contract Status: COMPLETED
```

---

## 💰 Payment Flow

```
Western Enterprise
    ↓
Deposits $10,000 to Airwallex Escrow
    ↓
VettedPay locks funds (non-custodial)
    ↓
Developer completes Milestone 1
    ↓
Biometric verification (VettedME)
    ↓
VettedPay triggers Airwallex payout:
- Base amount: $2,000 (to developer)
- Platform fee (15%): $300 (to VettedPay)
- FX spread (0.5%): $10 (to VettedPay)
    ↓
Developer receives NGN equivalent
    ↓
Repeat for Milestones 2-5
```

---

## 🎨 UI/UX Features

### **Search & Filters**
```
[Search: "e-commerce"___________] [Filter ▼]

Filters:
- Status (In Progress, Awaiting, Completed)
- Contractor
- Date Range
- Value Range
```

### **Responsive Design**
- **Desktop**: Full table, 3-column metrics
- **Tablet**: Stacked cards, 2-column metrics
- **Mobile**: Vertical list, single-column metrics

### **Color Coding**
- **Green**: Completed, success
- **Blue**: In progress, active
- **Yellow**: Warning, awaiting action
- **Red**: Error, disputed
- **Gray**: Neutral, scheduled

---

## 📈 Metrics Calculation

### **Total Funds Locked**
```typescript
const totalFundsLocked = contracts
  .filter(c => c.status !== "COMPLETED")
  .reduce((sum, c) => sum + c.fundsLocked, 0);
```

### **Active Contractors**
```typescript
const activeContractors = new Set(
  contracts
    .filter(c => c.status !== "COMPLETED")
    .map(c => c.contractorId)
).size;
```

### **Monthly Payouts**
```typescript
const monthlyPayouts = payouts
  .filter(p => p.date >= startOfMonth && p.date <= endOfMonth)
  .reduce((sum, p) => sum + p.amount, 0);
```

---

## 🚀 Actions

**Header Actions:**
```
[Export Report]  - Download CSV/PDF
[Hire Talent]    - Browse VettedME marketplace
```

**Row Actions (•••):**
```
- View Contract Details
- View Milestones
- Dispute Milestone
- Message Contractor
- Generate Invoice
- Download Receipt
```

---

## 📱 User Journey

```
Login to VettedPay
    ↓
Dashboard Overview
- See funds locked
- Active contractors
- Upcoming payouts
    ↓
Browse Contracts Table
- Search/filter
- Click contractor name
    ↓
View Passport Modal
- See full credentials
- Trust score, tiers
    ↓
Monitor Milestones
- Track progress
- Await verification
    ↓
Automatic Payout
- Biometric verified
- Funds released
    ↓
Receive Confirmation
- Email notification
- Dashboard update
```

---

**The VettedPay Business Dashboard is complete! Western enterprises can now track escrow funds, monitor vetted contractors, and manage milestone-based payouts through an intuitive, data-rich interface. This is the corporate control center for zero-risk offshore hiring.**

Ready for the final prompt when you are!
