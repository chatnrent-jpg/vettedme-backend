"use client";

import { CheckCircle, XCircle, Circle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type TestStatus = "pending" | "running" | "passed" | "failed";

export interface TestCase {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  points: number;
}

interface TestChecklistProps {
  tests: TestCase[];
}

export function TestChecklist({ tests }: TestChecklistProps) {
  const passedCount = tests.filter((t) => t.status === "passed").length;
  const totalTests = tests.length;
  const totalPoints = tests.reduce((sum, t) => sum + t.points, 0);
  const earnedPoints = tests
    .filter((t) => t.status === "passed")
    .reduce((sum, t) => sum + t.points, 0);

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case "passed":
        return <Badge variant="success">PASSED</Badge>;
      case "failed":
        return <Badge variant="destructive">FAILED</Badge>;
      case "running":
        return <Badge variant="outline">RUNNING</Badge>;
      default:
        return <Badge variant="outline">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Test Suite Progress</span>
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {passedCount} / {totalTests} tests passing
          </span>
        </div>
        <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-green-600 transition-all duration-500"
            style={{ width: `${(passedCount / totalTests) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            Points: {earnedPoints} / {totalPoints}
          </span>
          <span className="text-xs font-semibold text-green-600">
            {Math.round((passedCount / totalTests) * 100)}% Complete
          </span>
        </div>
      </div>

      {/* Test Cases */}
      <div className="space-y-2">
        {tests.map((test) => (
          <div
            key={test.id}
            className={`p-4 border rounded-lg transition-all ${
              test.status === "passed"
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                : test.status === "failed"
                ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                : test.status === "running"
                ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getStatusIcon(test.status)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{test.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {test.points} pts
                    </span>
                    {getStatusBadge(test.status)}
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {test.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
