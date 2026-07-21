# VettedME AI Technical Viva - Tier 3 Assessment

## 🎥 Biometrically-Monitored Technical Interview

The **AI Technical Viva** is the final tier of verification where developers answer dynamic technical questions on camera while AI analyzes their biometric patterns, voice consistency, and behavioral signals for authenticity. This is the ultimate anti-deepfake, anti-cheat assessment.

---

## ✅ What Was Built

### **Files Created**

1. **`src/components/ui/card.tsx`** - Card component (shadcn/ui)
2. **`src/components/BiometricVideoFeed.tsx`** - Camera feed with biometric overlays
3. **`src/components/QuestionCard.tsx`** - Dynamic question display with text-to-speech
4. **`src/app/talent/assessment/viva/page.tsx`** - Main viva interface
5. **`AI_VIVA.md`** - Complete documentation

---

## 🎨 UI Layout

### **Split Display Design**

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Progress | Question N/5 | 🔴 RECORDING            │
├────────────────────────────────────┬────────────────────────┤
│                                    │                        │
│  MAIN AREA (2/3 width)             │  SIDEBAR (1/3 width)   │
│                                    │                        │
│ ┌────────────────────────────────┐ │ ┌────────────────────┐│
│ │ Question Card                  │ │ │ Biometric Video    ││
│ │                                │ │ │ Feed               ││
│ │ Category: Code Review          │ │ │                    ││
│ │ Difficulty: [Medium]           │ │ │ [Camera Stream]    ││
│ │                                │ │ │                    ││
│ │ Thinking Time: 30s             │ │ │ ┌─────────────┐   ││
│ │ [████████░░░░░░]               │ │ │ │Face Detected│   ││
│ │                                │ │ │ └─────────────┘   ││
│ │ ┌────────────────────────────┐ │ │ │                    ││
│ │ │ "Looking at the code you   │ │ │ │ [Face Frame]       ││
│ │ │  wrote in the previous     │ │ │ │                    ││
│ │ │  challenge..."             │ │ │ └────────────────────┘│
│ │ │                            │ │ │ ┌────────────────────┐│
│ │ │ [🔊 Replay Question]       │ │ │ │ Biometric Status   ││
│ │ └────────────────────────────┘ │ │ │ ✅ Face OK         ││
│ │                                │ │ │ ✅ Eye Contact: 85%││
│ │ 💭 Thinking Time: Use this    │ │ │ ✅ Single Face     ││
│ │    time to structure answer   │ │ │ ✅ Lighting: Good  ││
│ └────────────────────────────────┘ │ └────────────────────┘│
│                                    │ ┌────────────────────┐│
│ ┌────────────────────────────────┐ │ │ ⚠️ Active Warnings ││
│ │ ✅ Completed Questions         │ │ │ (if any)           ││
│ │ [Q1] [Q2] [Q3]                 │ │ └────────────────────┘│
│ └────────────────────────────────┘ │ ┌────────────────────┐│
│                                    │ │ 💡 Tips            ││
│                                    │ │ • Speak clearly    ││
│                                    │ │ • Look at camera   ││
│                                    │ └────────────────────┘│
│                                    │ ┌────────────────────┐│
│                                    │ │ Questions List     ││
│                                    │ │ ◉ Q1 (Active)      ││
│                                    │ │ ⭕ Q2 (Pending)    ││
│                                    │ └────────────────────┘│
└────────────────────────────────────┴────────────────────────┘
```

---

## 🎯 Key Features

### **1. Start Screen**

Before starting, candidates see an overview:

```
┌─────────────────────────────────────────┐
│         🎥                              │
│   AI Technical Viva - Tier 3           │
│                                         │
│ 🛡️ Biometric Monitoring                │
│   Your video/audio will be recorded.   │
│   AI analyzes facial patterns, voice,  │
│   and eye movements for authenticity.  │
│                                         │
│ 🎥 Dynamic Questions                   │
│   5 AI-generated questions about       │
│   your Tier 2 code. Questions read     │
│   aloud via text-to-speech.            │
│                                         │
│ ⚠️ Anti-Cheat Detection                │
│   Looking away, multiple faces, or     │
│   AI assistance will be flagged.       │
│                                         │
│ Assessment Format:                      │
│ • 5 questions total                    │
│ • 20-45s thinking time                 │
│ • 60-120s answer time                  │
│ • Total time: ~15 minutes              │
│                                         │
│ [Start AI Viva Assessment]             │
└─────────────────────────────────────────┘
```

---

### **2. Biometric Video Feed**

Top-right corner camera stream with overlays:

```
┌─────────────────────────┐
│ 🔴 RECORDING            │ <- Red badge when recording
│                         │
│   [Video Stream]        │
│   (Mirrored)            │
│                         │
│   ┌───────────────┐    │ <- Green face frame
│   │               │    │    (animated corners)
│   │  [Your Face]  │    │
│   │               │    │
│   └───────────────┘    │
│                         │
│        Face Detected    │ <- Status badge
└─────────────────────────┘
```

**Features:**
- Live camera stream
- Mirrored display (natural for user)
- Face detection frame (green borders)
- Corner guides (L-shaped markers)
- Recording indicator
- Auto-start when assessment begins

**Biometric Overlays:**
```
Face Frame: Green rectangle
- Animates when face detected
- Tracks face position
- Shows detection confidence

