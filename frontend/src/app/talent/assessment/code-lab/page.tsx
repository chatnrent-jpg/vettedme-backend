"use client";

import { useState } from "react";
import {
  Play,
  Save,
  RotateCcw,
  CheckCircle,
  Terminal,
  FileCode,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CountdownTimer } from "@/components/CountdownTimer";
import { TestChecklist, type TestCase } from "@/components/TestChecklist";
import { CodeEditor } from "@/components/CodeEditor";

// Mock challenge data
const CHALLENGE = {
  id: "tier2-001",
  title: "E-Commerce Cart Discount Calculator",
  difficulty: "Intermediate",
  timeLimit: 45, // minutes
  points: 100,
  description: `
# Challenge: E-Commerce Cart Discount Calculator

You've been hired to fix and enhance a broken e-commerce shopping cart discount system. The current implementation has bugs and missing features.

## Your Task

Fix the bugs and implement the missing discount logic in the \`calculateTotal()\` function.

## Requirements

### 1. Basic Cart Functionality
- Calculate subtotal correctly (sum of all item prices × quantities)
- Apply quantity-based discounts:
  - 10% off if total items >= 5
  - 15% off if total items >= 10

### 2. Coupon Code System
- Support the following coupon codes:
  - \`SAVE10\`: 10% off entire order
  - \`SAVE20\`: 20% off entire order
  - \`FREESHIP\`: Free shipping (normally $10)
- Invalid coupons should not cause errors

### 3. Loyalty Points
- Customers earn 1 point per $1 spent (after discounts)
- Points should be rounded down to nearest integer
- Minimum order: $10 to earn points

### 4. Tax Calculation
- Apply 8% sales tax to subtotal (before discounts)
- Tax should be included in final total

## Debugging Tips

1. The current code has off-by-one errors in discount calculations
2. Tax is being applied incorrectly
3. Loyalty points calculation doesn't account for minimum order
4. Edge cases aren't handled (empty cart, negative quantities, etc.)

## Expected Behavior

\`\`\`javascript
// Example 1: Basic order
calculateTotal([
  { name: "Laptop", price: 1000, quantity: 1 }
], "SAVE10")
// Should return: {
//   subtotal: 1000,
//   discount: 100,
//   tax: 80,
//   shipping: 0,
//   total: 980,
//   loyaltyPoints: 980
// }

// Example 2: Bulk discount + coupon
calculateTotal([
  { name: "T-Shirt", price: 20, quantity: 6 }
], "SAVE20")
// Subtotal: 120
// Quantity discount: 10% (12)
// Coupon discount: 20% on discounted (21.6)
// Should apply best discount strategy
\`\`\`

Good luck!
  `,
};

const STARTER_CODE = `// E-Commerce Cart Discount Calculator
// Fix the bugs and implement the missing features

function calculateTotal(items, couponCode = "") {
  // TODO: Implement proper cart calculation logic
  
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
  
  // Bug 3: Tax calculation is wrong
  const tax = (subtotal - discount) * 0.08;
  
  // Bug 4: Coupon codes don't work
  if (couponCode === "SAVE10") {
    discount = discount + subtotal * 0.1;
  }
  
  // Bug 5: Loyalty points calculation is incomplete
  const loyaltyPoints = Math.floor(subtotal - discount);
  
  // Bug 6: Shipping logic missing
  const shipping = 10;
  
  return {
    subtotal,
    discount,
    tax,
    shipping,
    total: subtotal - discount + tax + shipping,
    loyaltyPoints
  };
}

// Test cases (do not modify)
const testCases = [
  {
    items: [{ name: "Laptop", price: 1000, quantity: 1 }],
    coupon: "SAVE10"
  },
  {
    items: [{ name: "T-Shirt", price: 20, quantity: 6 }],
    coupon: "SAVE20"
  },
  {
    items: [
      { name: "Book", price: 15, quantity: 3 },
      { name: "Pen", price: 2, quantity: 5 }
    ],
    coupon: "FREESHIP"
  }
];

// Run tests
testCases.forEach((test, i) => {
  console.log(\`Test \${i + 1}:\`, calculateTotal(test.items, test.coupon));
});
`;

const INITIAL_TESTS: TestCase[] = [
  {
    id: "test-1",
    name: "Basic Cart Calculation",
    description: "Calculate subtotal for single item correctly",
    status: "pending",
    points: 15,
  },
  {
    id: "test-2",
    name: "Quantity-Based Discount (5+ items)",
    description: "Apply 10% discount when cart has 5+ items",
    status: "pending",
    points: 15,
  },
  {
    id: "test-3",
    name: "Quantity-Based Discount (10+ items)",
    description: "Apply 15% discount when cart has 10+ items",
    status: "pending",
    points: 15,
  },
  {
    id: "test-4",
    name: "Coupon Code: SAVE10",
    description: "Apply 10% coupon discount correctly",
    status: "pending",
    points: 10,
  },
  {
    id: "test-5",
    name: "Coupon Code: SAVE20",
    description: "Apply 20% coupon discount correctly",
    status: "pending",
    points: 10,
  },
  {
    id: "test-6",
    name: "Coupon Code: FREESHIP",
    description: "Free shipping coupon removes shipping fee",
    status: "pending",
    points: 10,
  },
  {
    id: "test-7",
    name: "Tax Calculation",
    description: "Apply 8% sales tax correctly",
    status: "pending",
    points: 10,
  },
  {
    id: "test-8",
    name: "Loyalty Points",
    description: "Calculate loyalty points with minimum order check",
    status: "pending",
    points: 15,
  },
];

