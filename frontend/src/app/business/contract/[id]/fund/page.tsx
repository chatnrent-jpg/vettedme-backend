"use client";

import { useState } from "react";
import {
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  CreditCard,
  DollarSign,
  Shield,
  ArrowRight,
  Download,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Mock data - would come from API
const CONTRACT_DATA = {
  id: "CTR-2026-004",
  projectName: "E-commerce Platform Rebuild",
  contractorName: "Chidi Okafor",
  totalValue: 15000,
  currency: "USD",
  createdAt: "2026-07-19",
  milestones: [
    { title: "Database Schema & Models", amount: 3000 },
    { title: "API Development & Testing", amount: 4000 },
    { title: "Frontend UI Implementation", amount: 4000 },
    { title: "Payment Integration", amount: 2000 },
    { title: "Testing & Deployment", amount: 2000 },
  ],
};

const AIRWALLEX_ACCOUNT = {
  accountId: "ac_4x8y2z9w1q3e5r7t",
  status: "ACTIVE",
  accountName: "VettedPay Escrow - CTR-2026-004",
  
  // US Domestic (ACH)
  routingNumber: "026073150",
  accountNumber: "8234567890123456",
  accountType: "Checking",
  
  // International Wire
  swiftCode: "AIRWUS33XXX",
  bankName: "Airwallex USA",
  bankAddress: "1 N State St, Suite 1500",
  bankCity: "Chicago",
  bankState: "IL",
  bankZip: "60602",
  bankCountry: "United States",
  
  // Additional Details
  intermediaryBank: "JPMorgan Chase Bank, N.A.",
  intermediarySwift: "CHASUS33",
  
  // Virtual Account Details
  virtualAccountNumber: "VA-1234-5678-9012",
  reference: "CTR-2026-004-ESCROW",
};

type PaymentStatus = "AWAITING_TRANSFER" | "TRANSFER_INITIATED" | "PENDING_VERIFICATION" | "CAPITAL_ESCROWED";

export default function FundContractPage({ params }: { params: { id: string } }) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("AWAITING_TRANSFER");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusStep = () => {
    switch (paymentStatus) {
      case "AWAITING_TRANSFER":
        return 0;
      case "TRANSFER_INITIATED":
        return 1;
      case "PENDING_VERIFICATION":
        return 2;
      case "CAPITAL_ESCROWED":
        return 3;
      default:
        return 0;
    }
  };

  const statusSteps = [
    {
      id: "AWAITING_TRANSFER",
      label: "Awaiting Transfer",
      description: "Waiting for funds to be sent",
      icon: Clock,
      color: "text-slate-400",
      bgColor: "bg-slate-100 dark:bg-slate-800",
    },
    {
      id: "TRANSFER_INITIATED",
      label: "Transfer Initiated",
      description: "Bank transfer in progress",
      icon: ArrowRight,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      id: "PENDING_VERIFICATION",
      label: "Pending Verification",
      description: "Verifying incoming funds",
      icon: RefreshCw,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-950",
    },
    {
      id: "CAPITAL_ESCROWED",
      label: "Capital Safely Escrowed",
      description: "Funds locked and ready",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-950",
    },
  ];

  const currentStep = getStatusStep();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-mono">
                  {CONTRACT_DATA.id}
                </Badge>
                <Badge variant={paymentStatus === "CAPITAL_ESCROWED" ? "success" : "outline"}>
                  {paymentStatus === "CAPITAL_ESCROWED" ? "Funded" : "Awaiting Funding"}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-1">{CONTRACT_DATA.projectName}</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Fund Escrow Account • {CONTRACT_DATA.contractorName}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Total Contract Value
              </div>
              <div className="text-3xl font-bold text-blue-600">
                ${CONTRACT_DATA.totalValue.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Status Timeline */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Escrow Funding Status
            </CardTitle>
            <CardDescription>
              Track your capital transfer to the secure Airwallex escrow account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-12 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>

              {/* Steps */}
              <div className="relative grid grid-cols-4 gap-4">
                {statusSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;

                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div
                        className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all ${
                          isCompleted
                            ? "bg-blue-600 border-blue-600"
                            : isActive
                            ? `${step.bgColor} border-blue-600`
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <StepIcon
                          className={`w-10 h-10 ${
                            isCompleted
                              ? "text-white"
                              : isActive
                              ? step.color
                              : "text-slate-400"
                          } ${step.id === "PENDING_VERIFICATION" && isActive ? "animate-spin" : ""}`}
                        />
                      </div>
                      <div className="mt-4 text-center">
                        <div
                          className={`font-semibold text-sm ${
                            isCompleted || isActive
                              ? "text-slate-900 dark:text-slate-100"
                              : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {step.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Status Message */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-1">
                    {paymentStatus === "AWAITING_TRANSFER" &&
                      "Transfer funds to the account below to activate escrow"}
                    {paymentStatus === "TRANSFER_INITIATED" &&
                      "Your transfer is being processed (typically 1-3 business days)"}
                    {paymentStatus === "PENDING_VERIFICATION" &&
                      "We're verifying the incoming funds. This usually takes 5-10 minutes."}
                    {paymentStatus === "CAPITAL_ESCROWED" &&
                      "Funds are now securely escrowed and will be released milestone-by-milestone"}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {paymentStatus === "AWAITING_TRANSFER" &&
                      "Use the account details below to initiate a wire transfer or ACH payment from your business bank account."}
                    {paymentStatus === "TRANSFER_INITIATED" &&
                      "ACH transfers typically take 2-3 business days. Wire transfers are usually same-day or next-day."}
                    {paymentStatus === "PENDING_VERIFICATION" &&
                      "Our banking partner Airwallex is confirming receipt of funds. You'll receive an email once verified."}
                    {paymentStatus === "CAPITAL_ESCROWED" &&
                      "Your contractor can now start work. Payments will release automatically upon milestone completion + biometric verification."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* US Domestic (ACH) */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-green-600" />
                    US Domestic (ACH)
                  </CardTitle>
                  <CardDescription className="mt-1">
                    For transfers within the United States (2-3 business days)
                  </CardDescription>
                </div>
                <Badge variant="success">Recommended</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      Routing Number (ABA)
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          AIRWALLEX_ACCOUNT.routingNumber,
                          "routing"
                        )
                      }
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {copiedField === "routing" ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-lg font-bold">
                    {AIRWALLEX_ACCOUNT.routingNumber}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      Account Number
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          AIRWALLEX_ACCOUNT.accountNumber,
                          "account"
                        )
                      }
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {copiedField === "account" ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-lg font-bold">
                    {AIRWALLEX_ACCOUNT.accountNumber}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Account Type
                  </div>
                  <div className="font-medium">
                    {AIRWALLEX_ACCOUNT.accountType}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Account Name
                  </div>
                  <div className="font-medium text-sm">
                    {AIRWALLEX_ACCOUNT.accountName}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p className="font-semibold">ACH Transfer Instructions:</p>
                <ul className="space-y-1 ml-4">
                  <li>1. Log into your business bank account</li>
                  <li>2. Initiate ACH transfer or bill payment</li>
                  <li>3. Enter routing and account numbers above</li>
                  <li>4. Set amount: ${CONTRACT_DATA.totalValue.toLocaleString()}</li>
                  <li>5. Include reference: {CONTRACT_DATA.id}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* International Wire */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                International Wire Transfer
              </CardTitle>
              <CardDescription className="mt-1">
                For international transfers (same-day to 1 business day)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      SWIFT / BIC Code
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(AIRWALLEX_ACCOUNT.swiftCode, "swift")
                      }
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {copiedField === "swift" ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-lg font-bold">
                    {AIRWALLEX_ACCOUNT.swiftCode}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Bank Name
                  </div>
                  <div className="font-medium">{AIRWALLEX_ACCOUNT.bankName}</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Bank Address
                  </div>
                  <div className="text-sm">
                    {AIRWALLEX_ACCOUNT.bankAddress}
                    <br />
                    {AIRWALLEX_ACCOUNT.bankCity}, {AIRWALLEX_ACCOUNT.bankState}{" "}
                    {AIRWALLEX_ACCOUNT.bankZip}
                    <br />
                    {AIRWALLEX_ACCOUNT.bankCountry}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Account Number (IBAN)
                  </div>
                  <div className="font-mono text-sm">
                    {AIRWALLEX_ACCOUNT.accountNumber}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p className="font-semibold">Wire Transfer Instructions:</p>
                <ul className="space-y-1 ml-4">
                  <li>1. Contact your bank's wire transfer department</li>
                  <li>2. Provide SWIFT code and bank details above</li>
                  <li>3. Beneficiary: {AIRWALLEX_ACCOUNT.accountName}</li>
                  <li>4. Amount: ${CONTRACT_DATA.totalValue.toLocaleString()} USD</li>
                  <li>5. Reference: {CONTRACT_DATA.id}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contract Summary */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Milestone Breakdown
            </CardTitle>
            <CardDescription>
              Funds will be released incrementally as milestones are completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {CONTRACT_DATA.milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium text-sm">{milestone.title}</span>
                  </div>
                  <span className="font-bold text-green-600">
                    ${milestone.amount.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-900">
                <span className="font-bold">Total Contract Value</span>
                <span className="font-bold text-xl text-blue-600">
                  ${CONTRACT_DATA.totalValue.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 border-orange-200 dark:border-orange-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-400">
                <AlertCircle className="w-5 h-5" />
                Important Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>
                    <strong>Include the contract reference</strong> (
                    {CONTRACT_DATA.id}) in your transfer memo to ensure proper
                    routing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>
                    <strong>Transfer the exact amount</strong> ($
                    {CONTRACT_DATA.totalValue.toLocaleString()}) - partial
                    funding is not supported
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>
                    <strong>Funds are non-refundable</strong> once escrowed -
                    only released via milestone completion
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>
                    <strong>International wires</strong> may incur additional
                    fees from your bank (typically $20-50)
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 dark:border-green-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400">
                <Shield className="w-5 h-5" />
                Security & Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>
                    <strong>Bank-grade encryption</strong> - All transfers
                    secured with 256-bit SSL/TLS encryption
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>
                    <strong>PCI-DSS Level 1 compliant</strong> - Highest
                    security standard for payment processing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>
                    <strong>Segregated accounts</strong> - Your funds are held
                    separately from VettedPay operating capital
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>
                    <strong>FDIC protection</strong> - Funds held at FDIC-insured
                    partner banks
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <Button variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download Wire Instructions (PDF)
          </Button>
          <Button variant="outline" className="flex-1">
            <ExternalLink className="w-4 h-4 mr-2" />
            Need Help? Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}
