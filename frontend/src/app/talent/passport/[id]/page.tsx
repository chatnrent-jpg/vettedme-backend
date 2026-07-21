'use client';

import React, { useState } from 'react';
import { ShieldCheck, Cpu, Code, Clock, Globe, ArrowUpRight, Copy, Share2, ExternalLink } from 'lucide-react';

// Mock data - replace with actual API call from backend
const getPassportData = (id: string) => {
  return {
    fullName: "Chidi Okafor",
    profileId: id,
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ChidiOkafor",
    verificationHash: "0x7f3b9a2e8c1d4f6a9b3e5c7d2f4a6b8c9d1e3f5a7b9c2d4e6f8a1b3c5d7e9f2",
    verificationTimestamp: "2026-07-10T14:30:00Z",
    scores: {
      portfolioAudit: 85,  // Tier 1: GitHub Portfolio Audit
      sandboxLab: 92,      // Tier 2: Sandbox Code Lab
      videoViva: 96,       // Tier 3: AI Technical Viva
      aggregate: 91,       // Overall score
    },
    history: {
      completedMilestones: 12,
      totalVolumeProcessed: "$47,500",
      disputeRate: "0%",
    },
  };
};

interface PassportProps {
  params: {
    id: string;
  };
}

export default function PublicTrustPassportPage({ params }: PassportProps) {
  const talentData = getPassportData(params.id);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${talentData.fullName} - VettedME Trust Passport`,
        text: `Check out ${talentData.fullName}'s verified VettedME Trust Passport`,
        url: window.location.href,
      }).then(() => {
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }).catch(console.error);
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#F3F4F6] font-sans antialiased p-4 md:p-8 flex justify-center items-center">
      <div className="w-full max-w-4xl bg-[#121620] border border-[#1E2538] rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Glow Layer Matrix Element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-[#10B981]/5 to-transparent blur-3xl pointer-events-none" />

        {/* Header Ribbon Component Layout */}
        <div className="border-b border-[#1E2538] p-4 md:p-6 flex flex-wrap justify-between items-center bg-[#161C2C]/50 gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <img 
              src={talentData.avatarUrl} 
              alt={`${talentData.fullName} Avatar`}
              className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-[#10B981] object-cover" 
            />
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">{talentData.fullName}</h1>
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 animate-pulse">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>VettedME Verified</span>
                </span>
              </div>
              <p className="text-xs md:text-sm text-[#9CA3AF] mt-0.5">
                Network Identity Passport ID: <span className="font-mono text-xs text-[#6EE7B7]">{talentData.profileId}</span>
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              onClick={handleShare}
              className="flex-1 md:flex-none flex items-center justify-center space-x-1 bg-[#1E2538] hover:bg-[#2A3550] text-white font-semibold text-sm px-3 py-2 rounded-lg transition shadow-md"
              title="Share Passport"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden md:inline">{shared ? 'Shared!' : 'Share'}</span>
            </button>
            <button 
              onClick={handleCopyLink}
              className="flex-1 md:flex-none flex items-center justify-center space-x-1 bg-[#1E2538] hover:bg-[#2A3550] text-white font-semibold text-sm px-3 py-2 rounded-lg transition shadow-md"
              title="Copy Link"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden md:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center space-x-1 bg-[#10B981] hover:bg-[#059669] text-black font-semibold text-sm px-4 py-2 rounded-lg transition shadow-md">
              <span className="hidden md:inline">Hire Direct</span>
              <span className="md:hidden">Hire</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Dashboard Data Metrics Grid Block Layout */}
        <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-10">
          
          {/* Section A: Inbuilt Automated Skill Assessment Engine Data Logs */}
          <div className="space-y-6">
            <h2 className="text-base md:text-lg font-bold text-white flex items-center space-x-2 tracking-wide">
              <Cpu className="w-5 h-5 text-[#10B981]" />
              <span>Automated Skill Evaluation Logs</span>
            </h2>
            
            <div className="space-y-4">
              {[
                { label: 'Tier 1: GitHub & Portfolio API Audit', score: talentData.scores.portfolioAudit, icon: <Globe className="w-4 h-4 text-blue-400" /> },
                { label: 'Tier 2: Sandbox Testing Engine Lab', score: talentData.scores.sandboxLab, icon: <Code className="w-4 h-4 text-purple-400" /> },
                { label: 'Tier 3: Dynamic Voice/Biometric Viva', score: talentData.scores.videoViva, icon: <ShieldCheck className="w-4 h-4 text-orange-400" /> },
              ].map((item, idx) => (
                <div key={idx} className="bg-[#161C2C] p-4 rounded-xl border border-[#1E2538] hover:border-[#10B981]/30 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs md:text-sm font-medium text-[#D1D5DB] flex items-center space-x-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    <span className="text-sm font-bold text-white">{item.score}%</span>
                  </div>
                  <div className="w-full bg-[#1E2538] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#10B981] to-[#34D399] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${item.score}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Core Aggregate Matrix Block Card Layout */}
            <div className="bg-gradient-to-r from-[#10B981]/10 to-transparent p-4 rounded-xl border border-[#10B981]/20 flex justify-between items-center hover:border-[#10B981]/40 transition-colors">
              <div>
                <p className="text-xs uppercase text-[#9CA3AF] font-bold tracking-wider">Verified System Aggregate Score</p>
                <p className="text-xs text-[#6EE7B7] mt-0.5">Top 1.5% of verified African technical workforce</p>
              </div>
              <p className="text-3xl font-black text-[#10B981] tracking-tight">{talentData.scores.aggregate}%</p>
            </div>
          </div>

          {/* Section B: Historic VettedPay Transaction Delivery Tracking Records */}
          <div className="space-y-6">
            <h2 className="text-base md:text-lg font-bold text-white flex items-center space-x-2 tracking-wide">
              <Clock className="w-5 h-5 text-[#10B981]" />
              <span>VettedPay Ledger History</span>
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#161C2C] p-4 md:p-5 rounded-xl border border-[#1E2538] text-center hover:border-[#10B981]/30 transition-colors">
                <p className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Milestones Passed</p>
                <p className="text-2xl font-extrabold text-white mt-2">{talentData.history.completedMilestones}</p>
              </div>
              <div className="bg-[#161C2C] p-4 md:p-5 rounded-xl border border-[#1E2538] text-center hover:border-[#10B981]/30 transition-colors">
                <p className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Volume Settled</p>
                <p className="text-2xl font-extrabold text-white mt-2">{talentData.history.totalVolumeProcessed}</p>
              </div>
            </div>

            <div className="bg-[#161C2C] p-4 md:p-5 rounded-xl border border-[#1E2538] space-y-3 hover:border-[#10B981]/30 transition-colors">
              <div className="flex justify-between text-sm">
                <span className="text-[#9CA3AF]">Account Dispute Ratio:</span>
                <span className="font-semibold font-mono text-emerald-400">{talentData.history.disputeRate}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-[#1E2538] pt-3">
                <span className="text-[#9CA3AF]">Signature Form:</span>
                <span className="font-semibold text-white">IRS W-8BEN Vaulted</span>
              </div>
              <div className="flex justify-between text-sm border-t border-[#1E2538] pt-3">
                <span className="text-[#9CA3AF]">Clearing Engine:</span>
                <span className="font-semibold text-white font-mono text-xs">Airwallex API Node v4</span>
              </div>
            </div>

            {/* Trust Badge */}
            <div className="bg-gradient-to-br from-[#10B981]/10 via-[#10B981]/5 to-transparent p-4 rounded-xl border border-[#10B981]/20 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                <span className="text-sm font-bold text-white">Enterprise Trust Badge</span>
              </div>
              <p className="text-xs text-[#9CA3AF]">
                This contractor has passed all 3 tiers of VettedME skill assessment and maintains a perfect payment delivery record.
              </p>
            </div>
          </div>

        </div>

        {/* Cryptographic Compliance Ledger Signature Bottom Bar Element */}
        <div className="border-t border-[#1E2538] p-4 md:p-5 bg-[#0E111A] flex flex-col md:flex-row justify-between items-center text-xs text-[#6B7280] gap-3 relative z-10">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-hidden">
            <span className="whitespace-nowrap">Cryptographic Signature Ledger Hash:</span>
            <span className="font-mono text-gray-400 bg-black/30 px-2 py-0.5 rounded truncate">
              {talentData.verificationHash}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>Last Audited: <span className="text-gray-400">{new Date(talentData.verificationTimestamp).toLocaleString()}</span></span>
            <a 
              href={`https://etherscan.io/tx/${talentData.verificationHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#10B981] hover:text-[#34D399] transition-colors"
              title="View on Blockchain"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden md:inline">Verify</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
