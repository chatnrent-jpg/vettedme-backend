"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Clock,
  Shield,
  AlertCircle,
  Loader2,
  DollarSign,
  User,
  Camera,
  Fingerprint,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Milestone {
  id: string;
  number: number;
  title: string;
  amount: number;
  deliverables: string[];
  completedAt: string;
}

interface Contractor {
  id: string;
  name: string;
  passportId: string;
  trustScore: number;
}

interface ReleaseMilestoneHandshakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone;
  contractor: Contractor;
  contractId: string;
  onRelease?: () => void;
}

type HandshakeStatus =
  | "PENDING_APPROVAL"
  | "AWAITING_BIOMETRIC"
  | "BIOMETRIC_IN_PROGRESS"
  | "BIOMETRIC_VERIFIED"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_RELEASED"
  | "BIOMETRIC_FAILED";

export function ReleaseMilestoneHandshakeModal({
  isOpen,
  onClose,
  milestone,
  contractor,
  contractId,
  onRelease,
}: ReleaseMilestoneHandshakeModalProps) {
  const [status, setStatus] = useState<HandshakeStatus>("PENDING_APPROVAL");
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Simulate biometric verification flow
  const startBiometricFlow = () => {
    setStatus("AWAITING_BIOMETRIC");
    setProgress(10);

    // Simulate notification sent to contractor
    setTimeout(() => {
      setStatus("BIOMETRIC_IN_PROGRESS");
      setProgress(30);
    }, 2000);

    // Simulate biometric verification in progress
    setTimeout(() => {
      setProgress(50);
    }, 4000);

    setTimeout(() => {
      setProgress(70);
    }, 6000);

    // Simulate biometric verification complete
    setTimeout(() => {
      setStatus("BIOMETRIC_VERIFIED");
      setProgress(85);
    }, 8000);

    // Simulate payment processing
    setTimeout(() => {
      setStatus("PAYMENT_PROCESSING");
      setProgress(95);
    }, 9000);

    // Simulate payment released
    setTimeout(() => {
      setStatus("PAYMENT_RELEASED");
      setProgress(100);
      if (onRelease) {
        setTimeout(() => {
          onRelease();
        }, 2000);
      }
    }, 11000);
  };

  // Timer for elapsed time
  useEffect(() => {
    if (
      status === "AWAITING_BIOMETRIC" ||
      status === "BIOMETRIC_IN_PROGRESS" ||
      status === "BIOMETRIC_VERIFIED" ||
      status === "PAYMENT_PROCESSING"
    ) {
      const interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const platformFee = milestone.amount * 0.15; // 15%
  const fxSpread = milestone.amount * 0.005; // 0.5%
  const contractorReceives = milestone.amount - platformFee - fxSpread;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const getStatusConfig = () => {
    switch (status) {
      case "PENDING_APPROVAL":
        return {
          icon: AlertCircle,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
          borderColor: "border-yellow-200 dark:border-yellow-900",
          title: "Milestone Completion Pending Release",
          description:
            "Contractor has marked this milestone as complete. Review the deliverables and initiate the biometric handshake to release payment.",
        };
      case "AWAITING_BIOMETRIC":
        return {
          icon: Camera,
          color: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-950/20",
          borderColor: "border-blue-200 dark:border-blue-900",
          title: "Awaiting Biometric Verification",
          description:
            "Notification sent to contractor. Waiting for them to complete live facial verification via VettedME app.",
        };
      case "BIOMETRIC_IN_PROGRESS":
        return {
          icon: Fingerprint,
          color: "text-purple-600",
          bgColor: "bg-purple-50 dark:bg-purple-950/20",
          borderColor: "border-purple-200 dark:border-purple-900",
          title: "Biometric Verification In Progress",
          description:
            "Contractor is completing facial scan. Verifying identity against government records and VettedME passport.",
        };
      case "BIOMETRIC_VERIFIED":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950/20",
          borderColor: "border-green-200 dark:border-green-900",
          title: "Biometric Verification Successful",
          description:
            "Identity confirmed. Face match: 97%. Preparing payment release via Airwallex.",
        };
      case "PAYMENT_PROCESSING":
        return {
          icon: DollarSign,
          color: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-950/20",
          borderColor: "border-blue-200 dark:border-blue-900",
          title: "Payment Processing",
          description:
            "Releasing funds from escrow to contractor's account. Multi-currency conversion in progress.",
        };
      case "PAYMENT_RELEASED":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950/20",
          borderColor: "border-green-200 dark:border-green-900",
          title: "Payment Released Successfully",
          description:
            "Funds have been transferred to contractor. Transaction complete. Receipt sent via email.",
        };
      case "BIOMETRIC_FAILED":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-950/20",
          borderColor: "border-red-200 dark:border-red-900",
          title: "Biometric Verification Failed",
          description:
            "Identity verification unsuccessful. Contractor must retry facial scan within 7 days.",
        };
      default:
        return {
          icon: Clock,
          color: "text-slate-600",
          bgColor: "bg-slate-50 dark:bg-slate-950/20",
          borderColor: "border-slate-200 dark:border-slate-900",
          title: "Processing",
          description: "Please wait...",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="w-6 h-6 text-blue-600" />
            Biometric Release Handshake
          </DialogTitle>
          <DialogDescription>
            Milestone payment requires live biometric verification from
            contractor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-lg border-2 ${statusConfig.bgColor} ${statusConfig.borderColor}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  status === "BIOMETRIC_IN_PROGRESS" ||
                  status === "PAYMENT_PROCESSING"
                    ? "animate-pulse"
                    : ""
                }`}
              >
                {status === "BIOMETRIC_IN_PROGRESS" ||
                status === "PAYMENT_PROCESSING" ? (
                  <Loader2
                    className={`w-8 h-8 ${statusConfig.color} animate-spin`}
                  />
                ) : (
                  <StatusIcon className={`w-8 h-8 ${statusConfig.color}`} />
                )}
              </div>
              <div className="flex-1">
                <h3
                  className={`font-semibold text-lg mb-1 ${statusConfig.color}`}
                >
                  {statusConfig.title}
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {statusConfig.description}
                </p>
                {(status === "AWAITING_BIOMETRIC" ||
                  status === "BIOMETRIC_IN_PROGRESS" ||
                  status === "BIOMETRIC_VERIFIED" ||
                  status === "PAYMENT_PROCESSING") && (
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    Time elapsed: {formatTime(timeElapsed)}
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {status !== "PENDING_APPROVAL" &&
              status !== "BIOMETRIC_FAILED" && (
                <div className="mt-4">
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center justify-between mt-1 text-xs text-slate-600 dark:text-slate-400">
                    <span>Processing...</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              )}
          </div>

          {/* Milestone Details */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Milestone Details
            </h4>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Milestone {milestone.number}</Badge>
                  <span className="font-semibold">{milestone.title}</span>
                </div>
                <Badge variant="success">Completed</Badge>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Marked complete: {milestone.completedAt}
              </div>
            </div>

            {milestone.deliverables.length > 0 && (
              <div>
                <div className="text-sm font-semibold mb-2">Deliverables:</div>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  {milestone.deliverables.map((deliverable, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span>{deliverable}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Separator />

          {/* Contractor Info */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Contractor Identity
            </h4>

            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {contractor.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{contractor.name}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  VettedME Passport: {contractor.passportId}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {contractor.trustScore}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Trust Score
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Breakdown */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Payment Breakdown
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Milestone Amount:
                </span>
                <span className="font-semibold">
                  ${milestone.amount.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Platform Fee (15%):
                </span>
                <span className="text-red-600">
                  -${platformFee.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  FX Spread (0.5%):
                </span>
                <span className="text-red-600">
                  -${fxSpread.toLocaleString()}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <span className="font-semibold text-green-800 dark:text-green-400">
                  Contractor Receives:
                </span>
                <span className="text-xl font-bold text-green-600">
                  ${contractorReceives.toLocaleString()}
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400">
                Payment will be converted to NGN and transferred to
                contractor's local bank account via Airwallex
              </div>
            </div>
          </div>

          {/* Biometric Security Notice */}
          {status === "PENDING_APPROVAL" && (
            <>
              <Separator />
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
                      Biometric Security Protocol
                    </h4>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <li>
                        • Contractor must complete live facial scan via VettedME
                        app
                      </li>
                      <li>
                        • Identity verified against government NIN/BVN records
                      </li>
                      <li>
                        • Face match compared to original passport biometric
                        (requires 95%+ match)
                      </li>
                      <li>
                        • Liveness detection prevents deepfake or photo spoofing
                      </li>
                      <li>
                        • Payment releases automatically upon successful
                        verification
                      </li>
                      <li>
                        • Contractor has 7 days to complete verification before
                        escalation
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Webhook Processing Steps */}
          {status !== "PENDING_APPROVAL" && status !== "PAYMENT_RELEASED" && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">
                  Webhook Handshake Flow:
                </h4>
                <div className="space-y-2">
                  <div
                    className={`flex items-center gap-2 text-xs ${
                      progress >= 10
                        ? "text-green-600"
                        : "text-slate-400"
                    }`}
                  >
                    {progress >= 10 ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span>
                      1. Notification sent to contractor (VettedME app push)
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-xs ${
                      progress >= 30
                        ? "text-green-600"
                        : "text-slate-400"
                    }`}
                  >
                    {progress >= 30 ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : progress >= 10 ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span>
                      2. Contractor initiates facial scan (camera activated)
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-xs ${
                      progress >= 70
                        ? "text-green-600"
                        : "text-slate-400"
                    }`}
                  >
                    {progress >= 70 ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : progress >= 30 ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span>
                      3. Biometric data processed (Smile ID verification API)
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-xs ${
                      progress >= 85
                        ? "text-green-600"
                        : "text-slate-400"
                    }`}
                  >
                    {progress >= 85 ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : progress >= 70 ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span>
                      4. Identity confirmed (webhook triggered to VettedPay)
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-xs ${
                      progress >= 100
                        ? "text-green-600"
                        : "text-slate-400"
                    }`}
                  >
                    {progress >= 100 ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : progress >= 85 ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span>
                      5. Payment released (Airwallex payout API executed)
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Success Actions */}
          {status === "PAYMENT_RELEASED" && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-900 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-400">
                    Milestone Payment Complete
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ${contractorReceives.toLocaleString()} transferred to{" "}
                    {contractor.name}
                  </p>
                </div>
              </div>
              <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <p>• Transaction ID: TXN-{Date.now()}</p>
                <p>• Airwallex Reference: AW-{contractId}-M{milestone.number}</p>
                <p>• Receipt sent to your email</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {status === "PENDING_APPROVAL" && (
            <>
              <Button onClick={onClose} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={startBiometricFlow}
                className="flex-1"
              >
                <Shield className="w-4 h-4 mr-2" />
                Approve & Request Biometric Handshake
              </Button>
            </>
          )}

          {status === "PAYMENT_RELEASED" && (
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          )}

          {status !== "PENDING_APPROVAL" &&
            status !== "PAYMENT_RELEASED" && (
              <Button onClick={onClose} variant="outline" className="flex-1" disabled>
                Processing... Please Wait
              </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
