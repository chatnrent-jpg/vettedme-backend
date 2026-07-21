"use client";

import { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";

interface CountdownTimerProps {
  durationMinutes: number;
  onTimeUp?: () => void;
}

export function CountdownTimer({
  durationMinutes,
  onTimeUp,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && onTimeUp) {
        onTimeUp();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentage = (timeLeft / (durationMinutes * 60)) * 100;

  const getTimerColor = () => {
    if (percentage <= 10) return "bg-red-600";
    if (percentage <= 25) return "bg-orange-600";
    if (percentage <= 50) return "bg-yellow-600";
    return "bg-blue-600";
  };

  const getTextColor = () => {
    if (percentage <= 10) return "text-red-600";
    if (percentage <= 25) return "text-orange-600";
    if (percentage <= 50) return "text-yellow-600";
    return "text-blue-600";
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${getTextColor()}`} />
          <span className="font-semibold text-sm">Time Remaining</span>
        </div>
        <div className={`text-2xl font-bold font-mono ${getTextColor()}`}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-linear ${getTimerColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {percentage <= 25 && (
        <div className="flex items-center gap-2 mt-3 text-xs text-orange-600 dark:text-orange-400">
          <AlertCircle className="w-4 h-4" />
          <span>Time is running out!</span>
        </div>
      )}
    </div>
  );
}
