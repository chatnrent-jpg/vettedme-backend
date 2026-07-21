"use client";

import { useState } from "react";
import {
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContractorPassportModal } from "@/components/ContractorPassportModal";
import { CreateMilestoneContractModal } from "@/components/CreateMilestoneContractModal";
import { ReleaseMilestoneHandshakeModal } from "@/components/ReleaseMilestoneHandshakeModal";

// Mock data
const MOCK_CONTRACTORS = [
  {
    id: "1",
    name: "Chidi Okafor",
    location: "Lagos, Nigeria",
    joinedDate: "Jun 2026",
    trustScore: 94,
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
    tier1Score: 85,
    tier2Score: 92,
    tier3Score: 96,
    contractsCompleted: 2,
    averageRating: 5.0,
    totalEarned: 23500,
  },
  {
    id: "2",
    name: "Amara Nwankwo",
    location: "Abuja, Nigeria",
    joinedDate: "May 2026",
    trustScore: 91,
    skills: ["Python", "Django", "AWS", "Docker"],
    tier1Score: 88,
    tier2Score: 89,
    tier3Score: 94,
    contractsCompleted: 3,
    averageRating: 4.9,
    totalEarned: 34200,
  },
];

const MOCK_CONTRACTS = [
  {
    id: "CTR-2026-001",
    projectName: "E-commerce Platform Rebuild",
    contractor: MOCK_CONTRACTORS[0],
    totalValue: 15000,
    fundsLocked: 15000,
    currency: "USD",
    status: "IN_PROGRESS" as const,
    currentMilestone: 3,
    totalMilestones: 5,
    milestonesCompleted: 2,
    nextPayoutDate: "2026-07-25",
    startDate: "2026-06-01",
    estimatedCompletion: "2026-08-30",
  },
  {
    id: "CTR-2026-002",
    projectName: "Mobile App Backend API",
    contractor: MOCK_CONTRACTORS[1],
    totalValue: 8500,
    fundsLocked: 8500,
    currency: "USD",
    status: "AWAITING_VERIFICATION" as const,
    currentMilestone: 2,
    totalMilestones: 3,
    milestonesCompleted: 1,
    nextPayoutDate: "2026-07-22",
    startDate: "2026-06-15",
    estimatedCompletion: "2026-07-31",
  },
  {
    id: "CTR-2026-003",
    projectName: "DevOps Pipeline Setup",
    contractor: MOCK_CONTRACTORS[0],
    totalValue: 6000,
    fundsLocked: 6000,
    currency: "USD",
    status: "COMPLETED" as const,
    currentMilestone: 4,
    totalMilestones: 4,
    milestonesCompleted: 4,
    nextPayoutDate: null,
    startDate: "2026-05-01",
    estimatedCompletion: "2026-06-15",
  },
];