Warning Overlays:
🚨 Multiple faces detected!
⚠️ Please face the camera directly.
```

---

### **3. Biometric Status Panel**

Real-time biometric signals:

```
┌──────────────────────────────┐
│ Biometric Status             │
├──────────────────────────────┤
│ ✅ Face OK                   │
│    Face detected & centered  │
├──────────────────────────────┤
│ ✅ Eye Contact: 85%          │
│    Good engagement level     │
├──────────────────────────────┤
│ ✅ Single Face               │
│    No other persons detected │
├──────────────────────────────┤
│ ✅ Lighting: Good            │
│    Adequate visibility       │
└──────────────────────────────┘
```

**Status Types:**
- **Green**: All good
- **Yellow**: Warning (low eye contact, acceptable lighting)
- **Red**: Critical (no face, multiple faces, poor lighting)

**Tracked Signals:**
```typescript
interface BiometricSignals {
  faceDetected: boolean;       // Is a face visible?
  facingCamera: boolean;       // Looking at camera?
  multipleFaces: boolean;      // Other people present?
  eyeContact: number;          // 0-100%
  lightingQuality: "good" | "poor" | "acceptable";
  suspiciousActivity: boolean; // Unusual behavior?
}
```

---

### **4. Question Card**

Dynamic question display with phases:

```
┌─────────────────────────────────────────┐
│ 📝 Question 2          [Code Review]    │
│                              [Medium]    │
├─────────────────────────────────────────┤
│ Thinking Time: 30s                      │
│ [████████████████████░░░░░░░] 75%      │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ "Looking at the code you wrote in   │ │
│ │  the previous challenge, explain    │ │
│ │  why you chose to structure the     │ │
│ │  discount calculation the way you   │ │
│ │  did..."                            │ │
│ │                                     │ │
│ │ [🔊 Replay Question]  [●●●]        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 💭 Thinking Time: Use this time to     │
│    structure your answer. Recording    │
│    starts automatically when answering │
│    begins.                             │
└─────────────────────────────────────────┘
```

**Question Phases:**

**Phase 1: Loading**
```
Status: Loading question...
[Spinning loader]
```

**Phase 2: Thinking (30-45s)**
```
Status: Thinking Time: 30s
[Blue progress bar]
💭 Use this time to structure your answer.
```

**Phase 3: Answering (60-120s)**
```
Status: Answer Now: 90s
[Green progress bar]
🎤 Recording Now: Speak clearly and explain
   your reasoning. Your answer is being
   analyzed for technical accuracy.
