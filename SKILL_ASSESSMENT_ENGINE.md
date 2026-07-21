# VettedME Skill Assessment Engine

## 🧠 The Intelligence Layer That Stops Resume Fraud

The **Skill Assessment Engine** is VettedME's core anti-fraud mechanism. It's a three-tier automated gauntlet that ensures only legitimate, skilled developers can receive a VettedME Passport.

---

## 🎯 The Problem It Solves

Generative AI has created a **trust crisis** in remote hiring:
- **Fake Resumes**: ChatGPT writes convincing but fraudulent CVs
- **Deepfake Interviews**: Candidates use AI to impersonate skilled developers
- **Synthetic Portfolios**: GitHub repos filled with copy-pasted or AI-generated code
- **Outsourced Assessments**: Candidates hire others to take coding tests

**VettedME's Solution**: A three-tier verification funnel that cannot be faked.

---

## 🏗️ Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   [Candidate Registration]                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  TIER 1: Portfolio Audit (GitHub/GitLab API Analysis)          │
│  ────────────────────────────────────────────────────────────  │
│  • Commit history analysis                                      │
│  • Code complexity scoring (0-100)                              │
│  • Authorship verification                                      │
│  • AI-generated code detection                                  │
│  • Copy-paste pattern recognition                               │
│  • Temporal fraud detection (portfolio stuffing)                │
│                                                                 │
│  Passing Score: 70%+                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │ PASS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  TIER 2: Sandboxed Code Lab (Live Execution)                   │
│  ────────────────────────────────────────────────────────────  │
│  • In-browser IDE environment                                   │
│  • Real broken codebase scenarios                               │
│  • Test suite must pass                                         │
│  • Keystroke pattern analysis (detects outsourcing)             │
│  • Timing anomaly detection (detects AI assistance)             │
│  • Window switching detection (detects external help)           │
│                                                                 │
│  Passing Score: 85%+                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │ PASS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  TIER 3: AI Technical Viva (Anti-Deepfake Interview)           │
│  ────────────────────────────────────────────────────────────  │
│  • Dynamic questions based on Tier 2 code                       │
│  • 10-minute video interview                                    │
│  • Facial biometric tracking (anti-deepfake)                    │
│  • Voice pattern analysis (matches government ID)               │
│  • Third-party assistance detection                             │
│  • Eye movement tracking (reading from another screen)          │
│                                                                 │
│  Passing Score: 90%+                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │ PASS
                             ▼
                  [VettedME Passport Issued]
                  Trust Score: 0-100
```

---

## 🔬 Tier 1: Portfolio Audit

### What It Analyzes

#### 1. **Commit History**
- Total commits across repositories
- Commit frequency patterns
- Recent commit surge detection (portfolio stuffing)
- Commit timestamps (detects mass-generated repos)

#### 2. **Code Complexity Score**
Calculated from:
- Repository size (max 30 points)
- Commit count (max 30 points)
- Stars/forks (max 20 points)
- Multiple languages (max 20 points)

**Formula**: `score = min(100, size_score + commit_score + popularity_score + language_score)`

#### 3. **Authorship Verification**
- Cross-checks commit emails with GitHub profile
- Detects forked repos without contributions
- Flags repos with minimal changes

#### 4. **AI-Generated Code Detection**
Heuristics for AI signatures:
- Overly consistent formatting
- Generic variable names (`foo`, `bar`, `temp`)
- Excessive comments
- Perfect indentation with no typos
- Common AI phrases ("Here's a function", "You can use this")

#### 5. **Copy-Paste Detection**
- Compares code across repositories
- Identifies duplicate patterns
- Flags high similarity scores

#### 6. **Suspicious Patterns**
- Mass commits in short time (<7 days)
- Empty or minimal repos
- New repos with excessive commits
- Forked repos without contributions

### Scoring Algorithm

```typescript
Tier 1 Score = (
  code_complexity * 0.4 +
  authorship_verified * 0.3 +
  (100 - ai_generated_percentage) * 0.2 +
  (100 - copy_paste_percentage) * 0.1
)

