"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type LivenessStatus = "idle" | "initializing" | "capturing" | "success" | "failed";

interface BiometricLivenessCaptureProps {
  onSuccess: (imageData: string) => void;
  onSkip?: () => void;
}

export function BiometricLivenessCapture({
  onSuccess,
  onSkip,
}: BiometricLivenessCaptureProps) {
  const [status, setStatus] = useState<LivenessStatus>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [instruction, setInstruction] = useState("Position your face in the frame");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera
  const startCamera = async () => {
    setStatus("initializing");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStatus("capturing");
      setInstruction("Hold still and look at the camera");
      
      // Simulate liveness detection progress
      simulateLivenessCheck();
    } catch (error) {
      console.error("Camera access error:", error);
      setStatus("failed");
      setInstruction("Camera access denied. Please enable camera permissions.");
    }
  };

  // Simulate liveness detection
  const simulateLivenessCheck = () => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 2;
      setProgress(currentProgress);

      if (currentProgress === 30) {
        setInstruction("Detecting face...");
      } else if (currentProgress === 60) {
        setInstruction("Analyzing liveness...");
      } else if (currentProgress === 90) {
        setInstruction("Almost done...");
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        captureImage();
      }
    }, 100);
  };

  // Capture image from video
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(imageData);
        
        // Simulate verification
        setTimeout(() => {
          const isSuccess = Math.random() > 0.1; // 90% success rate
          if (isSuccess) {
            setStatus("success");
            setInstruction("Liveness verified successfully!");
            setTimeout(() => {
              onSuccess(imageData);
            }, 2000);
          } else {
            setStatus("failed");
            setInstruction("Liveness check failed. Please try again.");
          }
        }, 1000);
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Retry
  const retry = () => {
    setStatus("idle");
    setProgress(0);
    setCapturedImage(null);
    setInstruction("Position your face in the frame");
    stopCamera();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stream]);

  return (
    <div className="space-y-6">
      {/* Camera Preview / Status Display */}
      <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border-4 border-slate-300 dark:border-slate-700">
        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <Camera className="w-16 h-16 mb-4 text-slate-400" />
            <p className="text-lg font-semibold mb-2">Ready to Start</p>
            <p className="text-sm text-slate-400">
              Click "Start Camera" to begin liveness verification
            </p>
          </div>
        )}

        {status === "initializing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <Loader2 className="w-16 h-16 mb-4 animate-spin text-blue-500" />
            <p className="text-lg font-semibold">Initializing Camera...</p>
          </div>
        )}

        {(status === "capturing" || status === "success" || status === "failed") && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Face Frame Overlay */}
            {status === "capturing" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Oval Face Frame */}
                  <div className="w-64 h-80 border-4 border-blue-500 rounded-full animate-pulse"></div>
                  
                  {/* Corner Guides */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-3xl"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-3xl"></div>
                </div>
              </div>
            )}

            {/* Success Overlay */}
            {status === "success" && capturedImage && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-sm animate-in fade-in zoom-in duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center shadow-2xl">
                  <div className="w-20 h-20 mx-auto mb-4 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-600 mb-2">
                    Verified!
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Liveness check successful
                  </p>
                </div>
              </div>
            )}

            {/* Failure Overlay */}
            {status === "failed" && (
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center backdrop-blur-sm animate-in fade-in zoom-in duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center shadow-2xl">
                  <div className="w-20 h-20 mx-auto mb-4 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center animate-bounce">
                    <XCircle className="w-12 h-12 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-600 mb-2">
                    Failed
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Could not verify liveness
                  </p>
                  <Button onClick={retry} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Instructions & Progress */}
      {status === "capturing" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium">{instruction}</p>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-xs text-slate-500 text-center">
            {progress}% complete
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {status === "idle" && (
          <>
            <Button onClick={startCamera} className="flex-1" size="lg">
              <Camera className="w-5 h-5 mr-2" />
              Start Camera
            </Button>
            {onSkip && (
              <Button onClick={onSkip} variant="outline" size="lg">
                Skip for Now
              </Button>
            )}
          </>
        )}

        {status === "capturing" && (
          <Button onClick={stopCamera} variant="outline" className="flex-1" size="lg">
            Cancel
          </Button>
        )}

        {status === "failed" && (
          <Button onClick={retry} className="flex-1" size="lg">
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          Tips for Best Results
        </h4>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <li>• Ensure good lighting on your face</li>
          <li>• Remove glasses or hats if possible</li>
          <li>• Look directly at the camera</li>
          <li>• Keep your face centered in the frame</li>
          <li>• Stay still during the verification</li>
        </ul>
      </div>
    </div>
  );
}
