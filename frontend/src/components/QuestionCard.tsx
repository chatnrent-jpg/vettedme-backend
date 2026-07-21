"use client";

import { useState, useEffect } from "react";
import { Volume2, VolumeX, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  number: number;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  text: string;
  audioUrl?: string;
  thinkingTime: number; // seconds
  answerTime: number; // seconds
}

interface QuestionCardProps {
  question: Question;
  isActive: boolean;
  onThinkingComplete?: () => void;
  onAnswerComplete?: () => void;
}

export function QuestionCard({
  question,
  isActive,
  onThinkingComplete,
  onAnswerComplete,
}: QuestionCardProps) {
  const [phase, setPhase] = useState<"loading" | "thinking" | "answering" | "complete">("loading");
  const [timeLeft, setTimeLeft] = useState(question.thinkingTime);
  const [isPlaying, setIsPlaying] = useState(false);

  // Text-to-speech simulation
  const playQuestion = () => {
    setIsPlaying(true);
    
    // Simulate reading the question (approx 2 words per second)
    const words = question.text.split(" ").length;
    const duration = (words / 2) * 1000;

    // Use Web Speech API if available
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(question.text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        setIsPlaying(false);
        setPhase("thinking");
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback: simulate reading time
      setTimeout(() => {
        setIsPlaying(false);
        setPhase("thinking");
      }, duration);
    }
  };

  // Auto-play when question becomes active
  useEffect(() => {
    if (isActive && phase === "loading") {
      setTimeout(() => {
        playQuestion();
      }, 1000);
    }
  }, [isActive]);

  // Thinking timer
  useEffect(() => {
    if (phase === "thinking" && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setPhase("answering");
            setTimeLeft(question.answerTime);
            if (onThinkingComplete) onThinkingComplete();
            return question.answerTime;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [phase, timeLeft]);

  // Answering timer
  useEffect(() => {
    if (phase === "answering" && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setPhase("complete");
            if (onAnswerComplete) onAnswerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [phase, timeLeft]);

  const getDifficultyColor = () => {
    switch (question.difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400";
      case "Hard":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400";
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case "loading":
        return "text-slate-600";
      case "thinking":
        return "text-blue-600";
      case "answering":
        return "text-green-600";
      case "complete":
        return "text-slate-400";
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">
              Question {question.number}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{question.category}</Badge>
            <Badge className={getDifficultyColor()}>
              {question.difficulty}
            </Badge>
          </div>
        </div>

        {/* Phase Indicator */}
        <div className="flex items-center gap-2">
          <div className={`text-sm font-semibold ${getPhaseColor()}`}>
            {phase === "loading" && "Loading question..."}
            {phase === "thinking" && `Thinking Time: ${timeLeft}s`}
            {phase === "answering" && `Answer Now: ${timeLeft}s`}
            {phase === "complete" && "Complete"}
          </div>
          {phase !== "complete" && (
            <div className="flex-1">
              <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-linear ${
                    phase === "thinking" ? "bg-blue-600" : "bg-green-600"
                  }`}
                  style={{
                    width: `${
                      ((phase === "thinking"
                        ? question.thinkingTime - timeLeft
                        : question.answerTime - timeLeft + question.thinkingTime) /
                        (question.thinkingTime + question.answerTime)) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Question Text */}
        <div className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg p-6 mb-4">
          {phase === "loading" ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <p className="text-lg leading-relaxed mb-4">{question.text}</p>

              {/* Audio Controls */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  onClick={playQuestion}
                  disabled={isPlaying || phase === "complete"}
                  variant="outline"
                  size="sm"
                >
                  {isPlaying ? (
                    <>
                      <VolumeX className="w-4 h-4 mr-2" />
                      Speaking...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Replay Question
                    </>
                  )}
                </Button>
                {isPlaying && (
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-3 bg-blue-600 animate-pulse" />
                    <div
                      className="w-1 h-4 bg-blue-600 animate-pulse"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-1 h-3 bg-blue-600 animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Instructions */}
        {phase === "thinking" && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💭 <strong>Thinking Time:</strong> Use this time to structure
              your answer. You may take notes. Recording will start
              automatically when answering begins.
            </p>
          </div>
        )}

        {phase === "answering" && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-300">
              🎤 <strong>Recording Now:</strong> Speak clearly and explain your
              reasoning. Your answer is being recorded and analyzed for
              technical accuracy and biometric authenticity.
            </p>
          </div>
        )}

        {phase === "complete" && (
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ✅ <strong>Complete:</strong> Your answer has been recorded.
              Moving to next question...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
