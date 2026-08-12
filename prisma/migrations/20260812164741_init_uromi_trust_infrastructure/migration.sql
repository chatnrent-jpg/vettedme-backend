-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TALENT', 'BUSINESS', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'BIOMETRIC_PASSED', 'FAILED', 'REVOKED');

-- CreateEnum
CREATE TYPE "DeveloperOnboardingStatus" AS ENUM ('INVITED', 'PROFILE_CREATED', 'PORTFOLIO_AUDITED', 'SANDBOX_PASSED', 'BIOMETRIC_CLEARED', 'PASSPORT_ISSUED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('ONBOARDING', 'MILESTONE_HANDSHAKE', 'ACCOUNT_RECOVERY', 'SECURITY_CHECK', 'PAYMENT_AUTHORIZATION');

-- CreateEnum
CREATE TYPE "FaceMatchStatus" AS ENUM ('VERIFIED', 'FAILED', 'REVIEW_REQUIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('FULL_STACK', 'BACKEND', 'FRONTEND', 'MOBILE', 'DEVOPS', 'DATA_SCIENCE');

-- CreateEnum
CREATE TYPE "TierStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AssessmentState" AS ENUM ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'AWAITING_FUNDS', 'CAPITAL_ESCROWED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('LOCKED', 'IN_PROGRESS', 'WORK_SUBMITTED', 'UNDER_REVIEW', 'AWAITING_HANDSHAKE', 'HANDSHAKE_VERIFIED', 'PAYMENT_PROCESSING', 'PAID', 'DISPUTED');

-- CreateEnum
CREATE TYPE "HandshakeStatus" AS ENUM ('PENDING', 'NOTIFICATION_SENT', 'IN_PROGRESS', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ESCROW_DEPOSIT', 'MILESTONE_PAYOUT', 'PLATFORM_FEE', 'FX_SPREAD', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('CLIENT_ESCROW', 'TALENT_PAYOUT', 'PLATFORM_TREASURY');

-- CreateEnum
CREATE TYPE "LedgerTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'PLATFORM_FEE', 'FX_SPREAD', 'TRANSFER', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('LINKEDIN', 'COLD_EMAIL', 'REFERRAL', 'INBOUND', 'CONFERENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "QualificationStatus" AS ENUM ('UNQUALIFIED', 'MARKETING_QUALIFIED', 'SALES_QUALIFIED', 'OPPORTUNITY', 'CUSTOMER', 'LOST');

-- CreateEnum
CREATE TYPE "SequenceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OutreachChannel" AS ENUM ('LINKEDIN_CONNECTION', 'LINKEDIN_INMAIL', 'EMAIL', 'PHONE', 'SMS');

-- CreateEnum
CREATE TYPE "TouchStatus" AS ENUM ('PENDING', 'SENT', 'OPENED', 'CLICKED', 'REPLIED', 'BOUNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('DISCOVERY', 'DEMO_SCHEDULED', 'DEMO_COMPLETED', 'PROPOSAL_SENT', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "WebhookSource" AS ENUM ('SMILE_ID', 'AIRWALLEX', 'SENDGRID', 'STRIPE', 'INTERNAL');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('PASSPORT_VERIFICATION_SUCCESS', 'PASSPORT_VERIFICATION_FAILED', 'PASSPORT_REVOKED', 'BIOMETRIC_SCAN_SUCCESS', 'BIOMETRIC_SCAN_FAILED', 'KYC_DOCUMENT_UPLOADED', 'AIRWALLEX_SUBACCOUNT_PROVISIONED', 'CAPITAL_DEPOSIT_CONFIRMED', 'ESCROW_FUNDS_LOCKED', 'ESCROW_FUNDS_RELEASED', 'BIOMETRIC_HANDSHAKE_TRIGGERED', 'PAYOUT_DISBURSEMENT_EXECUTED', 'PAYOUT_DISBURSEMENT_FAILED', 'PLATFORM_FEE_CAPTURED', 'FX_SPREAD_CAPTURED', 'COMPLIANCE_TAX_FORM_VAULTED', 'W8BEN_GENERATED', 'W8BEN_DOWNLOADED', 'W8BEN_SIGNATURE_CAPTURED', 'CONTRACT_CREATED', 'CONTRACT_FUNDED', 'CONTRACT_ACTIVATED', 'CONTRACT_COMPLETED', 'CONTRACT_CANCELLED', 'MILESTONE_CREATED', 'MILESTONE_WORK_SUBMITTED', 'MILESTONE_RELEASED', 'MILESTONE_PAID', 'MILESTONE_DISPUTED', 'CONTRACT_DISPUTE_RAISED', 'DISPUTE_RESOLVED', 'FRAUD_ALERT_TRIGGERED', 'SECURITY_INCIDENT', 'USER_LOGIN', 'USER_LOGOUT', 'SESSION_EXPIRED', 'PASSWORD_CHANGED', 'ADMIN_ACTION', 'SYSTEM_CONFIGURATION_CHANGED', 'LEAD_CAPTURED', 'LEAD_QUALIFIED', 'LEAD_CONVERTED');

-- CreateEnum
CREATE TYPE "SalesPipelineStatus" AS ENUM ('COLD_OUTREACH', 'EMAIL_REPLIED', 'DEMO_BOOKED', 'DEMO_COMPLETED', 'CONTRACT_PENDING', 'ENTERPRISE_ACTIVE', 'LOST');

-- CreateEnum
CREATE TYPE "AIStatus" AS ENUM ('NOT_STARTED', 'TIER1_IN_PROGRESS', 'TIER1_PASSED', 'TIER2_IN_PROGRESS', 'TIER2_PASSED', 'TIER3_IN_PROGRESS', 'TIER3_PASSED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "NictmDepartment" AS ENUM ('MECHATRONICS_ENGINEERING', 'COMPUTER_SCIENCE', 'CYBER_SECURITY_DATA_PROTECTION', 'CIVIL_ENGINEERING', 'QUANTITY_SURVEYING', 'BUILDING_TECHNOLOGY', 'EXTERNAL_TALENT');

-- CreateEnum
CREATE TYPE "EvaluationTier" AS ENUM ('TIER_1_CALIBRATION', 'TIER_2_INTERACTIVE_VIVA', 'TIER_3_PRODUCTION_READY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TALENT',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "location" TEXT,
    "timezone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "aiStatus" "AIStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "aiScore" INTEGER NOT NULL DEFAULT 0,
    "aiTier1Score" INTEGER NOT NULL DEFAULT 0,
    "aiTier2Score" INTEGER NOT NULL DEFAULT 0,
    "aiTier3Score" INTEGER NOT NULL DEFAULT 0,
    "aiSessionId" TEXT,
    "aiLastAttemptAt" TIMESTAMP(3),
    "aiCompletedAt" TIMESTAMP(3),
    "aiFailureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vetted_me_passports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "onboardingStatus" "DeveloperOnboardingStatus" NOT NULL DEFAULT 'INVITED',
    "inviteToken" TEXT,
    "inviteSource" TEXT,
    "invitedAt" TIMESTAMP(3),
    "profileCreatedAt" TIMESTAMP(3),
    "portfolioAuditedAt" TIMESTAMP(3),
    "sandboxPassedAt" TIMESTAMP(3),
    "biometricClearedAt" TIMESTAMP(3),
    "passportIssuedAt" TIMESTAMP(3),
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "smileIdUserId" TEXT,
    "smileIdJobId" TEXT,
    "biometricHash" TEXT,
    "kycData" JSONB,
    "governmentIdType" TEXT,
    "governmentIdNumber" TEXT,
    "governmentIdVerified" BOOLEAN NOT NULL DEFAULT false,
    "faceMatchScore" DOUBLE PRECISION,
    "livenessCheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "lastBiometricScanAt" TIMESTAMP(3),
    "publicProfileUrl" TEXT,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "portfolioUrl" TEXT,
    "primarySkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "yearsOfExperience" INTEGER NOT NULL DEFAULT 0,
    "hourlyRateUSD" DECIMAL(10,2),
    "contractsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalEarnedUSD" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "onTimeDeliveryRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vetted_me_passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biometric_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationType" "VerificationType" NOT NULL,
    "smileIdSessionId" TEXT NOT NULL,
    "smileIdPartnerId" TEXT NOT NULL,
    "smileIdJobType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "livenessDetected" BOOLEAN NOT NULL,
    "faceMatch" "FaceMatchStatus" NOT NULL,
    "idType" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "idCountry" TEXT NOT NULL DEFAULT 'NG',
    "governmentPhotoUrl" TEXT,
    "capturedPhotoUrl" TEXT NOT NULL,
    "smileIdResponse" JSONB NOT NULL,
    "kycResult" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceFingerprint" TEXT,
    "location" JSONB,
    "fraudSignals" JSONB,
    "fraudScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "manualReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biometric_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_assessment_logs" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "assessmentType" "AssessmentType" NOT NULL DEFAULT 'FULL_STACK',
    "tier1GithubScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tier1RepoCount" INTEGER NOT NULL DEFAULT 0,
    "tier1CommitCount" INTEGER NOT NULL DEFAULT 0,
    "tier1CodeComplexity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tier1FraudFlags" JSONB,
    "tier1Status" "TierStatus" NOT NULL DEFAULT 'PENDING',
    "tier1CompletedAt" TIMESTAMP(3),
    "tier2SandboxCodeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tier2TestsPassed" INTEGER NOT NULL DEFAULT 0,
    "tier2TestsTotal" INTEGER NOT NULL DEFAULT 0,
    "tier2ExecutionTime" INTEGER NOT NULL DEFAULT 0,
    "tier2KeystrokeData" JSONB,
    "tier2FraudFlags" JSONB,
    "tier2Status" "TierStatus" NOT NULL DEFAULT 'PENDING',
    "tier2CompletedAt" TIMESTAMP(3),
    "tier3VideoVivaScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tier3QuestionsAsked" INTEGER NOT NULL DEFAULT 0,
    "tier3CorrectAnswers" INTEGER NOT NULL DEFAULT 0,
    "tier3BiometricMatch" DOUBLE PRECISION,
    "tier3VoiceAnalysis" JSONB,
    "tier3FraudFlags" JSONB,
    "tier3Status" "TierStatus" NOT NULL DEFAULT 'PENDING',
    "tier3CompletedAt" TIMESTAMP(3),
    "aggregateScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "verificationState" "AssessmentState" NOT NULL DEFAULT 'PENDING',
    "overallFraudScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "assessmentPayload" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_assessment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectDescription" TEXT NOT NULL,
    "totalContractValueUSD" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "expectedEndDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "escrowFundedAt" TIMESTAMP(3),
    "escrowReleasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airwallex_sub_accounts" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "airwallexAccountId" TEXT NOT NULL,
    "airwallexVirtualAccountId" TEXT NOT NULL,
    "airwallexBeneficiaryId" TEXT,
    "fundingAccountRoutingNumber" TEXT NOT NULL,
    "fundingAccountAccountNumber" TEXT NOT NULL,
    "fundingAccountSwiftCode" TEXT,
    "fundingAccountIban" TEXT,
    "bankName" TEXT NOT NULL,
    "bankAddress" TEXT,
    "bankCountry" TEXT NOT NULL DEFAULT 'US',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "currentBalanceUSD" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "availableBalanceUSD" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lockedBalanceUSD" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "airwallexMetadata" JSONB,
    "provisionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airwallex_sub_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "milestoneNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountUSD" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'LOCKED',
    "deliverables" JSONB,
    "submissionNotes" TEXT,
    "approvalNotes" TEXT,
    "complianceTaxFormSigned" BOOLEAN NOT NULL DEFAULT false,
    "taxFormUrl" TEXT,
    "handshakeRequired" BOOLEAN NOT NULL DEFAULT true,
    "handshakeCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_handshakes" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "status" "HandshakeStatus" NOT NULL DEFAULT 'PENDING',
    "notificationSentAt" TIMESTAMP(3),
    "biometricSessionId" TEXT,
    "faceMatchScore" DOUBLE PRECISION,
    "livenessCheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "deviceFingerprint" TEXT,
    "location" JSONB,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestone_handshakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "airwallexSubAccountId" TEXT,
    "transactionType" "TransactionType" NOT NULL,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "platformFee" DECIMAL(12,2) NOT NULL,
    "platformFeeRate" DOUBLE PRECISION NOT NULL,
    "fxSpread" DECIMAL(12,2) NOT NULL,
    "fxSpreadRate" DOUBLE PRECISION NOT NULL,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "sourceCurrency" TEXT NOT NULL DEFAULT 'USD',
    "targetCurrency" TEXT NOT NULL DEFAULT 'NGN',
    "exchangeRate" DOUBLE PRECISION NOT NULL,
    "airwallexTransferId" TEXT,
    "airwallexReference" TEXT,
    "airwallexFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "airwallexResponse" JSONB,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "paymentTransactionId" TEXT,
    "businessName" TEXT NOT NULL,
    "businessAddress" TEXT,
    "businessTaxId" TEXT,
    "businessEmail" TEXT NOT NULL,
    "contractorName" TEXT NOT NULL,
    "contractorPassportId" TEXT NOT NULL,
    "contractorLocation" TEXT NOT NULL,
    "milestoneAmount" DECIMAL(12,2) NOT NULL,
    "platformFee" DECIMAL(12,2) NOT NULL,
    "platformFeeRate" DOUBLE PRECISION NOT NULL,
    "fxSpread" DECIMAL(12,2) NOT NULL,
    "fxSpreadRate" DOUBLE PRECISION NOT NULL,
    "contractorPayout" DECIMAL(12,2) NOT NULL,
    "sourceCurrency" TEXT NOT NULL DEFAULT 'USD',
    "targetCurrency" TEXT NOT NULL DEFAULT 'NGN',
    "exchangeRate" DOUBLE PRECISION NOT NULL,
    "contractorReceivesLocal" DECIMAL(12,2) NOT NULL,
    "airwallexFee" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "paymentDate" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "emailedTo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastEmailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multi_currency_wallets" (
    "id" TEXT NOT NULL,
    "walletType" "WalletType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "balances" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "multi_currency_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "paymentTransactionId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "transactionType" "LedgerTransactionType" NOT NULL,
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_entries" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "platformFee" DECIMAL(12,2) NOT NULL,
    "fxSpread" DECIMAL(12,2) NOT NULL,
    "totalRevenue" DECIMAL(12,2) NOT NULL,
    "contractId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "revenueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactLinkedin" TEXT,
    "jobTitle" TEXT,
    "companySize" TEXT,
    "industry" TEXT,
    "source" "LeadSource" NOT NULL,
    "sourceDetails" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "qualificationStatus" "QualificationStatus" NOT NULL DEFAULT 'UNQUALIFIED',
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "touchCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_sequences" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "sequenceType" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "totalSteps" INTEGER NOT NULL DEFAULT 4,
    "status" "SequenceStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_touches" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "channel" "OutreachChannel" NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" "TouchStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_touches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "dealName" TEXT NOT NULL,
    "dealValue" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stage" "DealStage" NOT NULL DEFAULT 'DISCOVERY',
    "expectedCloseDate" TIMESTAMP(3),
    "actualCloseDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "source" "WebhookSource" NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "status" "WebhookStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "contractId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "action" TEXT NOT NULL,
    "actionType" "ActionType",
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "payloadHash" TEXT NOT NULL,
    "previousHash" TEXT,
    "sequenceNumber" SERIAL NOT NULL,
    "contractId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_leads" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "companyName" TEXT,
    "companySize" TEXT,
    "industry" TEXT,
    "location" TEXT,
    "companyWebsite" TEXT,
    "fundingStage" TEXT,
    "fundingAmount" TEXT,
    "lastFundingDate" TIMESTAMP(3),
    "jobTitle" TEXT,
    "budget" TEXT,
    "techStack" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "leadTier" TEXT NOT NULL DEFAULT 'Tier 4',
    "pipelineStatus" "SalesPipelineStatus" NOT NULL DEFAULT 'COLD_OUTREACH',
    "source" TEXT NOT NULL DEFAULT 'LANDING_PAGE',
    "coldOutreachAt" TIMESTAMP(3),
    "emailRepliedAt" TIMESTAMP(3),
    "demoBookedAt" TIMESTAMP(3),
    "demoCompletedAt" TIMESTAMP(3),
    "contractPendingAt" TIMESTAMP(3),
    "enterpriseActiveAt" TIMESTAMP(3),
    "contactAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastContactedAt" TIMESTAMP(3),
    "emailsSent" INTEGER NOT NULL DEFAULT 0,
    "emailsOpened" INTEGER NOT NULL DEFAULT 0,
    "emailsClicked" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "demoScheduledFor" TIMESTAMP(3),
    "demoAttendees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "demoNotes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enterprise_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workstations" (
    "id" TEXT NOT NULL,
    "stationNumber" INTEGER NOT NULL,
    "rowLocation" TEXT NOT NULL,
    "starlinkStreamId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workstations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "hometown" TEXT NOT NULL DEFAULT 'Uromi',
    "isNictmStudent" BOOLEAN NOT NULL DEFAULT true,
    "department" "NictmDepartment" NOT NULL,
    "matricNumber" TEXT,
    "currentTier" "EvaluationTier" NOT NULL DEFAULT 'TIER_1_CALIBRATION',
    "isCertified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_evaluations" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "workstationId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rollingMaeScore" DOUBLE PRECISION NOT NULL,
    "defenseScore" DOUBLE PRECISION NOT NULL,
    "logicalConsistency" DOUBLE PRECISION NOT NULL,
    "vivaAudioUrl" TEXT,
    "aiAuditorTranscript" JSONB NOT NULL,
    "supervisorNotes" TEXT,

    CONSTRAINT "candidate_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rater_telemetry" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'TIER_2',
    "actionType" TEXT NOT NULL,
    "metricDelta" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rater_telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "users_aiStatus_idx" ON "users"("aiStatus");

-- CreateIndex
CREATE UNIQUE INDEX "vetted_me_passports_userId_key" ON "vetted_me_passports"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "vetted_me_passports_passportId_key" ON "vetted_me_passports"("passportId");

-- CreateIndex
CREATE UNIQUE INDEX "vetted_me_passports_inviteToken_key" ON "vetted_me_passports"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "vetted_me_passports_smileIdUserId_key" ON "vetted_me_passports"("smileIdUserId");

-- CreateIndex
CREATE INDEX "vetted_me_passports_passportId_idx" ON "vetted_me_passports"("passportId");

-- CreateIndex
CREATE INDEX "vetted_me_passports_verificationStatus_idx" ON "vetted_me_passports"("verificationStatus");

-- CreateIndex
CREATE INDEX "vetted_me_passports_trustScore_idx" ON "vetted_me_passports"("trustScore");

-- CreateIndex
CREATE INDEX "vetted_me_passports_smileIdUserId_idx" ON "vetted_me_passports"("smileIdUserId");

-- CreateIndex
CREATE UNIQUE INDEX "biometric_verifications_smileIdSessionId_key" ON "biometric_verifications"("smileIdSessionId");

-- CreateIndex
CREATE INDEX "biometric_verifications_userId_idx" ON "biometric_verifications"("userId");

-- CreateIndex
CREATE INDEX "biometric_verifications_verificationType_idx" ON "biometric_verifications"("verificationType");

-- CreateIndex
CREATE INDEX "biometric_verifications_faceMatch_idx" ON "biometric_verifications"("faceMatch");

-- CreateIndex
CREATE INDEX "biometric_verifications_smileIdSessionId_idx" ON "biometric_verifications"("smileIdSessionId");

-- CreateIndex
CREATE INDEX "skill_assessment_logs_passportId_idx" ON "skill_assessment_logs"("passportId");

-- CreateIndex
CREATE INDEX "skill_assessment_logs_verificationState_idx" ON "skill_assessment_logs"("verificationState");

-- CreateIndex
CREATE INDEX "skill_assessment_logs_aggregateScore_idx" ON "skill_assessment_logs"("aggregateScore");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contractNumber_key" ON "contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "contracts_contractNumber_idx" ON "contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "contracts_businessId_idx" ON "contracts"("businessId");

-- CreateIndex
CREATE INDEX "contracts_talentId_idx" ON "contracts"("talentId");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "airwallex_sub_accounts_contractId_key" ON "airwallex_sub_accounts"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "airwallex_sub_accounts_airwallexAccountId_key" ON "airwallex_sub_accounts"("airwallexAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "airwallex_sub_accounts_airwallexVirtualAccountId_key" ON "airwallex_sub_accounts"("airwallexVirtualAccountId");

-- CreateIndex
CREATE INDEX "airwallex_sub_accounts_airwallexAccountId_idx" ON "airwallex_sub_accounts"("airwallexAccountId");

-- CreateIndex
CREATE INDEX "airwallex_sub_accounts_airwallexVirtualAccountId_idx" ON "airwallex_sub_accounts"("airwallexVirtualAccountId");

-- CreateIndex
CREATE INDEX "airwallex_sub_accounts_contractId_idx" ON "airwallex_sub_accounts"("contractId");

-- CreateIndex
CREATE INDEX "milestones_contractId_idx" ON "milestones"("contractId");

-- CreateIndex
CREATE INDEX "milestones_status_idx" ON "milestones"("status");

-- CreateIndex
CREATE INDEX "milestones_dueDate_idx" ON "milestones"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "milestones_contractId_milestoneNumber_key" ON "milestones"("contractId", "milestoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_handshakes_biometricSessionId_key" ON "milestone_handshakes"("biometricSessionId");

-- CreateIndex
CREATE INDEX "milestone_handshakes_milestoneId_idx" ON "milestone_handshakes"("milestoneId");

-- CreateIndex
CREATE INDEX "milestone_handshakes_passportId_idx" ON "milestone_handshakes"("passportId");

-- CreateIndex
CREATE INDEX "milestone_handshakes_status_idx" ON "milestone_handshakes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_transactionNumber_key" ON "payment_transactions"("transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_airwallexTransferId_key" ON "payment_transactions"("airwallexTransferId");

-- CreateIndex
CREATE INDEX "payment_transactions_transactionNumber_idx" ON "payment_transactions"("transactionNumber");

-- CreateIndex
CREATE INDEX "payment_transactions_contractId_idx" ON "payment_transactions"("contractId");

-- CreateIndex
CREATE INDEX "payment_transactions_milestoneId_idx" ON "payment_transactions"("milestoneId");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_transactionType_idx" ON "payment_transactions"("transactionType");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_paymentTransactionId_key" ON "invoices"("paymentTransactionId");

-- CreateIndex
CREATE INDEX "invoices_invoiceNumber_idx" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_contractId_idx" ON "invoices"("contractId");

-- CreateIndex
CREATE INDEX "invoices_milestoneId_idx" ON "invoices"("milestoneId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "multi_currency_wallets_walletType_idx" ON "multi_currency_wallets"("walletType");

-- CreateIndex
CREATE INDEX "multi_currency_wallets_ownerId_idx" ON "multi_currency_wallets"("ownerId");

-- CreateIndex
CREATE INDEX "ledger_transactions_walletId_idx" ON "ledger_transactions"("walletId");

-- CreateIndex
CREATE INDEX "ledger_transactions_paymentTransactionId_idx" ON "ledger_transactions"("paymentTransactionId");

-- CreateIndex
CREATE INDEX "ledger_transactions_transactionType_idx" ON "ledger_transactions"("transactionType");

-- CreateIndex
CREATE INDEX "revenue_entries_walletId_idx" ON "revenue_entries"("walletId");

-- CreateIndex
CREATE INDEX "revenue_entries_contractId_idx" ON "revenue_entries"("contractId");

-- CreateIndex
CREATE INDEX "revenue_entries_revenueDate_idx" ON "revenue_entries"("revenueDate");

-- CreateIndex
CREATE UNIQUE INDEX "leads_contactEmail_key" ON "leads"("contactEmail");

-- CreateIndex
CREATE INDEX "leads_contactEmail_idx" ON "leads"("contactEmail");

-- CreateIndex
CREATE INDEX "leads_leadScore_idx" ON "leads"("leadScore");

-- CreateIndex
CREATE INDEX "leads_qualificationStatus_idx" ON "leads"("qualificationStatus");

-- CreateIndex
CREATE INDEX "outreach_sequences_leadId_idx" ON "outreach_sequences"("leadId");

-- CreateIndex
CREATE INDEX "outreach_sequences_status_idx" ON "outreach_sequences"("status");

-- CreateIndex
CREATE INDEX "outreach_touches_sequenceId_idx" ON "outreach_touches"("sequenceId");

-- CreateIndex
CREATE INDEX "outreach_touches_status_idx" ON "outreach_touches"("status");

-- CreateIndex
CREATE INDEX "deals_leadId_idx" ON "deals"("leadId");

-- CreateIndex
CREATE INDEX "deals_stage_idx" ON "deals"("stage");

-- CreateIndex
CREATE INDEX "webhook_events_source_idx" ON "webhook_events"("source");

-- CreateIndex
CREATE INDEX "webhook_events_eventType_idx" ON "webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "webhook_events_status_idx" ON "webhook_events"("status");

-- CreateIndex
CREATE INDEX "webhook_events_contractId_idx" ON "webhook_events"("contractId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_actionType_idx" ON "audit_logs"("actionType");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_resourceId_idx" ON "audit_logs"("resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_sequenceNumber_idx" ON "audit_logs"("sequenceNumber");

-- CreateIndex
CREATE INDEX "enterprise_leads_email_idx" ON "enterprise_leads"("email");

-- CreateIndex
CREATE INDEX "enterprise_leads_leadScore_idx" ON "enterprise_leads"("leadScore");

-- CreateIndex
CREATE INDEX "enterprise_leads_pipelineStatus_idx" ON "enterprise_leads"("pipelineStatus");

-- CreateIndex
CREATE INDEX "enterprise_leads_leadTier_idx" ON "enterprise_leads"("leadTier");

-- CreateIndex
CREATE INDEX "enterprise_leads_source_idx" ON "enterprise_leads"("source");

-- CreateIndex
CREATE INDEX "enterprise_leads_createdAt_idx" ON "enterprise_leads"("createdAt");

-- CreateIndex
CREATE INDEX "enterprise_leads_companyName_idx" ON "enterprise_leads"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "workstations_stationNumber_key" ON "workstations"("stationNumber");

-- CreateIndex
CREATE INDEX "workstations_isActive_idx" ON "workstations"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_email_key" ON "candidates"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_matricNumber_key" ON "candidates"("matricNumber");

-- CreateIndex
CREATE INDEX "candidates_department_idx" ON "candidates"("department");

-- CreateIndex
CREATE INDEX "candidates_currentTier_idx" ON "candidates"("currentTier");

-- CreateIndex
CREATE INDEX "candidates_isCertified_idx" ON "candidates"("isCertified");

-- CreateIndex
CREATE INDEX "candidate_evaluations_candidateId_idx" ON "candidate_evaluations"("candidateId");

-- CreateIndex
CREATE INDEX "candidate_evaluations_workstationId_idx" ON "candidate_evaluations"("workstationId");

-- CreateIndex
CREATE INDEX "candidate_evaluations_sessionDate_idx" ON "candidate_evaluations"("sessionDate");

-- CreateIndex
CREATE INDEX "rater_telemetry_candidateId_idx" ON "rater_telemetry"("candidateId");

-- CreateIndex
CREATE INDEX "rater_telemetry_tier_idx" ON "rater_telemetry"("tier");

-- CreateIndex
CREATE INDEX "rater_telemetry_timestamp_idx" ON "rater_telemetry"("timestamp");

-- AddForeignKey
ALTER TABLE "vetted_me_passports" ADD CONSTRAINT "vetted_me_passports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_verifications" ADD CONSTRAINT "biometric_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_assessment_logs" ADD CONSTRAINT "skill_assessment_logs_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "vetted_me_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "airwallex_sub_accounts" ADD CONSTRAINT "airwallex_sub_accounts_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_handshakes" ADD CONSTRAINT "milestone_handshakes_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_handshakes" ADD CONSTRAINT "milestone_handshakes_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "vetted_me_passports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_airwallexSubAccountId_fkey" FOREIGN KEY ("airwallexSubAccountId") REFERENCES "airwallex_sub_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "multi_currency_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "multi_currency_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_sequences" ADD CONSTRAINT "outreach_sequences_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_touches" ADD CONSTRAINT "outreach_touches_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "outreach_sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_evaluations" ADD CONSTRAINT "candidate_evaluations_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_evaluations" ADD CONSTRAINT "candidate_evaluations_workstationId_fkey" FOREIGN KEY ("workstationId") REFERENCES "workstations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rater_telemetry" ADD CONSTRAINT "rater_telemetry_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
