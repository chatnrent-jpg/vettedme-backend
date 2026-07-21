"use client";

import { useState, useEffect } from "react";
import {
  Video,
  Shield,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BiometricVideoFeed } from "@/components/BiometricVideoFeed";
import { QuestionCard } from "@/components/QuestionCard";

// Mock questions
const QUESTIONS = [
  {
    id: "q1",
    number: 1,
    category: "Code Review",
    difficulty: "Medium" as const,
    text: "Looking at the code you wrote in the previous challenge, explain why you chose to structure the discount calculation the way you did. What are the potential edge cases you accounted for?",
    thinkingTime: 30,
    answerTime: 90,
  },
  {
    id: "q2",
    number: 2,
    category: "Algorithm Design",
    difficulty: "Hard" as const,
    text: "If the e-commerce system needed to handle 10,000 simultaneous discount calculations per second, how would you optimize your code for performance? Discuss time and space complexity.",
    thinkingTime: 45,
    answerTime: 120,
  },
  {
    id: "q3",
    number: 3,
    category: "System Design",
    difficulty: "Hard" as const,
    text: "Describe how you would implement a distributed caching layer for frequently-used discount codes across multiple data centers. What consistency model would you choose and why?",
    thinkingTime: 45,
    answerTime: 120,
  },
  {
    id: "q4",
    number: 4,
    category: "Debugging",
    difficulty: "Easy" as const,
    text: "Walk me through your debugging process when you encountered the off-by-one error in the loop. What mental model do you use to catch these types of bugs?",
    thinkingTime: 20,
    answerTime: 60,
  },
  {
    id: "q5",
    number: 5,
    category: "Best Practices",
    difficulty: "Medium" as const,
    text: "Your code currently has no input validation. What security vulnerabilities does this create, and how would you implement proper validation without sacrificing performance?",
    thinkingTime: 30,
    answerTime: 90,
  },
];

export default function VivaPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<string[]>([]);
  const [biometricWarnings, setBiometricWarnings] = useState<string[]>([]);

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;

  const handleThinkingComplete = () => {
    setIsRecording(true);
  };

  const handleAnswerComplete = () => {
    setIsRecording(false);
    setCompletedQuestions((prev) => [...prev, currentQuestion.id]);

    // Move to next question
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
      }, 2000);
    } else {
      // Assessment complete
      setTimeout(() => {
        handleComplete();
      }, 2000);
    }
  };

  const handleBiometricSignal = (signals: any) => {
    const warnings = [];

    if (!signals.faceDetected) {
      warnings.push("Face not detected");
    }
    if (signals.multipleFaces) {
      warnings.push("Multiple faces detected");
    }
    if (!signals.facingCamera) {
      warnings.push("Not facing camera");
    }
    if (signals.eyeContact < 50) {
      warnings.push("Low eye contact");
    }

    setBiometricWarnings(warnings);
  };

  const handleStart = () => {
    setHasStarted(true);
  };

  const handleComplete = () => {
    alert("🎉 Tier 3 Assessment Complete! Analyzing your responses...");
    window.location.href = "/talent";
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50 dark:from-slate-950 dark:via-purple-950/10 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-purple-100 dark:bg-purple-950 rounded-full flex items-center justify-center">
              <Video className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              AI Technical Viva - Tier 3
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Final assessment: Biometrically-monitored technical interview
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">
                  Biometric Monitoring
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Your video and audio will be recorded throughout the
                  assessment. AI will analyze facial patterns, voice
                  consistency, and eye movements to verify authenticity.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
              <Video className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">
                  Dynamic Questions
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  You'll answer {QUESTIONS.length} AI-generated questions about
                  your code from Tier 2. Questions are read aloud via
                  text-to-speech. You'll have thinking time, then answer
                  verbally.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">
                  Anti-Cheat Detection
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Looking away, multiple faces, suspicious behavior, or AI
                  assistance will be flagged. Ensure good lighting and a quiet
                  environment.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-sm mb-3">Assessment Format</h3>
            <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
              <li>• {QUESTIONS.length} questions total</li>
              <li>• 20-45 seconds thinking time per question</li>
              <li>• 60-120 seconds answer time per question</li>
              <li>• Questions are read aloud automatically</li>
              <li>• Camera and microphone required</li>
              <li>• Total time: ~15 minutes</li>
            </ul>
          </div>

          <Button onClick={handleStart} size="lg" className="w-full">
            <Video className="w-5 h-5 mr-2" />
            Start AI Viva Assessment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50 dark:from-slate-950 dark:via-purple-950/10 dark:to-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-800 p-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Video className="w-6 h-6 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold">AI Technical Viva - Tier 3</h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Biometrically-monitored technical interview
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  🔴 RECORDING
                </Badge>
              )}
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} / {QUESTIONS.length}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold">Overall Progress</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl p-4">
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main Area: Question Card */}
          <div className="lg:col-span-2">
            <QuestionCard
              question={currentQuestion}
              isActive={true}
              onThinkingComplete={handleThinkingComplete}
              onAnswerComplete={handleAnswerComplete}
            />

            {/* Completed Questions */}
            {completedQuestions.length > 0 && (
              <div className="mt-4 p-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-sm">
                    Completed Questions
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {completedQuestions.map((qId, index) => (
                    <Badge key={qId} variant="success">
                      Q{index + 1}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Video Feed & Status */}
          <div className="space-y-4">
            {/* Biometric Video Feed */}
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-sm">
                  Biometric Monitoring
                </span>
              </div>
              <BiometricVideoFeed
                isRecording={isRecording}
                onSignalUpdate={handleBiometricSignal}
              />
            </div>

            {/* Warnings Panel */}
            {biometricWarnings.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-900 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-sm">Active Warnings</span>
                </div>
                <ul className="text-xs space-y-1 text-orange-800 dark:text-orange-300">
                  {biometricWarnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-sm">Tips</span>
              </div>
              <ul className="text-xs space-y-1 text-blue-800 dark:text-blue-300">
                <li>• Speak clearly and at a normal pace</li>
                <li>• Look at the camera when answering</li>
                <li>• Explain your reasoning thoroughly</li>
                <li>• Use the thinking time to organize</li>
                <li>• Stay in frame throughout</li>
              </ul>
            </div>

            {/* Question List */}
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg p-4">
              <span className="font-semibold text-sm mb-3 block">
                Questions
              </span>
              <div className="space-y-2">
                {QUESTIONS.map((q, index) => (
                  <div
                    key={q.id}
                    className={`p-2 rounded text-xs ${
                      completedQuestions.includes(q.id)
                        ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900"
                        : index === currentQuestionIndex
                        ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900"
                        : "bg-slate-50 dark:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Q{q.number}</span>
                      {completedQuestions.includes(q.id) && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {index === currentQuestionIndex && (
                        <span className="text-blue-600">◉ Active</span>
                      )}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 mt-1">
                      {q.category}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
