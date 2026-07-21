"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import {
  Download,
  Printer,
  Mail,
  CheckCircle,
  Building2,
  User,
  Calendar,
  DollarSign,
  FileText,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Mock invoice data
const MOCK_INVOICE = {
  id: "INV-2026-07-001",
  contractId: "CTR-2026-004",
  milestoneId: "M2",
  invoiceDate: "2026-07-19",
  dueDate: "2026-07-19",
  paymentDate: "2026-07-19",
  status: "PAID",
  
  // Business Client
  client: {
    name: "TechVentures Inc.",
    address: "1234 Market Street, Suite 500",
    city: "San Francisco, CA 94103",
    country: "United States",
    taxId: "US-EIN-12-3456789",
    email: "finance@techventures.com",
  },
  
  // Contractor
  contractor: {
    name: "Chidi Okafor",
    passportId: "vettedme-abc123xyz",
    location: "Lagos, Nigeria",
    email: "chidi.okafor@example.com",
  },
  
  // Project Details
  project: {
    name: "E-commerce Platform Rebuild",
    milestoneName: "Database Schema & API Integration",
    description: "Complete database schema design, Prisma model implementation, and REST API endpoints",
    startDate: "2026-07-01",
    completedDate: "2026-07-18",
  },
  
  // Financial Breakdown
  financial: {
    milestoneAmount: 3000.00,
    platformFeeRate: 0.15,
    platformFee: 450.00,
    fxSpreadRate: 0.005,
    fxSpread: 15.00,
    contractorPayout: 2535.00,
    currency: "USD",
    
    // FX Conversion Details
    fxConversion: {
      sourceCurrency: "USD",
      targetCurrency: "NGN",
      exchangeRate: 1650.50,
      contractorReceivesLocal: 4183017.50,
      airwallexFee: 12.50,
    },
    
    // Payment Method
    paymentMethod: {
      type: "ACH_TRANSFER",
      accountLast4: "8742",
      transactionId: "ach_1PqY9tKYZjLx2gHs",
      airwallexReference: "AW-CTR-2026-004-M2",
    },
    
    // Timestamps
    escrowLockedAt: "2026-07-01 09:15:00 UTC",
    biometricVerifiedAt: "2026-07-19 14:32:18 UTC",
    paymentReleasedAt: "2026-07-19 14:35:42 UTC",
  },
};

