"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera,
  CameraOff,
  AlertTriangle,
  CheckCircle,
  Eye,
  Users,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BiometricSignals {
  faceDetected: boolean;
  facingCamera: boolean;
  multipleFaces: boolean;
  eyeContact: number; // 0-100
  lightingQuality: "good" | "poor" | "acceptable";
  suspiciousActivity: boolean;
}

interface BiometricVideoFeedProps {
  isRecording: boolean;
  onSignalUpdate?: (signals: BiometricSignals) => void;
}

export function BiometricVideoFeed({
  isRecording,
  onSignalUpdate,
}: BiometricVideoFeedProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [signals, setSignals] = useState<BiometricSignals>({
    faceDetected: false,
    facingCamera: false,
    multipleFaces: false,
    eyeContact: 0,
    lightingQuality: "acceptable",
    suspiciousActivity: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: true,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOn(true);

      // Simulate biometric analysis
      startBiometricAnalysis();
    } catch (error) {
      console.error("Camera access error:", error);
      alert("Camera access denied. Please enable camera permissions.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraOn(false);
    }
  };

  // Simulate biometric analysis
  const startBiometricAnalysis = () => {
    const interval = setInterval(() => {
      const newSignals: BiometricSignals = {
        faceDetected: Math.random() > 0.05, // 95% face detected
        facingCamera: Math.random() > 0.1, // 90% facing camera
        multipleFaces: Math.random() > 0.95, // 5% multiple faces (suspicious)
        eyeContact: Math.floor(Math.random() * 30) + 70, // 70-100
        lightingQuality: Math.random() > 0.8 ? "poor" : "good",
        suspiciousActivity: Math.random() > 0.95, // 5% suspicious
      };

      setSignals(newSignals);
      if (onSignalUpdate) {
        onSignalUpdate(newSignals);
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Auto-start camera if recording
  useEffect(() => {
    if (isRecording && !isCameraOn) {
      startCamera();
    }
  }, [isRecording]);

  return (
    <div className="relative">
      {/* Video Feed */}
      <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border-2 border-slate-700">
        {isCameraOn ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-xs font-semibold">RECORDING</span>
              </div>
            )}

            {/* Biometric Overlays */}
            {signals.faceDetected && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Face Frame */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-green-500 rounded-lg">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500 rounded-tl" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 rounded-br" />
                </div>

                {/* Face Detection Label */}
                <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                  Face Detected
                </div>
              </div>
            )}

            {/* Warnings */}
            {signals.multipleFaces && (
              <div className="absolute bottom-3 left-3 right-3 bg-red-600 text-white px-3 py-2 rounded flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-semibold">
                  Multiple faces detected! Ensure you are alone.
                </span>
              </div>
            )}

            {!signals.facingCamera && (
              <div className="absolute bottom-3 left-3 right-3 bg-orange-600 text-white px-3 py-2 rounded flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-semibold">
                  Please face the camera directly.
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <CameraOff className="w-12 h-12 mb-3 text-slate-500" />
            <p className="text-sm mb-4">Camera is off</p>
            <Button onClick={startCamera} size="sm">
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
          </div>
        )}
      </div>

      {/* Biometric Status Panel */}
      {isCameraOn && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div
            className={`p-2 rounded border ${
              signals.faceDetected
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {signals.faceDetected ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-xs font-semibold">
                {signals.faceDetected ? "Face OK" : "No Face"}
              </span>
            </div>
          </div>

          <div
            className={`p-2 rounded border ${
              signals.eyeContact >= 70
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold">
                Eye Contact: {signals.eyeContact}%
              </span>
            </div>
          </div>

          <div
            className={`p-2 rounded border ${
              !signals.multipleFaces
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {signals.multipleFaces ? (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              ) : (
                <Users className="w-4 h-4 text-green-600" />
              )}
              <span className="text-xs font-semibold">
                {signals.multipleFaces ? "Multi-Face!" : "Single Face"}
              </span>
            </div>
          </div>

          <div
            className={`p-2 rounded border ${
              signals.lightingQuality === "good"
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                : signals.lightingQuality === "poor"
                ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold">
                Lighting: {signals.lightingQuality}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CSS for mirror effect */}
      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
