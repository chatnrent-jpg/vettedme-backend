/**
 * ============================================================================
 * VETTED - Developer Onboarding State Machine
 * ============================================================================
 * 
 * Purpose: Manage developer verification journey state transitions
 * Flow: INVITED → PROFILE_CREATED → PORTFOLIO_AUDITED → SANDBOX_PASSED → 
 *       BIOMETRIC_CLEARED → PASSPORT_ISSUED
 * 
 * Critical Rules:
 * 1. States can only move FORWARD (no backwards transitions)
 * 2. Each state transition records an immutable timestamp
 * 3. Biometric clearing automatically mints append-only token hash
 * 4. Passport issuance enables enterprise client visibility
 * 
 * ============================================================================
 */

import { PrismaClient, DeveloperOnboardingStatus, AuditAction } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { logAudit } from '../utils/audit-logger';

const prisma = new PrismaClient();

// ============================================================================
// State Machine Configuration
// ============================================================================

const STATE_TRANSITIONS: Record<DeveloperOnboardingStatus, DeveloperOnboardingStatus[]> = {
  INVITED: ['PROFILE_CREATED'],
  PROFILE_CREATED: ['PORTFOLIO_AUDITED'],
  PORTFOLIO_AUDITED: ['SANDBOX_PASSED'],
  SANDBOX_PASSED: ['BIOMETRIC_CLEARED'],
  BIOMETRIC_CLEARED: ['PASSPORT_ISSUED'],
  PASSPORT_ISSUED: [], // Terminal state
};

const STATE_TIMESTAMP_FIELD: Record<DeveloperOnboardingStatus, string> = {
  INVITED: 'invitedAt',
  PROFILE_CREATED: 'profileCreatedAt',
  PORTFOLIO_AUDITED: 'portfolioAuditedAt',
  SANDBOX_PASSED: 'sandboxPassedAt',
  BIOMETRIC_CLEARED: 'biometricClearedAt',
  PASSPORT_ISSUED: 'passportIssuedAt',
};

// ============================================================================
// State Transition Functions
// ============================================================================

/**
 * Transition developer to next onboarding state
 * 
 * @param passportId - VettedME Passport ID
 * @param targetState - Target onboarding state
 * @param metadata - Additional metadata for the transition
 * @returns Updated passport
 */
export async function transitionOnboardingState(
  passportId: string,
  targetState: DeveloperOnboardingStatus,
  metadata?: Record<string, any>
) {
  // Fetch current passport
  const passport = await prisma.vettedMEPassport.findUnique({
    where: { passportId },
    include: { user: true },
  });

  if (!passport) {
    throw new Error(`Passport ${passportId} not found`);
  }

  // Validate transition
  const currentState = passport.onboardingStatus;
  const allowedTransitions = STATE_TRANSITIONS[currentState];

  if (!allowedTransitions.includes(targetState)) {
    throw new Error(
      `Invalid state transition: ${currentState} → ${targetState}. ` +
      `Allowed transitions: ${allowedTransitions.join(', ')}`
    );
  }

  console.log(`\n🔄 State Transition: ${currentState} → ${targetState}`);
  console.log(`   Passport: ${passportId}`);
  console.log(`   User: ${passport.user.email}`);

  // Build update data
  const updateData: any = {
    onboardingStatus: targetState,
  };

  // Set timestamp for target state
  const timestampField = STATE_TIMESTAMP_FIELD[targetState];
  updateData[timestampField] = new Date();

  // Special handling for BIOMETRIC_CLEARED → Mint token hash
  if (targetState === 'BIOMETRIC_CLEARED') {
    const tokenHash = generatePassportTokenHash(passport.userId, passportId);
    updateData.biometricHash = tokenHash;
    console.log(`   ✅ Biometric token hash minted: ${tokenHash.substring(0, 16)}...`);
  }

  // Special handling for PASSPORT_ISSUED → Enable visibility
  if (targetState === 'PASSPORT_ISSUED') {
    updateData.verificationStatus = 'BIOMETRIC_PASSED';
    updateData.verifiedAt = new Date();
    console.log(`   ✅ Passport issued! Enterprise visibility enabled.`);
  }

  // Update passport
  const updatedPassport = await prisma.vettedMEPassport.update({
    where: { passportId },
    data: updateData,
  });

  // Log audit trail
  await logAudit({
    userId: passport.userId,
    action: mapStateToAuditAction(targetState),
    resourceType: 'VettedMEPassport',
    resourceId: passportId,
    metadata: {
      previousState: currentState,
      newState: targetState,
      ...metadata,
    },
  });

  console.log(`   ✅ State transition complete\n`);

  return updatedPassport;
}