```

**Phase 4: Complete**
```
Status: Complete
✅ Your answer has been recorded.
   Moving to next question...
```

---

### **5. Text-to-Speech Integration**

Questions are read aloud automatically:

```javascript
// Web Speech API
const utterance = new SpeechSynthesisUtterance(question.text);
utterance.rate = 0.9;    // Slightly slower for clarity
utterance.pitch = 1.0;   // Normal pitch
utterance.volume = 1.0;  // Full volume

window.speechSynthesis.speak(utterance);
```

**Visual Indicator:**
```
[🔊 Replay Question]  [●●●]
                       ↑
              Audio wave animation
```

**Fallback:**
If Web Speech API unavailable, simulate reading time (2 words/second).

---

### **6. Progress Tracking**

```
Overall Progress: 60%
[████████████████████░░░░░░░░░░]

Question 3 / 5
```

**Completed Questions Badge:**
```
✅ Completed Questions
[Q1] [Q2] [Q3]
```

---

### **7. Warning System**

Active warnings appear when biometric signals degrade:

```
┌─────────────────────────────────┐
│ ⚠️ Active Warnings              │
├─────────────────────────────────┤
│ • Face not detected             │
│ • Not facing camera             │
│ • Low eye contact               │
└─────────────────────────────────┘
```

**Warning Triggers:**
- Face not detected for >2 seconds
- Multiple faces detected
- Eye contact < 50%
- Looking away for >5 seconds
- Poor lighting
- Suspicious activity (window switching, etc.)

---

## 🎤 Example Questions

### **Question 1: Code Review**
**Category:** Code Review  
**Difficulty:** Medium  
**Thinking:** 30s | **Answering:** 90s

"Looking at the code you wrote in the previous challenge, explain why you chose to structure the discount calculation the way you did. What are the potential edge cases you accounted for?"

---

### **Question 2: Algorithm Design**
**Category:** Algorithm Design  
**Difficulty:** Hard  
**Thinking:** 45s | **Answering:** 120s

"If the e-commerce system needed to handle 10,000 simultaneous discount calculations per second, how would you optimize your code for performance? Discuss time and space complexity."

---

### **Question 3: System Design**
**Category:** System Design  
**Difficulty:** Hard  
**Thinking:** 45s | **Answering:** 120s

"Describe how you would implement a distributed caching layer for frequently-used discount codes across multiple data centers. What consistency model would you choose and why?"

---

### **Question 4: Debugging**
**Category:** Debugging  
**Difficulty:** Easy  
**Thinking:** 20s | **Answering:** 60s

"Walk me through your debugging process when you encountered the off-by-one error in the loop. What mental model do you use to catch these types of bugs?"

---

### **Question 5: Best Practices**
**Category:** Best Practices  
**Difficulty:** Medium  
**Thinking:** 30s | **Answering:** 90s

"Your code currently has no input validation. What security vulnerabilities does this create, and how would you implement proper validation without sacrificing performance?"

---

## 🔒 Security & Fraud Detection

### **Biometric Analysis**

**Face Detection:**
```
- Real-time face tracking
- Position verification
- Expression analysis
- Liveness detection (blink rate, micro-movements)
```

**Voice Analysis:**
```
- Voice pattern matching (vs Tier 2 biometric)
- Pitch consistency
- Speech rate analysis
- Background noise detection
```

**Eye Tracking:**
```
- Gaze direction
- Eye contact percentage
- Reading patterns (looking at notes?)
- Screen reflection detection
```

---

### **Behavioral Flags**

```typescript
interface FraudSignals {
  // Visual
  multipleFaces: boolean;        // Someone else present
  faceLookingAway: number;       // Seconds not facing camera
  eyeContactLow: boolean;        // < 50% eye contact
  suspiciousMovement: boolean;   // Unusual patterns
  
