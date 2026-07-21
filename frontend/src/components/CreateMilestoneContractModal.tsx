"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Shield,
  AlertCircle,
  DollarSign,
  Calendar,
  FileText,
  Wallet,
  CheckCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  amount: string;
}

interface ContractFormData {
  passportId: string;
  projectName: string;
  projectDescription: string;
  milestones: Milestone[];
}

interface CreateMilestoneContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContractFormData) => void;
}

export function CreateMilestoneContractModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateMilestoneContractModalProps) {
  const [formData, setFormData] = useState<ContractFormData>({
    passportId: "",
    projectName: "",
    projectDescription: "",
    milestones: [
      { id: "1", title: "", dueDate: "", amount: "" },
    ],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: "",
      dueDate: "",
      amount: "",
    };
    setFormData({
      ...formData,
      milestones: [...formData.milestones, newMilestone],
    });
  };

  const removeMilestone = (id: string) => {
    if (formData.milestones.length > 1) {
      setFormData({
        ...formData,
        milestones: formData.milestones.filter((m) => m.id !== id),
      });
    }
  };

  const updateMilestone = (
    id: string,
    field: keyof Milestone,
    value: string
  ) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    });
  };

  const calculateTotal = () => {
    return formData.milestones.reduce((sum, m) => {
      const amount = parseFloat(m.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate passport ID
    if (!formData.passportId.trim()) {
      newErrors.passportId = "VettedME Passport ID is required";
    } else if (!/^[a-zA-Z0-9-]+$/.test(formData.passportId)) {
      newErrors.passportId = "Invalid Passport ID format";
    }

    // Validate project name
    if (!formData.projectName.trim()) {
      newErrors.projectName = "Project name is required";
    }

    // Validate project description
    if (!formData.projectDescription.trim()) {
      newErrors.projectDescription = "Project description is required";
    } else if (formData.projectDescription.length < 50) {
      newErrors.projectDescription =
        "Description must be at least 50 characters";
    }

    // Validate milestones
    formData.milestones.forEach((milestone, index) => {
      if (!milestone.title.trim()) {
        newErrors[`milestone-${index}-title`] = "Milestone title is required";
      }
      if (!milestone.dueDate) {
        newErrors[`milestone-${index}-dueDate`] = "Due date is required";
      }
      if (!milestone.amount || parseFloat(milestone.amount) <= 0) {
        newErrors[`milestone-${index}-amount`] = "Valid amount is required";
      }
    });

    // Validate total
    const total = calculateTotal();
    if (total < 100) {
      newErrors.total = "Total contract value must be at least $100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      passportId: "",
      projectName: "",
      projectDescription: "",
      milestones: [{ id: "1", title: "", dueDate: "", amount: "" }],
    });
    setErrors({});
    onClose();
  };

  const total = calculateTotal();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileText className="w-6 h-6 text-blue-600" />
            Create Milestone Contract
          </DialogTitle>
          <DialogDescription>
            Set up a milestone-based contract with a verified VettedME
            contractor. Funds will be held in escrow and released automatically
            upon biometric verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contractor Selection */}
          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Contractor Identification</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passportId">
                VettedME Passport ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="passportId"
                placeholder="e.g., vettedme-abc123def456"
                value={formData.passportId}
                onChange={(e) =>
                  setFormData({ ...formData, passportId: e.target.value })
                }
                className={errors.passportId ? "border-red-500" : ""}
              />
              {errors.passportId && (
                <p className="text-xs text-red-600">{errors.passportId}</p>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Enter the unique VettedME Passport ID of the verified
                contractor. You can find this on their public trust passport
                page.
              </p>
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">Project Details</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectName">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="projectName"
                placeholder="e.g., E-commerce Platform Rebuild"
                value={formData.projectName}
                onChange={(e) =>
                  setFormData({ ...formData, projectName: e.target.value })
                }
                className={errors.projectName ? "border-red-500" : ""}
              />
              {errors.projectName && (
                <p className="text-xs text-red-600">{errors.projectName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectDescription">
                Project Scope & Description{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="projectDescription"
                placeholder="Describe the project scope, technical requirements, deliverables, and success criteria..."
                value={formData.projectDescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    projectDescription: e.target.value,
                  })
                }
                rows={4}
                className={errors.projectDescription ? "border-red-500" : ""}
              />
              {errors.projectDescription && (
                <p className="text-xs text-red-600">
                  {errors.projectDescription}
                </p>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Minimum 50 characters. Be specific about requirements and
                deliverables.
              </p>
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">Milestone Breakdown</h3>
              </div>
              <Button onClick={addMilestone} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Milestone
              </Button>
            </div>

            <div className="space-y-3">
              {formData.milestones.map((milestone, index) => (
                <Card key={milestone.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        Milestone {index + 1}
                      </Badge>
                      {formData.milestones.length > 1 && (
                        <Button
                          onClick={() => removeMilestone(milestone.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor={`milestone-${index}-title`}>
                          Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`milestone-${index}-title`}
                          placeholder="e.g., Database Schema Design"
                          value={milestone.title}
                          onChange={(e) =>
                            updateMilestone(
                              milestone.id,
                              "title",
                              e.target.value
                            )
                          }
                          className={
                            errors[`milestone-${index}-title`]
                              ? "border-red-500"
                              : ""
                          }
                        />
                        {errors[`milestone-${index}-title`] && (
                          <p className="text-xs text-red-600">
                            {errors[`milestone-${index}-title`]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`milestone-${index}-dueDate`}>
                          Due Date <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            id={`milestone-${index}-dueDate`}
                            type="date"
                            value={milestone.dueDate}
                            onChange={(e) =>
                              updateMilestone(
                                milestone.id,
                                "dueDate",
                                e.target.value
                              )
                            }
                            className={
                              errors[`milestone-${index}-dueDate`]
                                ? "border-red-500 pl-10"
                                : "pl-10"
                            }
                          />
                        </div>
                        {errors[`milestone-${index}-dueDate`] && (
                          <p className="text-xs text-red-600">
                            {errors[`milestone-${index}-dueDate`]}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`milestone-${index}-amount`}>
                        USD Amount <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id={`milestone-${index}-amount`}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={milestone.amount}
                          onChange={(e) =>
                            updateMilestone(
                              milestone.id,
                              "amount",
                              e.target.value
                            )
                          }
                          className={
                            errors[`milestone-${index}-amount`]
                              ? "border-red-500 pl-10"
                              : "pl-10"
                          }
                        />
                      </div>
                      {errors[`milestone-${index}-amount`] && (
                        <p className="text-xs text-red-600">
                          {errors[`milestone-${index}-amount`]}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {errors.total && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.total}
              </p>
            )}
          </div>

          {/* Total */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Contract Value:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              This amount will be locked in escrow and released
              milestone-by-milestone upon biometric verification.
            </p>
          </div>

          {/* Airwallex Notice */}
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-900 rounded-lg">
            <div className="flex items-start gap-3">
              <Wallet className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">
                  Airwallex Virtual Wallet Provisioning
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  Upon submission, a dedicated Airwallex multi-currency virtual
                  account will be instantly provisioned for this contract. This
                  account will:
                </p>
                <ul className="text-xs text-green-700 dark:text-green-300 space-y-1 ml-4">
                  <li>
                    • Hold your funds in a non-custodial escrow (you retain
                    legal ownership)
                  </li>
                  <li>
                    • Generate a unique virtual account number and routing
                    details
                  </li>
                  <li>
                    • Support ACH, wire transfer, and international payment
                    methods
                  </li>
                  <li>
                    • Automatically release payments upon milestone completion +
                    biometric verification
                  </li>
                  <li>
                    • Include built-in FX conversion for multi-currency payouts
                    (USD → NGN, GBP, EUR)
                  </li>
                </ul>
                <div className="mt-3 p-3 bg-white dark:bg-green-950 rounded border border-green-300 dark:border-green-800">
                  <p className="text-xs font-mono text-green-800 dark:text-green-400">
                    <strong>Platform Fee:</strong> 15% + 0.5-1% FX spread
                    <br />
                    <strong>Security:</strong> Bank-grade encryption, PCI-DSS
                    compliant
                    <br />
                    <strong>Activation:</strong> Instant (no manual approval
                    required)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-900 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-800 dark:text-orange-400 mb-2">
                  Important Terms
                </h4>
                <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                  <li>
                    • Funds are non-refundable once deposited to the Airwallex
                    escrow
                  </li>
                  <li>
                    • Milestones must be completed and biometrically verified
                    for payout
                  </li>
                  <li>
                    • Contractor has 7 days to complete biometric handshake
                    after milestone delivery
                  </li>
                  <li>
                    • Disputes must be filed within 14 days of milestone
                    completion
                  </li>
                  <li>
                    • Contract cannot be canceled after first milestone is
                    released
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={handleClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            <Wallet className="w-4 h-4 mr-2" />
            Create Contract & Provision Wallet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