// ============================================================================
// Individual State Transition Helpers
// ============================================================================

/**
 * Mark developer as INVITED (initial state from GitHub scraper)
 */
export async function markAsInvited(
  userId: string,
  inviteSource: string = 'github_scraper',
  inviteToken?: string
) {
  const token = inviteToken || generateInviteToken();

  const passport = await prisma.vettedMEPassport.create({
    data: {
      userId,
      passportId: generatePassportId(),
      onboardingStatus: 'INVITED',
      inviteToken: token,
      inviteSource,
      invitedAt: new Date(),
    },
  });

  await logAudit({
    userId,
    action: 'DEVELOPER_INVITED' as AuditAction,
    resourceType: 'VettedMEPassport',
    resourceId: passport.passportId,
    metadata: { inviteSource, inviteToken: token },
  });

  return passport;
}

/**
 * Mark developer as PROFILE_CREATED (after signup + profile completion)
 */
export async function markProfileCreated(passportId: string) {
  return transitionOnboardingState(passportId, 'PROFILE_CREATED');
}

/**
 * Mark developer as PORTFOLIO_AUDITED (after Tier 1 GitHub audit passes)
 */
export async function markPortfolioAudited(
  passportId: string,
  githubScore: number,
  auditDetails: Record<string, any>
) {
  // Validate minimum score threshold
  if (githubScore < 70) {
    throw new Error(
      `GitHub portfolio audit failed: score ${githubScore}/100 (minimum: 70)`
    );
  }

  return transitionOnboardingState(passportId, 'PORTFOLIO_AUDITED', {
    githubScore,
    ...auditDetails,
  });
}

/**
 * Mark developer as SANDBOX_PASSED (after Tier 2 code lab passes)
 */
export async function markSandboxPassed(
  passportId: string,
  sandboxScore: number,
  labDetails: Record<string, any>
) {
  // Validate minimum score threshold
  if (sandboxScore < 85) {
    throw new Error(
      `Sandbox code lab failed: score ${sandboxScore}/100 (minimum: 85)`
    );
  }

  return transitionOnboardingState(passportId, 'SANDBOX_PASSED', {
    sandboxScore,
    ...labDetails,
  });
}

/**
 * Mark developer as BIOMETRIC_CLEARED (after Tier 3 biometric verification)
 * 
 * CRITICAL: This programmatically mints an append-only token hash that
 * binds the developer's real-world identity to their cryptographic passport.
 */
export async function markBiometricCleared(
  passportId: string,
  biometricDetails: {
    smileIdSessionId: string;
    faceMatchScore: number;
    livenessCheckPassed: boolean;
    governmentIdVerified: boolean;
  }
) {
  // Validate biometric requirements
  if (biometricDetails.faceMatchScore < 0.95) {
    throw new Error(
      `Biometric face match score too low: ${biometricDetails.faceMatchScore} (minimum: 0.95)`
    );
  }

  if (!biometricDetails.livenessCheckPassed) {
    throw new Error('Liveness check failed');
  }

  if (!biometricDetails.governmentIdVerified) {
    throw new Error('Government ID verification failed');
  }

  // Update passport with biometric data
  await prisma.vettedMEPassport.update({
    where: { passportId },
    data: {
      faceMatchScore: biometricDetails.faceMatchScore,
      livenessCheckPassed: biometricDetails.livenessCheckPassed,
      governmentIdVerified: biometricDetails.governmentIdVerified,
      lastBiometricScanAt: new Date(),
    },
  });

  return transitionOnboardingState(passportId, 'BIOMETRIC_CLEARED', biometricDetails);
}

/**
 * Mark developer as PASSPORT_ISSUED (final state, enables enterprise visibility)
 * 
 * CRITICAL: This is the terminal state. Once a passport is issued, the developer
 * is fully verified and visible to enterprise clients.
 */