Passing Threshold: 70%
```

### API Endpoint

```bash
POST /api/v1/assessment/tier1/portfolio

Request:
{
  "sessionId": "assessment_123",
  "githubUsername": "developer123",
  "repositories": [
    "project-alpha",
    "project-beta",
    "portfolio-site"
  ]
}

Response (Pass):
{
  "success": true,
  "message": "Tier 1 passed! Proceed to Tier 2: Code Lab",
  "result": {
    "tier": "TIER_1_PORTFOLIO_AUDIT",
    "passed": true,
    "score": 85,
    "maxScore": 100,
    "flags": [],
    "metadata": {
      "repositoriesAnalyzed": 3,
      "totalCommits": 247,
      "codeComplexityScore": 78,
      "aiGeneratedPercentage": 12,
      "copyPastePercentage": 8,
      "authorshipVerified": true
    }
  },
  "nextStep": {
    "tier": "TIER_2_CODE_LAB",
    "endpoint": "POST /api/v1/assessment/tier2/start"
  }
}
```

---

## 💻 Tier 2: Sandboxed Code Lab

### What It Tests

#### 1. **Live Coding Ability**
Candidates are dropped into a **broken codebase** with:
- Bugs to fix
- Tests to pass
- Code to refactor
- Edge cases to handle

#### 2. **Test Suite Execution**
Code must pass automated tests:
- Unit tests
- Integration tests
- Edge case tests
- Performance tests

#### 3. **Keystroke Pattern Analysis**
Detects fraudulent behavior:
- **Too consistent**: Robotic typing = AI wrapper
- **Too fast**: Average < 50ms between keys = suspicious
- **No backspaces**: < 5% error rate = inhuman
- **Timing variance**: Low variance = automated assistance

#### 4. **Timing Anomaly Detection**
Flags suspicious patterns:
- Long pause (>5min) followed by sudden burst
- Completing complex task too quickly
- Unusual idle periods followed by perfect code

#### 5. **Window Switching Detection**
Tracks browser focus events:
- More than 5 window switches = external assistance suspected
- Focus loss during critical coding = suspicious

#### 6. **Code Quality Scoring**
Analyzes:
- Use of modern syntax (const/let vs var)
- Error handling (try/catch blocks)
- Code comments
- Variable naming
- Code length and structure

### Scoring Algorithm

```typescript
Tier 2 Score = (
  test_pass_rate * 0.6 +
  code_quality_score * 0.2 +
  keystroke_pattern_score * 0.2 -
  timing_anomalies * 5
)

Passing Threshold: 85%
```

### Fraud Detection Flags

| Flag | Condition | Impact |
|------|-----------|--------|
| `TIMING_ANOMALIES_DETECTED` | >3 suspicious gaps | -15 points |
| `ABNORMAL_KEYSTROKE_PATTERN` | Keystroke score < 50 | -20 points |
| `EXTERNAL_ASSISTANCE_SUSPECTED` | Window switching detected | -25 points |
| `EXCESSIVE_PASTE_OPERATIONS` | >5 paste events | -10 points |

### API Endpoints

#### Start Code Lab
```bash
POST /api/v1/assessment/tier2/start

Request:
{
  "sessionId": "assessment_123",
  "challengeId": "nodejs-api-debug"
}

Response:
{
  "success": true,
  "message": "Sandbox environment initialized. Begin coding.",
  "sandbox": {
    "sessionId": "sandbox_abc123",
    "challengeId": "nodejs-api-debug",
    "startedAt": "2026-07-19T20:00:00Z"
  },
  "instructions": [
    "1. Debug the broken code provided",
    "2. Refactor for better quality",
    "3. Pass all test cases",
    "4. Submit when ready"
  ],
  "submitEndpoint": "POST /api/v1/assessment/tier2/submit"
}
```

#### Submit Solution
```bash
POST /api/v1/assessment/tier2/submit