export default function CodeLabPage() {
  const [code, setCode] = useState(STARTER_CODE);
  const [tests, setTests] = useState<TestCase[]>(INITIAL_TESTS);
  const [isRunning, setIsRunning] = useState(false);
  const [console, setConsole] = useState<string[]>([
    "🚀 Code Lab initialized. Ready to start debugging!",
    "💡 Tip: Read the requirements carefully before starting.",
  ]);

  const handleReset = () => {
    if (confirm("Are you sure you want to reset your code? All changes will be lost.")) {
      setCode(STARTER_CODE);
      setTests(INITIAL_TESTS);
      setConsole([
        "🔄 Code reset to starter template.",
        "All test cases reset to pending state.",
      ]);
    }
  };

  const handleSave = () => {
    localStorage.setItem("code-lab-progress", code);
    setConsole((prev) => [
      ...prev,
      `✅ Progress saved at ${new Date().toLocaleTimeString()}`,
    ]);
  };

  const handleExecute = async () => {
    setIsRunning(true);
    setConsole([
      "🔄 Executing test suite...",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    ]);

    // Simulate test execution
    const updatedTests = [...tests];

    for (let i = 0; i < updatedTests.length; i++) {
      updatedTests[i].status = "running";
      setTests([...updatedTests]);

      await new Promise((resolve) => setTimeout(resolve, 800));

      // Simulate random pass/fail (70% pass rate)
      const passed = Math.random() > 0.3;
      updatedTests[i].status = passed ? "passed" : "failed";
      setTests([...updatedTests]);

      setConsole((prev) => [
        ...prev,
        `${passed ? "✅" : "❌"} ${updatedTests[i].name}: ${
          passed ? "PASSED" : "FAILED"
        }`,
      ]);
    }

    const passedCount = updatedTests.filter((t) => t.status === "passed").length;
    const totalPoints = updatedTests
      .filter((t) => t.status === "passed")
      .reduce((sum, t) => sum + t.points, 0);

    setConsole((prev) => [
      ...prev,
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      `📊 Results: ${passedCount}/${tests.length} tests passed`,
      `⭐ Score: ${totalPoints}/${CHALLENGE.points} points`,
    ]);

    setIsRunning(false);
  };

  const handleTimeUp = () => {
    alert("⏰ Time's up! Your code will be auto-submitted.");
    handleExecute();
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-800 p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <FileCode className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold">{CHALLENGE.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{CHALLENGE.difficulty}</Badge>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {CHALLENGE.points} points
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Progress
              </Button>
              <Button onClick={handleReset} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          {/* Timer Banner */}
          <CountdownTimer
            durationMinutes={CHALLENGE.timeLimit}
            onTimeUp={handleTimeUp}
          />
        </div>
      </div>

      {/* Main Content: Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Requirements & Tests */}
        <div className="w-1/3 bg-white dark:bg-slate-900 border-r-2 border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Requirements */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-bold flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-600" />
                Requirements
              </h2>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="text-sm space-y-4">
                  {CHALLENGE.description.split("\n\n").map((para, i) => {
                    if (para.startsWith("#")) {
                      const level = para.match(/^#+/)?.[0].length || 1;
                      const text = para.replace(/^#+\s*/, "");
                      return level === 1 ? (
                        <h3 key={i} className="text-lg font-bold mt-4 mb-2">
                          {text}
                        </h3>
                      ) : (
                        <h4 key={i} className="text-md font-semibold mt-3 mb-2">
                          {text}
                        </h4>
                      );
                    }
                    if (para.startsWith("```")) {
                      return (
                        <pre
                          key={i}
                          className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-x-auto"
                        >
                          <code>{para.replace(/```\w*\n?|\n?```/g, "")}</code>
                        </pre>
                      );
                    }
                    return (
                      <p key={i} className="text-slate-700 dark:text-slate-300">
                        {para}
                      </p>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Test Checklist */}
          <div className="h-1/2 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Test Cases
              </h2>
            </div>
            <ScrollArea className="flex-1 p-4">
              <TestChecklist tests={tests} />
            </ScrollArea>
          </div>
        </div>

        {/* Right Pane: Code Editor */}
        <div className="flex-1 flex flex-col">
          {/* Editor */}
          <div className="flex-1 p-4">
            <CodeEditor
              value={code}
              onChange={setCode}
              language="javascript"
              readOnly={isRunning}
            />
          </div>

          {/* Console Output */}
          <div className="h-48 bg-slate-900 border-t-2 border-slate-700 flex flex-col">
            <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Terminal className="w-4 h-4" />
                <span className="font-semibold text-sm">Console Output</span>
              </div>
              <Button
                onClick={() => setConsole([])}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                Clear
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="font-mono text-xs text-slate-300 space-y-1">
                {console.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Execute Button */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-800">
            <Button
              onClick={handleExecute}
              disabled={isRunning}
              size="lg"
              className="w-full"
            >
              {isRunning ? (
                <>
                  <AlertCircle className="w-5 h-5 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Execute Code Suite
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
