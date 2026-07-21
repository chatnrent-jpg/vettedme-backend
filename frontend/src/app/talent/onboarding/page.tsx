"use client";

import { useState } from "react";
import {
  User,
  Github,
  Briefcase,
  Camera,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BiometricLivenessCapture } from "@/components/BiometricLivenessCapture";

type OnboardingStep = 1 | 2 | 3;

interface FormData {
  // Personal Details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  timezone: string;
  
  // GitHub Integration
  githubUsername: string;
  githubConnected: boolean;
  
  // Skills
  primarySkills: string[];
  yearsOfExperience: string;
  
  // Work History
  workHistory: {
    company: string;
    role: string;
    duration: string;
    description: string;
  }[];
  
  // Biometric
  biometricImageData: string | null;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "Lagos, Nigeria",
    timezone: "WAT (UTC+1)",
    githubUsername: "",
    githubConnected: false,
    primarySkills: [],
    yearsOfExperience: "",
    workHistory: [
      {
        company: "",
        role: "",
        duration: "",
        description: "",
      },
    ],
    biometricImageData: null,
  });

  const [skillInput, setSkillInput] = useState("");

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.primarySkills.includes(skillInput.trim())) {
      updateFormData("primarySkills", [...formData.primarySkills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    updateFormData(
      "primarySkills",
      formData.primarySkills.filter((s) => s !== skill)
    );
  };

  const handleGitHubConnect = () => {
    // Simulate OAuth flow
    // In production: window.location.href = '/api/auth/github'
    setTimeout(() => {
      updateFormData("githubConnected", true);
      if (formData.githubUsername) {
        alert(`GitHub connected: @${formData.githubUsername}`);
      }
    }, 1000);
  };

  const handleBiometricSuccess = (imageData: string) => {
    updateFormData("biometricImageData", imageData);
    setTimeout(() => {
      setCurrentStep(3);
    }, 2500);
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    }
  };

  const handleSubmit = () => {
    console.log("Submitting onboarding data:", formData);
    // In production: POST to /api/v1/vettedme/onboarding
    alert("Onboarding complete! Redirecting to assessment...");
    window.location.href = "/talent";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-950 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">VettedME Onboarding</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Complete your profile to start the verification process
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[
              { step: 1, icon: User, label: "Profile" },
              { step: 2, icon: Camera, label: "Biometric" },
              { step: 3, icon: CheckCircle, label: "Complete" },
            ].map(({ step, icon: Icon, label }) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                      currentStep >= step
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      currentStep >= step
                        ? "text-blue-600"
                        : "text-slate-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {step < 3 && (
                  <div
                    className={`h-0.5 flex-1 mx-4 transition-colors ${
                      currentStep > step
                        ? "bg-blue-600"
                        : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl">
          {/* Step 1: Professional Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Professional Details</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Tell us about yourself and your technical background
                </p>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => updateFormData("firstName", e.target.value)}
                      placeholder="Chidi"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => updateFormData("lastName", e.target.value)}
                      placeholder="Okafor"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    placeholder="chidi@example.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="+234 800 000 0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => updateFormData("location", e.target.value)}
                      placeholder="Lagos, Nigeria"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* GitHub Integration */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Github className="w-5 h-5 text-blue-600" />
                  GitHub Integration
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="githubUsername">GitHub Username</Label>
                  <div className="flex gap-2">
                    <Input
                      id="githubUsername"
                      value={formData.githubUsername}
                      onChange={(e) =>
                        updateFormData("githubUsername", e.target.value)
                      }
                      placeholder="your-github-username"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleGitHubConnect}
                      variant={formData.githubConnected ? "outline" : "default"}
                      disabled={!formData.githubUsername || formData.githubConnected}
                    >
                      {formData.githubConnected ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Connected
                        </>
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    We'll analyze your repositories for portfolio verification (Tier 1)
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="font-semibold text-lg">Technical Skills</h3>

                <div className="space-y-2">
                  <Label htmlFor="skills">Primary Skills *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="skills"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      placeholder="e.g. TypeScript, React, Node.js"
                      className="flex-1"
                    />
                    <Button onClick={addSkill} variant="outline">
                      Add
                    </Button>
                  </div>

                  {formData.primarySkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.primarySkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-950"
                          onClick={() => removeSkill(skill)}
                        >
                          {skill} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={(e) =>
                      updateFormData("yearsOfExperience", e.target.value)
                    }
                    placeholder="5"
                    required
                  />
                </div>
              </div>

              {/* Work History */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Recent Work History
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company / Client</Label>
                      <Input
                        id="company"
                        value={formData.workHistory[0].company}
                        onChange={(e) =>
                          updateFormData("workHistory", [
                            { ...formData.workHistory[0], company: e.target.value },
                          ])
                        }
                        placeholder="TechCorp Inc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={formData.workHistory[0].role}
                        onChange={(e) =>
                          updateFormData("workHistory", [
                            { ...formData.workHistory[0], role: e.target.value },
                          ])
                        }
                        placeholder="Senior Full-Stack Developer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      value={formData.workHistory[0].duration}
                      onChange={(e) =>
                        updateFormData("workHistory", [
                          { ...formData.workHistory[0], duration: e.target.value },
                        ])
                      }
                      placeholder="Jan 2023 - Present"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.workHistory[0].description}
                      onChange={(e) =>
                        updateFormData("workHistory", [
                          {
                            ...formData.workHistory[0],
                            description: e.target.value,
                          },
                        ])
                      }
                      placeholder="Brief description of your responsibilities and achievements..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Biometric Verification */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Biometric Verification</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Complete the liveness check to verify your identity
                </p>
              </div>

              <BiometricLivenessCapture
                onSuccess={handleBiometricSuccess}
                onSkip={() => nextStep()}
              />
            </div>
          )}

          {/* Step 3: Completion */}
          {currentStep === 3 && (
            <div className="space-y-6 text-center py-8">
              <div className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-2">Onboarding Complete!</h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Your profile has been created successfully
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="font-semibold mb-3">Next Steps</h3>
                <ul className="text-sm text-left space-y-2 text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span>Complete Tier 1: Portfolio Audit (GitHub analysis)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <span>Complete Tier 2: Sandboxed Code Lab</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <span>Complete Tier 3: AI Technical Viva</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    <span>Receive your VettedME Trust Passport</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Button onClick={handleSubmit} size="lg" className="min-w-[200px]">
                  Start Assessment
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep !== 3 && (
            <div className="flex items-center justify-between pt-8 border-t mt-8">
              <Button
                onClick={prevStep}
                variant="outline"
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="text-sm text-slate-500">
                Step {currentStep} of 2
              </div>

              <Button
                onClick={nextStep}
                disabled={
                  currentStep === 1 &&
                  (!formData.firstName ||
                    !formData.lastName ||
                    !formData.email ||
                    formData.primarySkills.length === 0)
                }
              >
                {currentStep === 1 ? "Continue to Biometric" : "Complete"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