Request:
{
  "sessionId": "assessment_123",
  "sandboxSessionId": "sandbox_abc123",
  "codeSubmitted": "const apiHandler = (req, res) => {...}",
  "executionLogs": {
    "keystrokes": [...],
    "timestamps": [...],
    "focusEvents": [...],
    "pasteEvents": [...]
  }
}

Response (Pass):
{
  "success": true,
  "message": "Tier 2 passed! Proceed to Tier 3: AI Technical Viva",
  "result": {
    "tier": "TIER_2_CODE_LAB",
    "passed": true,
    "score": 92,
    "testsPassed": 9,
    "totalTests": 10,
    "executionTime": 1847,
    "flags": []
  }
}
```

---

## 🎥 Tier 3: AI Technical Viva

### What It Verifies

#### 1. **Code Authorship**
Candidate must explain their Tier 2 code:
- "Why did you choose this approach?"
- "What edge cases did you consider?"
- "How would you optimize this?"
- "Explain the time/space complexity"
- "What bugs might exist?"

**Dynamic Questions**: Generated by GPT-4 based on actual code written

#### 2. **Biometric Verification**
Matches video to government ID:
- **Face matching**: Compare with Smile ID biometric photo
- **Liveness detection**: Natural micro-movements, blinking
- **No deepfakes**: Detects synthetic faces

#### 3. **Voice Pattern Analysis**
Cross-checks with Smile ID voice:
- Voice fingerprint matching
- Audio consistency analysis
- Multiple voice detection

#### 4. **Third-Party Assistance Detection**
- **Multiple faces**: >1 person in frame = fail
- **Eye movement**: Reading from another screen = suspicious
- **Off-screen glances**: Consistent eye direction = external help

### Scoring Algorithm

```typescript
Tier 3 Score = (
  technical_answer_quality * 0.5 +
  biometric_match_score * 0.3 +
  voice_pattern_score * 0.2 -
  (assistance_detected ? 30 : 0) -
  deepfake_risk * 20
)

Passing Threshold: 90%
```

### Fraud Detection Flags

| Flag | Condition | Impact |
|------|-----------|--------|
| `THIRD_PARTY_ASSISTANCE_DETECTED` | Multiple faces or suspicious eye movement | -30 points |
| `DEEPFAKE_RISK_HIGH` | Deepfake score > 0.5 | -20 points |
| `VOICE_PATTERN_MISMATCH` | Voice doesn't match ID | -25 points |
| `MULTIPLE_PEOPLE_IN_FRAME` | >1 face detected | Auto-fail |

### API Endpoints

#### Start AI Viva
```bash
POST /api/v1/assessment/tier3/start

Request:
{
  "sessionId": "assessment_123",
  "tier2Code": "const apiHandler = (req, res) => {...}"
}

Response:
{
  "success": true,
  "message": "AI Viva session initialized. Start video interview.",
  "viva": {
    "vivaSessionId": "viva_xyz789",
    "questionCount": 5,
    "durationMinutes": 10,
    "startedAt": "2026-07-19T20:30:00Z"
  },
  "biometricRequirements": [
    "Face must be visible at all times",
    "No multiple people in frame",
    "No deepfake or virtual backgrounds",
    "Clear audio required"
  ]
}
```

#### Submit Video Interview
```bash
POST /api/v1/assessment/tier3/submit

Request:
{
  "sessionId": "assessment_123",
  "vivaSessionId": "viva_xyz789",
  "videoAnalysis": {
    "transcripts": [...],
    "faceFrames": [...],
    "audioData": [...],
    "eyeTracking": [...]
  }
}