export default function BusinessDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false);
  const [isCreateContractModalOpen, setIsCreateContractModalOpen] =
    useState(false);
  const [isHandshakeModalOpen, setIsHandshakeModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);

  const handleViewPassport = (contractor: any) => {
    setSelectedContractor(contractor);
    setIsPassportModalOpen(true);
  };

  const handleCreateContract = (data: any) => {
    console.log("Creating contract:", data);
    // In production: POST /api/v1/vettedpay/contracts
    alert(
      `Contract created!\n\nPassport ID: ${data.passportId}\nProject: ${data.projectName}\nMilestones: ${data.milestones.length}\nTotal: $${data.milestones.reduce((sum: number, m: any) => sum + parseFloat(m.amount || 0), 0).toLocaleString()}\n\nAirwallex virtual wallet provisioned successfully!`
    );
  };

  const handleReleaseMilestone = (milestone: any, contractor: any) => {
    setSelectedMilestone({
      milestone,
      contractor,
      contractId: "CTR-2026-004",
    });
    setIsHandshakeModalOpen(true);
  };

  const handleMilestoneReleased = () => {
    console.log("Milestone released successfully!");
    setIsHandshakeModalOpen(false);
    // In production: Refresh contract data
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            In Progress
          </Badge>
        );
      case "AWAITING_VERIFICATION":
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Awaiting Verification
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Completed
          </Badge>
        );
      case "DISPUTED":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Disputed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalFundsLocked = MOCK_CONTRACTS.reduce(
    (sum, c) => sum + c.fundsLocked,
    0
  );
  const activeContractors = new Set(
    MOCK_CONTRACTS.filter((c) => c.status !== "COMPLETED").map(
      (c) => c.contractor.id
    )
  ).size;
  const monthlyPayouts = MOCK_CONTRACTS.filter(
    (c) => c.status === "COMPLETED"
  ).reduce((sum, c) => sum + c.totalValue, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">VettedPay Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage your milestone-based contractor payments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button onClick={() => setIsCreateContractModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Contract
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* KPI Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Total Milestone Funds Locked"
            value={totalFundsLocked}
            icon={DollarSign}
            currency
            subtitle="Across all active contracts"
            trend={{
              value: 12.5,
              label: "vs last month",
              isPositive: true,
            }}
          />
          <MetricCard
            title="Active Vetted Contractors"
            value={activeContractors}
            icon={Users}
            subtitle="Currently engaged"
            trend={{
              value: 8.3,
              label: "vs last month",
              isPositive: true,
            }}
          />
          <MetricCard
            title="Monthly Programmatic Payouts"
            value={monthlyPayouts}
            icon={TrendingUp}
            currency
            subtitle="Settled this month"
            trend={{
              value: 23.1,
              label: "vs last month",
              isPositive: true,
            }}
          />
        </div>

        {/* Active Contracts Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Contracts & Milestones</CardTitle>
                <CardDescription>
                  Track your milestone-based agreements and payout schedules
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search contracts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract ID</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Milestones</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Payout</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_CONTRACTS.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-mono text-sm">
                      {contract.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contract.projectName}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Started {contract.startDate}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {contract.contractor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {contract.contractor.name}
                          </div>
                          <button
                            onClick={() =>
                              handleViewPassport(contract.contractor)
                            }
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View Passport
                          </button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ${contract.totalValue.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {contract.currency}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            {contract.milestonesCompleted} /{" "}
                            {contract.totalMilestones}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            M{contract.currentMilestone}
                          </Badge>
                        </div>
                        <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600"
                            style={{
                              width: `${
                                (contract.milestonesCompleted /
                                  contract.totalMilestones) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell>
                      {contract.nextPayoutDate ? (
                        <div className="text-sm">
                          {contract.nextPayoutDate}
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            in 6 days
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      Milestone 2 Completed
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      E-commerce Platform Rebuild • Chidi Okafor
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-400 mt-1">
                      $3,000 released • 2 hours ago
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">
                        Milestone 2 Completed - Awaiting Release
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleReleaseMilestone(
                            {
                              id: "M2",
                              number: 2,
                              title: "Database Schema & Models",
                              amount: 3000,
                              deliverables: [
                                "Database schema designed",
                                "Models implemented in Prisma",
                                "Migrations created and tested",
                              ],
                              completedAt: "2026-07-19 14:30",
                            },
                            MOCK_CONTRACTORS[0]
                          )
                        }
                        className="text-xs"
                      >
                        Review & Release
                      </Button>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Mobile App Backend API • Amara Nwankwo
                    </div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                      Contractor marked complete • 1 day ago
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      Milestone 3 In Progress
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      E-commerce Platform Rebuild • Chidi Okafor
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                      Expected completion: Jul 25
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payout Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Jul 22, 2026</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Mobile App Backend API
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">$2,833</div>
                    <Badge variant="warning" className="text-xs">
                      Pending
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Jul 25, 2026</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      E-commerce Platform Rebuild
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">$3,000</div>
                    <Badge variant="outline" className="text-xs">
                      Scheduled
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Aug 5, 2026</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      E-commerce Platform Rebuild
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">$3,000</div>
                    <Badge variant="outline" className="text-xs">
                      Scheduled
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ContractorPassportModal
        contractor={selectedContractor}
        isOpen={isPassportModalOpen}
        onClose={() => setIsPassportModalOpen(false)}
      />

      <CreateMilestoneContractModal
        isOpen={isCreateContractModalOpen}
        onClose={() => setIsCreateContractModalOpen(false)}
        onSubmit={handleCreateContract}
      />

      {selectedMilestone && (
        <ReleaseMilestoneHandshakeModal
          isOpen={isHandshakeModalOpen}
          onClose={() => setIsHandshakeModalOpen(false)}
          milestone={selectedMilestone.milestone}
          contractor={selectedMilestone.contractor}
          contractId={selectedMilestone.contractId}
          onRelease={handleMilestoneReleased}
        />
      )}
    </div>
  );
}
