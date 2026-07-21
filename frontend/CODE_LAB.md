# VettedME Code Lab - Tier 2 Assessment

## 🧪 Sandboxed Technical Evaluation Environment

The **Code Lab** is where developers prove their technical skills by fixing broken code, implementing features, and passing test suites in real-time. This is Tier 2 of the VettedME verification gauntlet.

---

## ✅ What Was Built

### **Files Created**

1. **`src/components/ui/separator.tsx`** - Divider component (shadcn/ui)
2. **`src/components/ui/scroll-area.tsx`** - Scrollable container (shadcn/ui)
3. **`src/components/CountdownTimer.tsx`** - Live countdown timer with progress bar
4. **`src/components/TestChecklist.tsx`** - Live test suite tracker with status badges
5. **`src/components/CodeEditor.tsx`** - Monaco Editor wrapper (VS Code editor)
6. **`src/app/talent/assessment/code-lab/page.tsx`** - Main code lab interface
7. **`CODE_LAB.md`** - Complete documentation

### **Dependencies Required**
```bash
cd frontend
npm install monaco-editor @monaco-editor/react @radix-ui/react-scroll-area
```

---

## 🎨 UI Layout

### **Split-Pane Design**

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Challenge Title | Timer Banner | Actions           │
├───────────────────┬─────────────────────────────────────────┤
│                   │                                         │
│  LEFT PANE        │         RIGHT PANE                      │
│  (1/3 width)      │         (2/3 width)                     │
│                   │                                         │
│ ┌───────────────┐ │ ┌───────────────────────────────────┐ │
│ │ Requirements  │ │ │                                   │ │
│ │ (Markdown)    │ │ │      Monaco Code Editor           │ │
│ │               │ │ │      (VS Code style)              │ │
│ │ - Task desc   │ │ │                                   │ │
│ │ - Examples    │ │ │   JavaScript/TypeScript           │ │
│ │ - Tips        │ │ │   Syntax highlighting             │ │
│ │               │ │ │   Auto-complete                   │ │
│ └───────────────┘ │ │                                   │ │
│ ─────────────────  │ └───────────────────────────────────┘ │
│ ┌───────────────┐ │ ┌───────────────────────────────────┐ │
│ │ Test Cases    │ │ │   Console Output                  │ │
│ │               │ │ │   (Terminal style)                │ │
│ │ ✅ Test 1     │ │ │                                   │ │
│ │ ❌ Test 2     │ │ │   🔄 Running tests...            │ │
│ │ ⭕ Test 3     │ │ │   ✅ Test 1: PASSED              │ │
│ │ ⭕ Test 4     │ │ │   ❌ Test 2: FAILED              │ │
│ │               │ │ │                                   │ │
│ │ Progress: 50% │ │ └───────────────────────────────────┘ │
│ └───────────────┘ │ ┌───────────────────────────────────┐ │
│                   │ │  [Execute Code Suite] Button      │ │
│                   │ └───────────────────────────────────┘ │
└───────────────────┴─────────────────────────────────────────┘
```

---

## 🎯 Key Features

### **1. Countdown Timer Banner**

```
┌─────────────────────────────────────────────────┐
│ ⏰ Time Remaining        45:00                  │
│ [████████████████████████████░░░░░░░] 75%      │
└─────────────────────────────────────────────────┘

Color States:
- Blue (>50% time): Normal
- Yellow (25-50% time): Warning
- Orange (10-25% time): Urgent
- Red (<10% time): Critical + Alert
```

**Features:**
- Live countdown (updates every second)
- Color-coded progress bar
- Warning alerts at 25% remaining
- Auto-submit when time expires
- Smooth transitions

---

### **2. Requirements Panel (Left Pane - Top)**

**Markdown Rendering:**
```markdown
# Challenge: E-Commerce Cart Calculator

## Your Task
Fix bugs and implement discount logic...

## Requirements
### 1. Basic Cart Functionality
- Calculate subtotal
- Apply quantity discounts

### 2. Coupon System
- SAVE10: 10% off
- SAVE20: 20% off

