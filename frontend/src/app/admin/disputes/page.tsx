'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Gavel, AlertTriangle, Clock, DollarSign, Users, ArrowRight, Filter, Search } from 'lucide-react';

interface Dispute {
  disputeId: string;
  contractId: string;
  buyerName: string;
  contractorName: string;
  amountUSD: number;
  milestoneTitle: string;
  submittedAt: string;
  submittedBy: 'BUSINESS' | 'TALENT';
  status: 'PENDING' | 'RESOLVED';
}

// Mock data - replace with actual API call
const mockDisputes: Dispute[] = [
  {
    disputeId: "DISP-9982-X",
    contractId: "CONT-0012-A",
    buyerName: "Apex Software Ventures LLC",
    contractorName: "Tunde Balogun",
    amountUSD: 12500.00,
    milestoneTitle: "Milestone 3: Production DevOps Deployment",
    submittedAt: "2026-07-19T14:30:00Z",
    submittedBy: 'BUSINESS',
    status: 'PENDING'
  },
  {
    disputeId: "DISP-9981-X",
    contractId: "CONT-0011-B",
    buyerName: "TechStartup Inc",
    contractorName: "Amara Okoye",
    amountUSD: 8000.00,
    milestoneTitle: "Milestone 2: Backend API Integration",
    submittedAt: "2026-07-18T10:15:00Z",
    submittedBy: 'TALENT',
    status: 'PENDING'
  },
  {
    disputeId: "DISP-9980-X",
    contractId: "CONT-0010-C",
    buyerName: "FinTech Solutions Ltd",
    contractorName: "Chidi Nwosu",
    amountUSD: 15000.00,
    milestoneTitle: "Milestone 4: Security Audit Implementation",
    submittedAt: "2026-07-17T16:45:00Z",
    submittedBy: 'BUSINESS',
    status: 'PENDING'
  }
];

export default function AdminDisputesListPage() {
  const [disputes] = useState<Dispute[]>(mockDisputes);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDisputes = disputes.filter(dispute => {
    const matchesFilter = filter === 'ALL' || dispute.status === filter;
    const matchesSearch = searchQuery === '' || 
      dispute.disputeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.contractId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.contractorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const pendingCount = disputes.filter(d => d.status === 'PENDING').length;
  const totalEscrow = disputes
    .filter(d => d.status === 'PENDING')
    .reduce((sum, d) => sum + d.amountUSD, 0);

  return (
    <div className="min-h-screen bg-[#07090E] text-[#E5E7EB] font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <Gavel className="w-8 h-8 text-[#10B981]" />
              Dispute Arbitration Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-1">Active settlement interventions requiring admin resolution</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-sm font-semibold">
              {pendingCount} Active
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0F131E] border border-[#1E2538] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wider">Pending Disputes</p>
                <p className="text-3xl font-black text-white mt-2">{pendingCount}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
          </div>

          <div className="bg-[#0F131E] border border-[#1E2538] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wider">Total Escrow Locked</p>
                <p className="text-3xl font-black text-[#10B981] mt-2">${totalEscrow.toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 text-[#10B981]" />
            </div>
          </div>

          <div className="bg-[#0F131E] border border-[#1E2538] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wider">Affected Parties</p>
                <p className="text-3xl font-black text-white mt-2">{pendingCount * 2}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-[#0F131E] border border-[#1E2538] rounded-xl p-4 flex flex-col md:flex-row gap-4">
          {/* Filter Buttons */}
          <div className="flex gap-2">
            {(['ALL', 'PENDING', 'RESOLVED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  filter === status
                    ? 'bg-[#10B981] text-black'
                    : 'bg-[#161C2C] text-gray-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by dispute ID, contract ID, or party name..."
              className="w-full bg-[#161C2C] border border-[#1E2538] rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#10B981]/50 transition-colors"
            />
          </div>
        </div>

        {/* Disputes List */}
        <div className="space-y-4">
          {filteredDisputes.length === 0 ? (
            <div className="bg-[#0F131E] border border-[#1E2538] rounded-xl p-12 text-center">
              <Gavel className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No disputes found matching your filters.</p>
            </div>
          ) : (
            filteredDisputes.map((dispute) => (
              <div
                key={dispute.disputeId}
                className="bg-[#0F131E] border border-[#1E2538] hover:border-[#10B981]/30 rounded-xl p-6 transition-all hover:shadow-lg"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Dispute Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-mono bg-[#1E2538] px-2 py-1 rounded text-gray-400">
                        {dispute.disputeId}
                      </span>
                      <span className="text-xs font-mono bg-[#1E2538] px-2 py-1 rounded text-gray-400">
                        {dispute.contractId}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        dispute.submittedBy === 'BUSINESS'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        Disputed by: {dispute.submittedBy === 'BUSINESS' ? 'Buyer' : 'Contractor'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{dispute.milestoneTitle}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-[#9CA3AF] font-semibold">Buyer (Enterprise)</p>
                        <p className="text-white">{dispute.buyerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9CA3AF] font-semibold">Contractor (Talent)</p>
                        <p className="text-white">{dispute.contractorName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Amount & Time */}
                  <div className="flex flex-col items-start lg:items-center gap-2">
                    <p className="text-2xl font-black text-[#10B981]">
                      ${dispute.amountUSD.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(dispute.submittedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Right: Action Button */}
                  <Link
                    href={`/admin/disputes/${dispute.disputeId}`}
                    className="bg-[#10B981] hover:bg-[#059669] text-black font-bold py-3 px-6 rounded-lg text-sm transition shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>Review & Resolve</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
