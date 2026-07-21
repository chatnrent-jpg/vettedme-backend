'use client';

import { use } from 'react';
import AdminArbitrationPanel from '@/components/AdminArbitrationPanel';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// In a real app, fetch dispute data from API
const getDisputeData = async (id: string) => {
  // Simulate API call
  return {
    disputeId: id,
    contractId: `CONT-${id.slice(-4)}`,
    buyerName: "Apex Software Ventures LLC (US)",
    contractorName: "Tunde Balogun (Nigeria)",
    amountUSD: 12500.00,
    milestoneTitle: "Milestone 3: Production DevOps Deployment & AI Pipeline Sync",
    disputeReason: "Buyer asserts the pipeline latency profile exceeds written agreement SLA metrics. Contractor claims the infrastructure limits stem entirely from client-side cloud misconfiguration.",
    biometricMatchScore: 98.4,
    taxFormSigned: true,
    submittedAt: "2026-07-19T14:30:00Z",
    submittedBy: 'BUSINESS' as const,
    evidence: [
      "performance_metrics.pdf",
      "sla_agreement.pdf",
      "contractor_response.pdf"
    ]
  };
};

export default function DisputeArbitrationPage({ params }: PageProps) {
  const resolvedParams = use(params);
  
  // In production, use SWR or React Query for data fetching
  // const { data, isLoading } = useSWR(`/api/v1/disputes/${resolvedParams.id}`, fetcher);

  const handleResolve = async (
    disputeId: string, 
    resolution: 'REFUND_BUYER' | 'PAY_CONTRACTOR',
    notes?: string
  ) => {
    try {
      const response = await fetch(`/api/v1/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}` // Admin token
        },
        body: JSON.stringify({
          resolution,
          notes,
          resolvedBy: 'admin@vetted.com', // Get from auth context
        })
      });

      if (!response.ok) {
        throw new Error('Resolution failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
      throw error;
    }
  };

  return (
    <AdminArbitrationPanel 
      onResolve={handleResolve}
    />
  );
}
