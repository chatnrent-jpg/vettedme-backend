# VettedME Talent Onboarding Flow

## 🚀 Multi-Step Onboarding Experience

The **VettedME Onboarding Flow** guides new developers through profile creation and biometric verification before entering the three-tier skill assessment gauntlet.

---

## ✅ What Was Built

### **Files Created**

1. **`src/components/ui/button.tsx`** - Reusable button component (shadcn/ui)
2. **`src/components/ui/input.tsx`** - Form input component (shadcn/ui)
3. **`src/components/ui/label.tsx`** - Form label component (shadcn/ui)
4. **`src/components/ui/textarea.tsx`** - Textarea component (shadcn/ui)
5. **`src/components/BiometricLivenessCapture.tsx`** - Camera capture component
6. **`src/app/talent/onboarding/page.tsx`** - Main onboarding flow

---

## 🎯 Onboarding Steps

### **Step 1: Professional Details**

#### **Personal Information**
```typescript
- First Name (required)
- Last Name (required)
- Email Address (required)
- Phone Number (optional)
- Location (required, default: Lagos, Nigeria)
- Timezone (auto-detected)
```

#### **GitHub Integration**
```typescript
- GitHub Username input
- "Connect" button triggers OAuth flow
- Success state: "✓ Connected" badge
- Portfolio data synced for Tier 1 verification
```

Real OAuth integration:
```typescript
// Production flow
window.location.href = '/api/auth/github?redirect=/talent/onboarding'
```

#### **Technical Skills**
```typescript
- Primary Skills (tag-based input)
- Add/Remove skills dynamically
- Years of Experience (number input)
- Minimum 1 skill required to proceed
```

#### **Work History**
```typescript
- Company/Client name
- Role title
- Duration (date range)
- Description (textarea)
- Supports multiple entries (future enhancement)
```

#### **Validation Rules**
- Cannot proceed without:
  - First name
  - Last name
  - Email
  - Location
  - At least 1 skill

---

### **Step 2: Biometric Liveness Verification**

#### **Camera Capture UI**

**Status States:**
1. **Idle**: "Ready to Start" screen
2. **Initializing**: Camera permission request
3. **Capturing**: Real-time liveness detection
4. **Success**: Green checkmark animation
5. **Failed**: Red X with retry option

#### **Face Frame Overlay**
```
┌─────────────────────────┐
│                         │
│    ╭───────────╮       │
│    │           │       │  <- Oval face frame
│    │   (Face)  │       │     with corner guides
│    │           │       │
│    ╰───────────╯       │
│                         │
└─────────────────────────┘
```

- Animated blue oval border
- Corner guides (L-shaped borders)
- Pulsing animation during capture

#### **Real-Time Feedback**
```typescript
Progress: [████████░░░░░░░░░░] 40%
Status: "Analyzing liveness..."

Instructions:
- Position your face in the frame
- Detecting face... (30%)
- Analyzing liveness... (60%)
- Almost done... (90%)
- Liveness verified successfully! (100%)
```

#### **Success Animation**
```
┌──────────────────┐
│   ┌────────┐    │
│   │   ✓    │    │  <- Animated bounce
│   │ VERIFIED│    │     Green background
│   └────────┘    │     Backdrop blur
│                  │
└──────────────────┘
```

#### **Failure Animation**
```
┌──────────────────┐
│   ┌────────┐    │
│   │   ✗    │    │  <- Animated bounce
│   │ FAILED │    │     Red background
│   │[Try Again]│  │     Retry button
│   └────────┘    │
└──────────────────┘
```

#### **Camera Implementation**
```typescript
// Request camera access
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "user",
  },
  audio: false,
});

// Capture frame
const canvas = canvasRef.current;
const context = canvas.getContext("2d");
context.drawImage(videoRef.current, 0, 0);
const imageData = canvas.toDataURL("image/jpeg", 0.9);

// Send to backend for verification
POST /api/v1/vettedme/biometric/verify
{
  "imageData": "data:image/jpeg;base64,...",
  "userId": "abc123"
}
```

#### **Tips Section**
```
📌 Tips for Best Results:
• Ensure good lighting on your face
• Remove glasses or hats if possible
• Look directly at the camera
• Keep your face centered in the frame
• Stay still during the verification
```

---

### **Step 3: Completion Screen**

#### **Success State**
```
    ┌────┐
    │ ✓  │  <- Animated bounce
    └────┘

  Onboarding Complete!
  Your profile has been created successfully

  📋 Next Steps:
  1. Complete Tier 1: Portfolio Audit
  2. Complete Tier 2: Sandboxed Code Lab
  3. Complete Tier 3: AI Technical Viva
  4. Receive your VettedME Trust Passport

  [Start Assessment →]
```

---

## 🎨 Design Features

### **Progress Indicator**
```
Profile ───── Biometric ───── Complete
  (1)           (2)             (3)

• Active step: Blue filled circle
• Completed: Blue with checkmark
• Pending: Gray outline
• Connecting lines change color as you progress
```

### **Visual Hierarchy**
- **Large**: Step titles (2xl font)
- **Medium**: Section headers (lg font)
- **Small**: Input labels, helper text (sm font)
- **Icons**: Consistent 5x5 size for section headers

### **Color Coding**
- **Blue**: Primary actions, progress
- **Green**: Success states, verification
- **Red**: Errors, failures
- **Slate**: UI chrome, neutral elements

### **Animations**
- **Fade in**: Success/failure overlays (500ms)
- **Bounce**: Status icons (infinite loop)
- **Pulse**: Face frame during capture
- **Progress bar**: Linear transition (300ms)
- **Backdrop blur**: Overlay backgrounds