export async function issuePassport(passportId: string) {
  const passport = await transitionOnboardingState(passportId, 'PASSPORT_ISSUED');

  // Generate public profile URL
  const publicProfileUrl = `https://vettedme.app/passport/${passportId}`;

  await prisma.vettedMEPassport.update({
    where: { passportId },
    data: { publicProfileUrl },
  });

  console.log(`\n🎉 PASSPORT ISSUED!`);
  console.log(`   Passport ID: ${passportId}`);
  console.log(`   Public URL: ${publicProfileUrl}`);
  console.log(`   Status: Ready for enterprise client visibility\n`);

  return passport;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique invite token
 */
function generateInviteToken(): string {
  return `invite_${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Generate unique passport ID (public-facing)
 * Format: vettedme-abc123xyz
 */
function generatePassportId(): string {
  const randomString = crypto.randomBytes(6).toString('hex');
  return `vettedme-${randomString}`;
}

/**
 * Generate cryptographic passport token hash
 * 
 * This is an append-only, immutable hash that binds the developer's
 * real-world identity to their passport.
 */
function generatePassportTokenHash(userId: string, passportId: string): string {
  const timestamp = Date.now();
  const data = `${userId}:${passportId}:${timestamp}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Map onboarding state to audit action
 */
function mapStateToAuditAction(state: DeveloperOnboardingStatus): AuditAction {
  const mapping: Record<DeveloperOnboardingStatus, AuditAction> = {
    INVITED: 'DEVELOPER_INVITED' as AuditAction,
    PROFILE_CREATED: 'PROFILE_CREATED' as AuditAction,
    PORTFOLIO_AUDITED: 'PORTFOLIO_AUDITED' as AuditAction,
    SANDBOX_PASSED: 'SANDBOX_PASSED' as AuditAction,
    BIOMETRIC_CLEARED: 'BIOMETRIC_CLEARED' as AuditAction,
    PASSPORT_ISSUED: 'PASSPORT_ISSUED' as AuditAction,
  };

  return mapping[state];
}

/**
 * Get current onboarding status for a passport
 */
export async function getOnboardingStatus(passportId: string) {
  const passport = await prisma.vettedMEPassport.findUnique({
    where: { passportId },
    select: {
      onboardingStatus: true,
      invitedAt: true,
      profileCreatedAt: true,
      portfolioAuditedAt: true,
      sandboxPassedAt: true,
      biometricClearedAt: true,
      passportIssuedAt: true,
    },
  });

  if (!passport) {
    throw new Error(`Passport ${passportId} not found`);
  }

  return {
    currentState: passport.onboardingStatus,
    progress: calculateProgress(passport),
    timestamps: {
      invited: passport.invitedAt,
      profileCreated: passport.profileCreatedAt,
      portfolioAudited: passport.portfolioAuditedAt,
      sandboxPassed: passport.sandboxPassedAt,
      biometricCleared: passport.biometricClearedAt,
      passportIssued: passport.passportIssuedAt,
    },
  };
}

/**
 * Calculate onboarding progress (0-100%)
 */
function calculateProgress(passport: any): number {
  const states = [
    'INVITED',
    'PROFILE_CREATED',
    'PORTFOLIO_AUDITED',
    'SANDBOX_PASSED',
    'BIOMETRIC_CLEARED',
    'PASSPORT_ISSUED',
  ];

  const currentIndex = states.indexOf(passport.onboardingStatus);
  return Math.round(((currentIndex + 1) / states.length) * 100);
}

/**
 * Check if passport is fully verified and ready for visibility
 */
export async function isPassportReady(passportId: string): Promise<boolean> {
  const passport = await prisma.vettedMEPassport.findUnique({
    where: { passportId },
    select: { onboardingStatus: true },
  });

  return passport?.onboardingStatus === 'PASSPORT_ISSUED';
}

// ============================================================================
// Batch Operations (for Beta Launch)
// ============================================================================

/**
 * Get all developers in a specific onboarding state
 */
export async function getDevelopersByState(state: DeveloperOnboardingStatus) {
  return prisma.vettedMEPassport.findMany({
    where: { onboardingStatus: state },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get onboarding statistics
 */
export async function getOnboardingStats() {
  const stats = await prisma.vettedMEPassport.groupBy({
    by: ['onboardingStatus'],
    _count: true,
  });

  const totalInvited = await prisma.vettedMEPassport.count();
  const totalIssued = await prisma.vettedMEPassport.count({
    where: { onboardingStatus: 'PASSPORT_ISSUED' },
  });

  const conversionRate = totalInvited > 0 ? (totalIssued / totalInvited) * 100 : 0;

  return {
    byState: stats.reduce((acc, stat) => {
      acc[stat.onboardingStatus] = stat._count;
      return acc;
    }, {} as Record<string, number>),
    total: {
      invited: totalInvited,
      issued: totalIssued,
      conversionRate: Math.round(conversionRate * 100) / 100,
    },
  };
}

export default {
  transitionOnboardingState,
  markAsInvited,
  markProfileCreated,
  markPortfolioAudited,
  markSandboxPassed,
  markBiometricCleared,
  issuePassport,
  getOnboardingStatus,
  isPassportReady,
  getDevelopersByState,
  getOnboardingStats,
};