Response (Pass - Passport Issued):
{
  "success": true,
  "message": "Congratulations! All three tiers passed. VettedME Passport issued!",
  "result": {
    "tier": "TIER_3_AI_VIVA",
    "passed": true,
    "score": 94,
    "technicalScore": 88,
    "biometricMatchScore": 95,
    "flags": []
  },
  "passport": {
    "issued": true,
    "trustScore": 91,
    "passportUrl": "https://vettedme.com/talent/user-123"
  },
  "nextSteps": [
    "Your VettedME Passport is now active",
    "You can apply for high-value B2B contracts",
    "Western buyers can verify your skills instantly"
  ]
}
```

---

## 📊 Overall Trust Score Calculation

After passing all three tiers, the **overall trust score** is calculated:

```typescript
Overall Trust Score = (
  tier1_score * 0.20 +
  tier2_score * 0.40 +
  tier3_score * 0.40
)

Range: 0-100
```

### Score Interpretation

| Score | Level | Description |
|-------|-------|-------------|
| 90-100 | Elite | Top 5% of developers |
| 80-89 | Excellent | Highly skilled and verified |
| 70-79 | Good | Competent with minor gaps |
| <70 | Failed | Did not pass assessment |

---

## 🛡️ Anti-Fraud Mechanisms Summary

| Fraud Type | Detection Method | Tier |
|------------|------------------|------|
| AI-generated portfolio | Code pattern analysis | Tier 1 |
| Copy-pasted projects | Similarity detection | Tier 1 |
| Portfolio stuffing | Temporal analysis | Tier 1 |
| Outsourced coding | Keystroke patterns | Tier 2 |
| AI wrapper assistance | Timing anomalies | Tier 2 |
| External help | Window switching | Tier 2 |
| Deepfake interview | Liveness detection | Tier 3 |
| Voice impersonation | Voice fingerprinting | Tier 3 |
| Third-party assistance | Multi-face detection | Tier 3 |
| Reading from notes | Eye tracking | Tier 3 |

---

## 🔗 Integration with VettedPay

Once a developer **passes all three tiers** and receives a **VettedME Passport**:

1. **Passport Issued**: `VettedMEPassport.skillVerificationStatus = VERIFIED`
2. **Trust Score Recorded**: `VettedMEPassport.overallSkillScore = 91`
3. **Public URL Generated**: `https://vettedme.com/talent/user-123`
4. **VettedPay Eligibility**: Developer can now receive milestone payments
5. **Biometric Handshake Required**: Payment release requires live biometric check

---

## 📈 Business Impact

### For Talent
- **Un-fakeable Credential**: Cannot be faked or bought
- **Global Credibility**: Trusted by Western enterprises
- **Higher Rates**: Verified talent commands 30%+ premiums
- **Instant Trust**: No need for multiple interviews

### For Buyers
- **Zero Risk**: Only verified, skilled developers
- **Time Savings**: No wasted interviews with fraudsters
- **Quality Guarantee**: Three-tier validation ensures competence
- **Compliance**: Biometric verification meets KYC standards

### For VETTED
- **Defensible Moat**: 3+ months to replicate this system
- **Network Effects**: More verified talent → more buyers → more talent
- **Data Advantage**: Fraud patterns improve detection over time
- **Premium Pricing**: $200/verification (paid by talent or buyer)

---

## 🚀 Roadmap

### Phase 1 (Current)
- ✅ Three-tier assessment engine
- ✅ GitHub/GitLab integration
- ✅ Sandbox code execution
- ✅ AI-powered interview questions

### Phase 2 (Next 3 Months)
- [ ] Actual sandbox Docker execution
- [ ] Face recognition API integration (AWS Rekognition)
- [ ] Voice biometrics (Pindrop/Nuance)
- [ ] Deepfake detection model
- [ ] Challenge database (50+ coding scenarios)

### Phase 3 (6 Months)
- [ ] Multi-language support (Python, Java, Go, Rust)
- [ ] Live pair programming challenges
- [ ] System design assessments
- [ ] Team collaboration evaluation
- [ ] Mobile app for biometric checks

---

**The Skill Assessment Engine is VETTED's core competitive advantage. It makes resume fraud technologically impossible.**