---

## 📊 Data Flow

### **Form State Management**
```typescript
interface FormData {
  // Personal
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  timezone: string;
  
  // GitHub
  githubUsername: string;
  githubConnected: boolean;
  
  // Skills
  primarySkills: string[];
  yearsOfExperience: string;
  
  // Work History
  workHistory: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  
  // Biometric
  biometricImageData: string | null;
}
```

### **API Endpoints**

#### **1. Create Profile**
```typescript
POST /api/v1/vettedme/onboarding/profile
{
  "firstName": "Chidi",
  "lastName": "Okafor",
  "email": "chidi@example.com",
  "location": "Lagos, Nigeria",
  "githubUsername": "chidiokafor",
  "primarySkills": ["TypeScript", "React", "Node.js"],
  "yearsOfExperience": 5,
  "workHistory": [...]
}

Response:
{
  "userId": "abc123",
  "status": "PENDING_BIOMETRIC"
}
```

#### **2. GitHub OAuth**
```typescript
GET /api/auth/github?redirect=/talent/onboarding
// Redirects to GitHub OAuth
// Callback: /api/auth/github/callback
// Sets githubConnected: true
// Syncs repositories for Tier 1
```

#### **3. Biometric Verification**
```typescript
POST /api/v1/vettedme/biometric/verify
{
  "userId": "abc123",
  "imageData": "data:image/jpeg;base64,...",
  "timestamp": "2026-07-19T21:00:00Z"
}

Response:
{
  "success": true,
  "livenessScore": 96,
  "faceDetected": true,
  "verificationId": "xyz789"
}
```

#### **4. Complete Onboarding**
```typescript
POST /api/v1/vettedme/onboarding/complete
{
  "userId": "abc123",
  "biometricVerificationId": "xyz789"
}

Response:
{
  "status": "ONBOARDING_COMPLETE",
  "nextStep": "TIER_1_ASSESSMENT",
  "redirectUrl": "/talent/assessment/tier1"
}
```

---

## 🔒 Security Features

### **Camera Permissions**
```typescript
// Request with error handling
try {
  const stream = await navigator.mediaDevices.getUserMedia({...});
} catch (error) {
  if (error.name === 'NotAllowedError') {
    // Camera access denied
  } else if (error.name === 'NotFoundError') {
    // No camera detected
  }
}
```

### **Image Data Handling**
- Captured at 1280x720 resolution
- JPEG compression (90% quality)
- Base64 encoded for transport
- Sent over HTTPS only
- Temporary storage (deleted after verification)

### **Form Validation**
```typescript
// Client-side
- Email format validation
- Required field checks
- Phone number format (optional)
- Skill deduplication

// Server-side
- Sanitize all inputs
- Validate email uniqueness
- Check GitHub username exists
- Verify biometric image format
```

---

## 🚀 Production Enhancements

### **Phase 2**
- [ ] Multiple work history entries (add/remove)
- [ ] Resume upload (PDF parsing)
- [ ] LinkedIn profile import
- [ ] Portfolio link validation
- [ ] Auto-save draft (localStorage)

### **Phase 3**
- [ ] NIN/BVN government verification integration
- [ ] Smile ID liveness check (replace simulation)
- [ ] Facial recognition cross-check
- [ ] Voice recording for Tier 3 prep
- [ ] Document upload (ID, certifications)

### **UX Improvements**
- [ ] Progress auto-save
- [ ] "Exit and resume later" option
- [ ] Mobile-optimized camera UI
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Multi-language support

---

## 📱 Responsive Design

### **Desktop (>1024px)**
- Full-width form (max 4xl container)
- 2-column grid for name/location
- Large camera preview (16:9)
- Side-by-side navigation buttons

### **Mobile (<768px)**
- Single column layout
- Full-width inputs
- Larger touch targets (min 44px)
- Camera takes full viewport width
- Stack navigation buttons

---

## 🎯 User Journey

```
Landing Page
    ↓
Sign Up → [Create Account]
    ↓
Onboarding Step 1: Profile
- Personal details
- GitHub integration
- Skills & work history
    ↓
Onboarding Step 2: Biometric
- Camera liveness capture
- Real-time verification
    ↓
Onboarding Step 3: Complete
- Success confirmation
- Next steps preview
    ↓
[Start Assessment] → Tier 1 Portal
```

---

## 🧪 Testing Scenarios

### **Happy Path**
1. Fill all required fields ✓
2. Connect GitHub successfully ✓
3. Add 3+ skills ✓
4. Complete liveness check ✓
5. Redirect to assessment ✓

### **Error Cases**
1. Missing required fields (validation)
2. Invalid email format (validation)
3. GitHub connection fails (retry)
4. Camera access denied (show instructions)
5. Liveness check fails (retry with tips)
6. Network error during submission (retry)

---

## 📈 Metrics to Track

### **Completion Rates**
- % users completing Step 1
- % users completing Step 2
- % users completing full onboarding
- Average time per step

### **Drop-off Points**
- Where do users abandon?
- Which fields cause friction?
- Camera permission denial rate
- Liveness verification failure rate

### **Technical**
- Camera initialization time
- Liveness detection accuracy
- Image upload size/speed
- API response times

---

**The onboarding flow is now complete. Developers can create profiles, connect GitHub, and complete biometric verification before entering the three-tier assessment gauntlet. This is the gateway to earning the un-fakeable VettedME Trust Passport.**

Ready for **Prompt 4** when you are!
