'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Gavel, RefreshCw, FileText, CheckCircle, Ban, ExternalLink, Clock, DollarSign } from 'lucide-react';

interface DisputePayload {
  disputeId: string;
  contractId: string;
  buyerName: string;
  contractorName: string;
  amountUSD: number;
  milestoneTitle: string;
  disputeReason: string;
  biometricMatchScore: number;
  taxFormSigned: boolean;
  submittedAt: string;
  submittedBy: 'BUSINESS' | 'TALENT';
  evidence?: string[];
}

interface AdminArbitrationPanelProps {
  caseData?: DisputePayload;
  onResolve?: (disputeId: string, resolution: 'REFUND_BUYER' | 'PAY_CONTRACTOR', notes?: string) => Promise<void>;
}

export default function AdminArbitrationPanel({ caseData: propCaseData, onResolve }: AdminArbitrationPanelProps) {
  const [caseData] = useState<DisputePayload>(propCaseData || {
    disputeId: "DISP-9982-X",
    contractId: "CONT-0012-A",
    buyerName: "Apex Software Ventures LLC (US)",
    contractorName: "Tunde Balogun (Nigeria)",
    amountUSD: 12500.00,
    milestoneTitle: "Milestone 3: Production DevOps Deployment & AI Pipeline Sync",
    disputeReason: "Buyer asserts the pipeline latency profile exceeds written agreement SLA metrics. Contractor claims the infrastructure limits stem entirely from client-side cloud misconfiguration.",
    biometricMatchScore: 98.4,
    taxFormSigned: true,
    submittedAt: "2026-07-19T14:30:00Z",
    submittedBy: 'BUSINESS',
    evidence: [
      "performance_metrics.pdf",
      "sla_agreement.pdf",
      "contractor_response.pdf"
    ]
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedResolution, setSelectedResolution] = useState<'REFUND_BUYER' | 'PAY_CONTRACTOR' | null>(null);

  const resolveDispute = async (allocationRoute: 'REFUND_BUYER' | 'PAY_CONTRACTOR') => {
    setIsProcessing(true);
    
    try {
      if (onResolve) {
        await onResolve(caseData.disputeId, allocationRoute, resolutionNotes);
      } else {
        // Simulate API call for demo
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`Dispute ${caseData.disputeId} resolved: ${allocationRoute}`);
      }
      
      alert(`✅ Dispute Settlement Complete\n\nFunds routed securely via ${allocationRoute}\nDispute ID: ${caseData.disputeId}`);
      setResolutionNotes('');
      setSelectedResolution(null);
    } catch (error) {
      console.error('Resolution failed:', error);
      alert('❌ Resolution failed. Please try again or contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-[#E5E7EB] font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Banner Alert Banner Element Layout */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-amber-500 font-bold text-xs md:text-sm tracking-wide">ACTIVE SETTLEMENT SYSTEM INTERVENTION REQUIRED</h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">Automated settlement ledger execution loop paused for Dispute Reference Node ID: {caseData.disputeId}.</p>
          </div>
        </div>

        {/* Layout Column Matrix Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Case Review Module Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0F131E] border border-[#1E2538] rounded-xl p-4 md:p-6 space-y-6 shadow-xl">
              <div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-mono bg-[#1E2538] px-2 py-1 rounded text-gray-400">
                    Target Contract: {caseData.contractId}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    caseData.submittedBy === 'BUSINESS' 
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    Disputed by: {caseData.submittedBy === 'BUSINESS' ? 'Buyer' : 'Contractor'}
                  </span>
                </div>
                <h1 className="text-lg md:text-xl font-black text-white mt-3 tracking-tight">{caseData.milestoneTitle}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <p className="text-xl md:text-2xl font-black text-[#10B981]">
                    ${caseData.amountUSD.toLocaleString()} USD 
                    <span className="text-xs font-normal text-gray-400 ml-2">Escrow Locked</span>
                  </p>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(caseData.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-[#1E2538] py-4 text-sm">
                <div>
                  <p className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wider">Enterprise Buyer (Depositor)</p>
                  <p className="text-white font-medium mt-1">{caseData.buyerName}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wider">Offshore Contractor (Beneficiary)</p>
                  <p className="text-white font-medium mt-1">{caseData.contractorName}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wider">Official Case Manifest Log</h4>
                <p className="text-sm bg-[#161C2C] p-4 rounded-lg border border-[#1E2538] leading-relaxed text-gray-300">
                  {caseData.disputeReason}
                </p>
              </div>

              {/* Evidence Files */}
              {caseData.evidence && caseData.evidence.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wider">Submitted Evidence</h4>
                  <div className="space-y-2">
                    {caseData.evidence.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-[#161C2C] p-3 rounded-lg border border-[#1E2538] hover:border-[#10B981]/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-300">{file}</span>
                        </div>
                        <button className="text-xs text-[#10B981] hover:text-[#34D399] flex items-center gap-1 transition-colors">
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-2">
                <h4 className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wider">Admin Resolution Notes</h4>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter resolution notes for audit trail (optional but recommended)..."
                  className="w-full bg-[#161C2C] border border-[#1E2538] rounded-lg p-3 text-sm text-gray-300 focus:outline-none focus:border-[#10B981]/50 transition-colors resize-none"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Compliance Validation Parameters Sidebar Element Module */}
          <div className="space-y-6">
            <div className="bg-[#0F131E] border border-[#1E2538] rounded-xl p-4 md:p-6 space-y-6 shadow-xl relative overflow-hidden">
              <h2 className="text-xs md:text-sm font-bold text-white flex items-center space-x-2 tracking-wide uppercase border-b border-[#1E2538] pb-3">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Validation Ledger Hashes</span>
              </h2>

              <div className="space-y-4">
                <div className="bg-[#161C2C] p-4 rounded-lg border border-[#1E2538] flex justify-between items-center hover:border-[#10B981]/30 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-xs text-[#9CA3AF] font-semibold">VettedME Face Match</p>
                    <p className="text-xs text-gray-400 font-mono">Biometric Identity Verification</p>
                  </div>
                  <span className="text-lg font-black text-[#10B981]">{caseData.biometricMatchScore}%</span>
                </div>

                <div className="bg-[#161C2C] p-4 rounded-lg border border-[#1E2538] flex justify-between items-center hover:border-[#10B981]/30 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-xs text-[#9CA3AF] font-semibold">IRS W-8BEN Status</p>
                    <p className="text-xs text-gray-400 font-mono">Automated Tax Clearance</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-[#10B981]" />
                </div>

                <div className="bg-[#161C2C] p-4 rounded-lg border border-[#1E2538]">
                  <p className="text-xs text-[#9CA3AF] font-semibold mb-2">Escrow Balance</p>
                  <p className="text-2xl font-black text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#10B981]" />
                    {caseData.amountUSD.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Available for settlement</p>
                </div>
              </div>

              {/* Action Executive Trigger Execution Interfaces Block Element */}
              <div className="pt-2 space-y-3">
                <h4 className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wider text-center flex justify-center items-center gap-1.5">
                  <Gavel className="w-3.5 h-3.5" />
                  <span>Execute Binding Settlement</span>
                </h4>
                
                <button 
                  disabled={isProcessing}
                  onClick={() => resolveDispute('PAY_CONTRACTOR')}
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-black font-bold py-2.5 px-4 rounded-lg text-sm transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isProcessing && selectedResolution === 'PAY_CONTRACTOR' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Release Funds to Contractor</span>
                </button>

                <button 
                  disabled={isProcessing}
                  onClick={() => resolveDispute('REFUND_BUYER')}
                  className="w-full bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/30 font-bold py-2.5 px-4 rounded-lg text-sm transition flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isProcessing && selectedResolution === 'REFUND_BUYER' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}
                  <span>Execute Full Refund to Buyer</span>
                </button>

                <p className="text-xs text-center text-gray-500 mt-4">
                  ⚠️ Settlement is final and cannot be reversed. All actions are logged in the immutable audit trail.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