  // Audio
  backgroundVoices: boolean;     // Other people talking
  voiceMismatch: boolean;        // Different from Tier 2
  unnatural Speech: boolean;     // TTS-like patterns
  
  // Behavioral
  windowSwitches: number;        // Tab switching
  copyPasteDetected: boolean;    // Reading from screen
  repeatedPhrases: boolean;      // Scripted answers
  responseDelay: number;         // Time to start answering
}
```

**Auto-Flagging:**
```
if (signals.multipleFaces) {
  FLAG: "Multiple people detected"
}

if (signals.eyeContactLow && signals.windowSwitches > 5) {
  FLAG: "Likely reading from external source"
}

if (signals.voiceMismatch) {
  FLAG: "Voice pattern doesn't match biometric"
}
```

---

## 📊 Data Flow

### **1. Start Assessment**
```typescript
POST /api/v1/vettedme/assessment/viva/start
{
  userId: "abc123",
  tier2ChallengeId: "tier2-001"
}

Response: {
  sessionId: "viva-session-xyz",
  questions: [...],
  totalTime: 900 // seconds
}
```

### **2. Record Answer**
```typescript
POST /api/v1/vettedme/assessment/viva/answer
{
  sessionId: "viva-session-xyz",
  questionId: "q1",
  audioBlob: <base64>,
  videoBlob: <base64>,
  duration: 87, // seconds
  biometricSignals: {...}
}

Response: {
  success: true,
  nextQuestion: "q2"
}
```

### **3. Complete Assessment**
```typescript
POST /api/v1/vettedme/assessment/viva/complete
{
  sessionId: "viva-session-xyz",
  answers: [
    { questionId, audioUrl, videoUrl, score }
  ],
  biometricReport: {...}
}

Response: {
  status: "PASSED" | "FAILED" | "MANUAL_REVIEW",
  tier3Score: 88,
  overallScore: 87, // Avg of all 3 tiers
  passportStatus: "APPROVED" | "PENDING" | "REJECTED"
}
```

---

## 🎯 Scoring System

### **Technical Score (60%)**
```
- Answer relevance: 20 points
- Technical accuracy: 20 points
- Explanation clarity: 20 points
Total: 60 points
```

### **Biometric Score (40%)**
```
- Face detection: 10 points
- Eye contact: 10 points
- Voice consistency: 10 points
- No cheating flags: 10 points
Total: 40 points
```

**Pass Criteria:**
- Technical: ≥ 70% (42/60)
- Biometric: ≥ 80% (32/40)
- Overall: ≥ 75% (75/100)

---

## 🚀 User Journey

```
Tier 2: Code Lab (PASSED)
         ↓
[Start Tier 3: AI Viva]
         ↓
Instruction Screen
- Read overview
- Understand format
         ↓
[Start Assessment]
         ↓
Camera Initialization
- Grant permissions
- Test biometric feed
         ↓
For each question (5 total):
  1. Question loads
  2. Text-to-speech reads question
  3. Thinking time (20-45s)
  4. Recording starts (60-120s)
  5. Answer verbally
  6. Move to next
         ↓
Assessment Complete
- Final score calculated
- Biometric report generated
         ↓
VettedME Passport Issued
✅ VERIFIED
```

---

## 📱 Responsive Design

### **Desktop (>1024px)**
- Split layout (2/3 main, 1/3 sidebar)
- Full video feed
- All panels visible

### **Tablet (768-1024px)**
- Stacked layout
- Smaller video feed
- Collapsible sidebar

### **Mobile (<768px)**
- Single column
- Minimal video feed
- Not recommended for assessment

---

**The AI Technical Viva is complete! This is the final gauntlet - biometric monitoring, anti-deepfake detection, and dynamic technical questions ensure only legitimate, skilled developers earn the VettedME Trust Passport.**

Ready for **Prompt 6** when you are!
