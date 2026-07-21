"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Shield,
  CheckCircle,
  Github,
  Code,
  Video,
  Star,
  ExternalLink,
  MapPin,
  Calendar,
} from "lucide-react";

interface ContractorData {
  id: string;
  name: string;
  location: string;
  joinedDate: string;
  trustScore: number;
  skills: string[];
  tier1Score: number;
  tier2Score: number;
  tier3Score: number;
  contractsCompleted: number;
  averageRating: number;
  totalEarned: number;
}

interface ContractorPassportModalProps {
  contractor: ContractorData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContractorPassportModal({
  contractor,
  isOpen,
  onClose,
}: ContractorPassportModalProps) {
  if (!contractor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            VettedME Trust Passport
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
              {contractor.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{contractor.name}</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {contractor.location}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Joined {contractor.joinedDate}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </Badge>
                <Badge variant="outline">
                  Trust Score: {contractor.trustScore}
                </Badge>
              </div>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full border-4 border-blue-500 flex items-center justify-center bg-blue-50 dark:bg-blue-950/50">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {contractor.trustScore}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Trust
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Primary Skills</h4>
            <div className="flex flex-wrap gap-2">
              {contractor.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Verification Scores */}
          <div>
            <h4 className="font-semibold text-sm mb-3">
              Skill Assessment Results
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                  <Github className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      Tier 1: Portfolio Audit
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      {contractor.tier1Score}/100
                    </span>
                  </div>
                  <Progress value={contractor.tier1Score} className="h-2" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                  <Code className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      Tier 2: Code Lab
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      {contractor.tier2Score}/100
                    </span>
                  </div>
                  <Progress value={contractor.tier2Score} className="h-2" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      Tier 3: AI Viva
                    </span>
                    <span className="text-sm font-bold text-purple-600">
                      {contractor.tier3Score}/100
                    </span>
                  </div>
                  <Progress value={contractor.tier3Score} className="h-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{contractor.contractsCompleted}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Contracts Completed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                {contractor.averageRating}
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Average Rating
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${contractor.totalEarned.toLocaleString()}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Total Earned
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Passport
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