## Expected Behavior
```javascript
calculateTotal([...], "SAVE10")
// Returns: { subtotal, discount, tax, ... }
```
```

**Rendered as:**
- H1-H4 headings (styled hierarchy)
- Bullet points
- Code blocks (dark theme)
- Numbered lists
- Scrollable content

---

### **3. Test Checklist (Left Pane - Bottom)**

```
┌─────────────────────────────────────────┐
│ Test Suite Progress                     │
│ 3 / 8 tests passing                     │
│ [█████░░░░░░░░░░░] 37%                  │
│ Points: 40 / 100                        │
├─────────────────────────────────────────┤
│ ✅ Basic Cart Calculation        [15pts]│
│    Calculate subtotal correctly         │
│    Status: PASSED                       │
├─────────────────────────────────────────┤
│ ✅ Quantity Discount (5+ items)  [15pts]│
│    Apply 10% discount                   │
│    Status: PASSED                       │
├─────────────────────────────────────────┤
│ ❌ Quantity Discount (10+ items) [15pts]│
│    Apply 15% discount                   │
│    Status: FAILED                       │
├─────────────────────────────────────────┤
│ ⭕ Coupon Code: SAVE10           [10pts]│
│    Apply 10% coupon                     │
│    Status: PENDING                      │
└─────────────────────────────────────────┘
```

**Status Icons:**
- ✅ **Passed**: Green background, checkmark
- ❌ **Failed**: Red background, X mark
- 🔄 **Running**: Blue background, spinner
- ⭕ **Pending**: Gray background, empty circle

**Progress Tracking:**
- Visual progress bar
- Points earned / total points
- Percentage complete
- Real-time updates during test execution

---

### **4. Monaco Code Editor (Right Pane - Top)**

**Features:**
- Full VS Code editor experience
- Syntax highlighting
- Auto-completion
- Minimap
- Line numbers
- Dark theme
- Word wrap
- Real-time validation
- Read-only mode during test execution

**Keyboard Shortcuts:**
```
Ctrl+S: Save (custom binding)
Ctrl+Z: Undo
Ctrl+Y: Redo
Ctrl+F: Find
Ctrl+H: Replace
Ctrl+/: Toggle comment
```

**Language Support:**
- JavaScript
- TypeScript
- Python
- Go
- Rust
- Java

---

### **5. Console Output (Right Pane - Middle)**

```
┌─────────────────────────────────────────┐
│ 💻 Console Output            [Clear]    │
├─────────────────────────────────────────┤
│ 🚀 Code Lab initialized.                │
│ 💡 Tip: Read requirements carefully.    │
│                                         │
│ 🔄 Executing test suite...              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │
│ ✅ Basic Cart Calculation: PASSED       │
│ ✅ Quantity Discount (5+): PASSED       │
│ ❌ Quantity Discount (10+): FAILED      │
│ ⭕ Coupon SAVE10: RUNNING...            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │
│ 📊 Results: 5/8 tests passed            │
│ ⭐ Score: 65/100 points                 │
└─────────────────────────────────────────┘
```

**Features:**
- Terminal-style dark background
- Monospace font
- Color-coded messages
- Scrollable history
- Clear button
- Real-time test output
- Emoji indicators

---

### **6. Execute Code Suite Button (Right Pane - Bottom)**

```
┌─────────────────────────────────────────┐
│                                         │
│   [▶️ Execute Code Suite] (Full-width) │
│                                         │
└─────────────────────────────────────────┘

States:
- Normal: "▶️ Execute Code Suite"
- Running: "⏳ Running Tests..." (disabled)
- Complete: Back to normal
```

**Button Behavior:**
1. Click to start test execution
2. Disables editor (read-only)
3. Updates test checklist in real-time
4. Streams output to console
5. Shows final score
6. Re-enables editor

---

## 🔧 Example Challenge

### **E-Commerce Cart Discount Calculator**

**Difficulty:** Intermediate  
**Time Limit:** 45 minutes  
**Total Points:** 100

**Your Task:**
Fix bugs in the shopping cart calculator and implement discount logic.

**Starter Code:**
```javascript
// E-Commerce Cart Discount Calculator
// Fix the bugs and implement the missing features

function calculateTotal(items, couponCode = "") {
  // Bug 1: Subtotal calculation is incorrect
  let subtotal = 0;
  for (let i = 0; i <= items.length; i++) {
    subtotal += items[i].price * items[i].quantity;
  }
  
  // Bug 2: Discount logic is broken
  let discount = 0;
  if (items.length > 5) {
    discount = subtotal * 0.1;
  }
  
  // ... more broken code
}
```

**Test Cases:**
1. ✅ Basic Cart Calculation (15 pts)
2. ✅ Quantity-Based Discount (15 pts)
3. ❌ Coupon System (20 pts)
4. ⭕ Loyalty Points (15 pts)
5. ⭕ Tax Calculation (10 pts)

---

## 🚀 Installation

```bash
cd frontend
npm install monaco-editor @monaco-editor/react @radix-ui/react-scroll-area
```

---

**The Code Lab is now complete. This is where developers prove they can actually code - no faking, no cheating!**

Ready for **Prompt 5** when you are!