export default function InvoicePage() {
  const params = useParams();
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleDownloadPDF = () => {
    // In production: Generate PDF server-side
    alert("PDF download functionality would be implemented here.\nUse a library like react-pdf or puppeteer for server-side generation.");
  };

  const handleEmailInvoice = () => {
    // In production: Trigger email send
    alert(`Invoice would be emailed to:\n${MOCK_INVOICE.client.email}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Action Bar (Hidden in Print) */}
      <div className="bg-white dark:bg-slate-900 border-b print:hidden sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Invoice {MOCK_INVOICE.id}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Generated on {new Date(MOCK_INVOICE.invoiceDate).toLocaleDateString("en-US", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleEmailInvoice} variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleDownloadPDF} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="container mx-auto px-6 py-8 print:p-0">
        <div className="bg-white dark:bg-slate-900 rounded-lg border print:border-0 print:rounded-none shadow-sm print:shadow-none max-w-4xl mx-auto">
          {/* Invoice Header */}
          <div className="p-8 print:p-12">
            <div className="flex items-start justify-between mb-8">
              {/* VettedPay Branding */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">VettedPay</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Secure Milestone Escrow</div>
                  </div>
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  <div className="font-semibold">VettedPay Technologies Inc.</div>
                  <div>2100 Embarcadero, Suite 300</div>
                  <div>Palo Alto, CA 94303</div>
                  <div>United States</div>
                  <div className="mt-2">support@vettedpay.com</div>
                  <div>+1 (650) 555-0123</div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="text-right">
                <div className="text-3xl font-bold mb-2">INVOICE</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-end gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Invoice #:</span>
                    <span className="font-mono font-semibold">{MOCK_INVOICE.id}</span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Date:</span>
                    <span>{new Date(MOCK_INVOICE.invoiceDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Status:</span>
                    <Badge variant="success" className="print:border print:border-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      PAID
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Bill To / Contractor Info */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Bill To */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">Bill To</h3>
                </div>
                <div className="text-sm space-y-1">
                  <div className="font-semibold text-base">{MOCK_INVOICE.client.name}</div>
                  <div className="text-slate-700 dark:text-slate-300">{MOCK_INVOICE.client.address}</div>
                  <div className="text-slate-700 dark:text-slate-300">{MOCK_INVOICE.client.city}</div>
                  <div className="text-slate-700 dark:text-slate-300">{MOCK_INVOICE.client.country}</div>
                  <div className="mt-2 text-slate-600 dark:text-slate-400">Tax ID: {MOCK_INVOICE.client.taxId}</div>
                  <div className="text-slate-600 dark:text-slate-400">{MOCK_INVOICE.client.email}</div>
                </div>
              </div>

              {/* Contractor Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-lg">Contractor</h3>
                </div>
                <div className="text-sm space-y-1">
                  <div className="font-semibold text-base">{MOCK_INVOICE.contractor.name}</div>
                  <div className="text-slate-700 dark:text-slate-300">{MOCK_INVOICE.contractor.location}</div>
                  <div className="mt-2 text-slate-600 dark:text-slate-400">
                    VettedME Passport: 
                    <span className="font-mono ml-1">{MOCK_INVOICE.contractor.passportId}</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">{MOCK_INVOICE.contractor.email}</div>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border print:bg-slate-50">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold">Project Details</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-600 dark:text-slate-400 mb-1">Contract ID</div>
                  <div className="font-mono font-semibold">{MOCK_INVOICE.contractId}</div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400 mb-1">Milestone ID</div>
                  <div className="font-mono font-semibold">{MOCK_INVOICE.milestoneId}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-slate-600 dark:text-slate-400 mb-1">Project Name</div>
                  <div className="font-semibold">{MOCK_INVOICE.project.name}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-slate-600 dark:text-slate-400 mb-1">Milestone</div>
                  <div>{MOCK_INVOICE.project.milestoneName}</div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400 mb-1">Start Date</div>
                  <div>{new Date(MOCK_INVOICE.project.startDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400 mb-1">Completed Date</div>
                  <div>{new Date(MOCK_INVOICE.project.completedDate).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Financial Breakdown - Line Items */}
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4">Financial Breakdown</h3>
              
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 pb-3 border-b-2 border-slate-300 dark:border-slate-700 font-semibold text-sm">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Type</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              {/* Line Items */}
              <div className="space-y-3 mt-4">
                {/* Milestone Base Amount */}
                <div className="grid grid-cols-12 gap-4 text-sm py-2">
                  <div className="col-span-6">
                    <div className="font-medium">Milestone Contract Amount</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Base payment for completed milestone deliverables
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-slate-600 dark:text-slate-400">
                    100%
                  </div>
                  <div className="col-span-2 text-right">
                    <Badge variant="outline">BASE</Badge>
                  </div>
                  <div className="col-span-2 text-right font-semibold">
                    ${MOCK_INVOICE.financial.milestoneAmount.toLocaleString()}
                  </div>
                </div>

                <Separator className="my-2" />

                {/* Platform Service Fee */}
                <div className="grid grid-cols-12 gap-4 text-sm py-2 bg-blue-50 dark:bg-blue-950/20 -mx-2 px-2 rounded print:bg-blue-50">
                  <div className="col-span-6">
                    <div className="font-medium text-blue-700 dark:text-blue-400">VettedPay Platform Service Fee</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Includes: Biometric verification, escrow management, contract enforcement, dispute resolution, compliance reporting
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-blue-600 dark:text-blue-400 font-semibold">
                    {(MOCK_INVOICE.financial.platformFeeRate * 100).toFixed(1)}%
                  </div>
                  <div className="col-span-2 text-right">
                    <Badge variant="outline" className="border-blue-300 text-blue-700 dark:text-blue-400">PLATFORM FEE</Badge>
                  </div>
                  <div className="col-span-2 text-right font-semibold text-blue-700 dark:text-blue-400">
                    -${MOCK_INVOICE.financial.platformFee.toLocaleString()}
                  </div>
                </div>

                {/* FX Conversion Spread */}
                <div className="grid grid-cols-12 gap-4 text-sm py-2 bg-purple-50 dark:bg-purple-950/20 -mx-2 px-2 rounded print:bg-purple-50">
                  <div className="col-span-6">
                    <div className="font-medium text-purple-700 dark:text-purple-400">International FX Conversion Markup</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Currency exchange fee for USD → NGN conversion via Airwallex
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-purple-600 dark:text-purple-400 font-semibold">
                    {(MOCK_INVOICE.financial.fxSpreadRate * 100).toFixed(2)}%
                  </div>
                  <div className="col-span-2 text-right">
                    <Badge variant="outline" className="border-purple-300 text-purple-700 dark:text-purple-400">FX SPREAD</Badge>
                  </div>
                  <div className="col-span-2 text-right font-semibold text-purple-700 dark:text-purple-400">
                    -${MOCK_INVOICE.financial.fxSpread.toLocaleString()}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Contractor Net Payout */}
                <div className="grid grid-cols-12 gap-4 text-sm py-3 bg-green-50 dark:bg-green-950/20 -mx-2 px-2 rounded print:bg-green-50">
                  <div className="col-span-6">
                    <div className="font-semibold text-green-800 dark:text-green-400 text-base">Net Contractor Payout (USD)</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Amount transferred to contractor after platform fees
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-slate-600 dark:text-slate-400">
                    {((MOCK_INVOICE.financial.contractorPayout / MOCK_INVOICE.financial.milestoneAmount) * 100).toFixed(1)}%
                  </div>
                  <div className="col-span-2 text-right">
                    <Badge variant="success" className="print:border print:border-green-600">PAYOUT</Badge>
                  </div>
                  <div className="col-span-2 text-right font-bold text-green-700 dark:text-green-400 text-base">
                    ${MOCK_INVOICE.financial.contractorPayout.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* FX Conversion Details */}
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4">Currency Conversion Details</h3>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border print:bg-slate-50">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Source Currency:</span>
                        <span className="font-semibold">{MOCK_INVOICE.financial.fxConversion.sourceCurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Target Currency:</span>
                        <span className="font-semibold">{MOCK_INVOICE.financial.fxConversion.targetCurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Exchange Rate:</span>
                        <span className="font-semibold">{MOCK_INVOICE.financial.fxConversion.exchangeRate.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Airwallex Processing Fee:</span>
                        <span className="font-semibold">${MOCK_INVOICE.financial.fxConversion.airwallexFee.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center md:justify-end">
                    <div className="text-center md:text-right">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Contractor Receives (Local Currency)</div>
                      <div className="text-2xl font-bold text-green-600">
                        ₦{MOCK_INVOICE.financial.fxConversion.contractorReceivesLocal.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Nigerian Naira
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Payment Information */}
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4">Payment Information</h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <div>
                    <div className="text-slate-600 dark:text-slate-400 mb-1">Payment Method</div>
                    <div className="font-semibold">{MOCK_INVOICE.financial.paymentMethod.type.replace(/_/g, ' ')}</div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400 mb-1">Account Number</div>
                    <div className="font-mono">****{MOCK_INVOICE.financial.paymentMethod.accountLast4}</div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400 mb-1">Transaction ID</div>
                    <div className="font-mono text-xs break-all">{MOCK_INVOICE.financial.paymentMethod.transactionId}</div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400 mb-1">Airwallex Reference</div>
                    <div className="font-mono text-xs">{MOCK_INVOICE.financial.paymentMethod.airwallexReference}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-slate-600 dark:text-slate-400 mb-1">Escrow Locked</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(MOCK_INVOICE.financial.escrowLockedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400 mb-1">Biometric Verified</div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span>{new Date(MOCK_INVOICE.financial.biometricVerifiedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400 mb-1">Payment Released</div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{new Date(MOCK_INVOICE.financial.paymentReleasedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Revenue Summary (For Internal Records) */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900 print:bg-blue-50">
              <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-3">Platform Revenue Summary</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-white dark:bg-slate-900 rounded border print:bg-white">
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Platform Service Fee</div>
                  <div className="text-xl font-bold text-blue-600">${MOCK_INVOICE.financial.platformFee.toFixed(2)}</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-slate-900 rounded border print:bg-white">
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">FX Conversion Spread</div>
                  <div className="text-xl font-bold text-purple-600">${MOCK_INVOICE.financial.fxSpread.toFixed(2)}</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-slate-900 rounded border print:bg-white">
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Platform Revenue</div>
                  <div className="text-xl font-bold text-green-600">
                    ${(MOCK_INVOICE.financial.platformFee + MOCK_INVOICE.financial.fxSpread).toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    ({(((MOCK_INVOICE.financial.platformFee + MOCK_INVOICE.financial.fxSpread) / MOCK_INVOICE.financial.milestoneAmount) * 100).toFixed(2)}% effective rate)
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <div className="font-semibold mb-3">Terms & Conditions</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>Payment processed via VettedPay secure escrow infrastructure</li>
                <li>Biometric verification completed via Smile ID (Nigeria NIN/BVN registries)</li>
                <li>Currency conversion executed through Airwallex cross-border payment rails</li>
                <li>Platform service fee includes: identity verification, escrow management, dispute resolution, compliance reporting</li>
                <li>All payments are non-refundable once biometric handshake is confirmed</li>
                <li>For questions regarding this invoice, contact support@vettedpay.com</li>
              </ul>
              
              <div className="mt-6 pt-4 border-t text-center">
                <div className="font-semibold">Thank you for using VettedPay!</div>
                <div className="mt-1">Secure, Transparent, Global Talent Payment Infrastructure</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
