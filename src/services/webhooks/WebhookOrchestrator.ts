import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { smileIDService } from '../vettedme/SmileIDService';
import { airwallexService } from '../vettedpay/AirwallexService';

const prisma = new PrismaClient();

interface VettedMEVerificationEvent {
  userId: string;
  sessionId: string;
  verificationType: 'BIOMETRIC' | 'SKILL_ASSESSMENT' | 'FULL_PASSPORT';
  verificationStatus: 'VERIFIED' | 'FAILED';
  biometricData?: {
    livenessCheckPassed: boolean;
    faceMatchScore: number;
    ninVerified: boolean;
    bvnVerified: boolean;
  };
  skillData?: {
    assessmentType: string;
    score: number;
    passed: boolean;
  };
}

interface VettedPayHandshakeEvent {
  milestoneId: string;
  userId: string;
  biometricSessionId: string;
  handshakeVerified: boolean;
}

/**
 * WebhookOrchestrator - Core Infrastructure Bridge
 * 
 * This is the CRITICAL component that connects VettedME → VettedPay.
 * 
 * Flow:
 * 1. VettedME completes biometric + skill verification
 * 2. Webhook received → validate signature
 * 3. Update VettedMEPassport with verification status
 * 4. Trigger "Passport Issued" event
 * 5. Check for pending milestones awaiting this passport
 * 6. Initiate Airwallex payout if milestone ready + biometric handshake completed
 */
export class WebhookOrchestrator {
  /**
   * Handle VettedME verification completion webhook
   */
  async handleVettedMEVerification(
    event: VettedMEVerificationEvent
  ): Promise<void> {
    const webhookLog = await prisma.webhookEvent.create({
      data: {
        eventType: 'VETTEDME_VERIFICATION_COMPLETED',
        status: 'PROCESSING',
        payload: event as any,
        sourceSystem: 'VettedME',
        targetSystem: 'VettedPay',
      },
    });

    try {
      logger.info('Processing VettedME verification webhook', {
        userId: event.userId,
        sessionId: event.sessionId,
        verificationType: event.verificationType,
      });

      const user = await prisma.user.findUnique({
        where: { id: event.userId },
        include: { vettedMEPassport: true },
      });

      if (!user) {
        throw new Error(`User not found: ${event.userId}`);
      }

      if (event.verificationType === 'BIOMETRIC' && event.biometricData) {
        await this.handleBiometricVerification(user.id, event);
      } else if (event.verificationType === 'SKILL_ASSESSMENT' && event.skillData) {
        await this.handleSkillAssessmentCompletion(user.id, event);
      } else if (event.verificationType === 'FULL_PASSPORT') {
        await this.handleFullPassportIssuance(user.id, event);
      }

      await prisma.webhookEvent.update({
        where: { id: webhookLog.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      logger.info('VettedME webhook processed successfully', {
        userId: event.userId,
        webhookId: webhookLog.id,
      });
    } catch (error: any) {
      logger.error('VettedME webhook processing failed', {
        error: error.message,
        userId: event.userId,
        webhookId: webhookLog.id,
      });

      await prisma.webhookEvent.update({
        where: { id: webhookLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          attemptCount: webhookLog.attemptCount + 1,
        },
      });

      throw error;
    }
  }

  /**
   * Handle biometric verification completion
   */
  private async handleBiometricVerification(
    userId: string,
    event: VettedMEVerificationEvent
  ): Promise<void> {
    if (!event.biometricData) return;

    logger.info('Updating biometric verification status', { userId });

    await prisma.vettedMEPassport.upsert({
      where: { userId },
      update: {
        biometricStatus: event.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'FAILED',
        biometricSessionId: event.sessionId,
        livenessCheckPassed: event.biometricData.livenessCheckPassed,
        faceMatchScore: event.biometricData.faceMatchScore,
        ninVerified: event.biometricData.ninVerified,
        bvnVerified: event.biometricData.bvnVerified,
        livenessCheckDate: new Date(),
        lastVerificationAt: new Date(),
        verificationAttempts: { increment: 1 },
      },
      create: {
        userId,
        biometricStatus: event.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'FAILED',
        biometricSessionId: event.sessionId,
        livenessCheckPassed: event.biometricData.livenessCheckPassed,
        faceMatchScore: event.biometricData.faceMatchScore,
        ninVerified: event.biometricData.ninVerified,
        bvnVerified: event.biometricData.bvnVerified,
        livenessCheckDate: new Date(),
        verificationAttempts: 1,
      },
    });

    await prisma.webhookEvent.create({
      data: {
        eventType: 'VETTEDME_BIOMETRIC_PASSED',
        status: 'COMPLETED',
        payload: { userId, sessionId: event.sessionId },
        sourceSystem: 'VettedME',
        processedAt: new Date(),
      },
    });
  }

  /**
   * Handle skill assessment completion
   */
  private async handleSkillAssessmentCompletion(
    userId: string,
    event: VettedMEVerificationEvent
  ): Promise<void> {
    if (!event.skillData) return;

    logger.info('Recording skill assessment completion', {
      userId,
      assessmentType: event.skillData.assessmentType,
      score: event.skillData.score,
    });

    await prisma.vettedMEPassport.upsert({
      where: { userId },
      update: {
        skillVerificationStatus: event.skillData.passed ? 'VERIFIED' : 'FAILED',
        overallSkillScore: event.skillData.score,
        assessmentsPassed: event.skillData.passed ? { increment: 1 } : undefined,
        assessmentsFailed: !event.skillData.passed ? { increment: 1 } : undefined,
        lastVerificationAt: new Date(),
      },
      create: {
        userId,
        skillVerificationStatus: event.skillData.passed ? 'VERIFIED' : 'FAILED',
        overallSkillScore: event.skillData.score,
        assessmentsPassed: event.skillData.passed ? 1 : 0,
        assessmentsFailed: event.skillData.passed ? 0 : 1,
      },
    });

    if (event.skillData.passed) {
      await prisma.webhookEvent.create({
        data: {
          eventType: 'VETTEDME_SKILL_ASSESSMENT_PASSED',
          status: 'COMPLETED',
          payload: { userId, assessmentType: event.skillData.assessmentType },
          sourceSystem: 'VettedME',
          processedAt: new Date(),
        },
      });
    }
  }

  /**
   * Handle full passport issuance (both biometric + skill verified)
   */
  private async handleFullPassportIssuance(
    userId: string,
    event: VettedMEVerificationEvent
  ): Promise<void> {
    logger.info('Issuing VettedME Passport', { userId });

    const passport = await prisma.vettedMEPassport.findUnique({
      where: { userId },
    });

    if (!passport) {
      throw new Error('VettedME Passport not found');
    }

    const passportUrl = `https://vettedme.com/talent/${userId}`;
    const trustScore = this.calculateTrustScore(passport);

    await prisma.vettedMEPassport.update({
      where: { userId },
      data: {
        passportUrl,
        passportIssuedAt: new Date(),
        passportExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        trustScore,
      },
    });

    logger.info('VettedME Passport issued', { userId, trustScore });

    await this.checkAndTriggerPendingPayouts(userId);
  }

  /**
   * CRITICAL: Check for pending milestones and trigger payouts
   */
  private async checkAndTriggerPendingPayouts(userId: string): Promise<void> {
    logger.info('Checking for pending milestones', { userId });

    const pendingMilestones = await prisma.milestone.findMany({
      where: {
        userId,
        status: 'APPROVED',
        biometricHandshakeRequired: true,
        biometricHandshakeCompleted: false,
      },
      include: {
        contract: {
          include: {
            airwallexAccount: true,
          },
        },
      },
    });

    logger.info('Found pending milestones', {
      userId,
      count: pendingMilestones.length,
    });

    for (const milestone of pendingMilestones) {
      await this.initiateMilestonePayout(milestone.id);
    }
  }

  /**
   * Handle biometric handshake completion → trigger payout
   */
  async handleBiometricHandshake(
    event: VettedPayHandshakeEvent
  ): Promise<void> {
    const webhookLog = await prisma.webhookEvent.create({
      data: {
        eventType: 'VETTEDPAY_HANDSHAKE_VERIFIED',
        status: 'PROCESSING',
        payload: event as any,
        sourceSystem: 'VettedME',
        targetSystem: 'VettedPay',
      },
    });

    try {
      logger.info('Processing biometric handshake', {
        milestoneId: event.milestoneId,
        userId: event.userId,
      });

      if (!event.handshakeVerified) {
        throw new Error('Biometric handshake verification failed');
      }

      await prisma.milestone.update({
        where: { id: event.milestoneId },
        data: {
          biometricHandshakeCompleted: true,
          biometricSessionId: event.biometricSessionId,
          handshakeCompletedAt: new Date(),
        },
      });

      await this.initiateMilestonePayout(event.milestoneId);

      await prisma.webhookEvent.update({
        where: { id: webhookLog.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });
    } catch (error: any) {
      logger.error('Biometric handshake processing failed', {
        error: error.message,
        milestoneId: event.milestoneId,
      });

      await prisma.webhookEvent.update({
        where: { id: webhookLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * CORE PAYOUT EXECUTION: Initiate Airwallex payout
   */
  private async initiateMilestonePayout(milestoneId: string): Promise<void> {
    logger.info('Initiating milestone payout', { milestoneId });

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            airwallexAccount: true,
            buyer: true,
          },
        },
        user: {
          include: {
            vettedMEPassport: true,
          },
        },
      },
    });

    if (!milestone) {
      throw new Error(`Milestone not found: ${milestoneId}`);
    }

    if (!milestone.contract.airwallexAccount) {
      throw new Error('No Airwallex account linked to contract');
    }

    const passport = milestone.user.vettedMEPassport;
    if (!passport || passport.biometricStatus !== 'VERIFIED') {
      throw new Error('Talent passport not verified');
    }

    if (!milestone.biometricHandshakeCompleted) {
      throw new Error('Biometric handshake not completed');
    }

    logger.info('Executing Airwallex payout', {
      milestoneId,
      amount: milestone.amountUSD,
      accountId: milestone.contract.airwallexAccount.airwallexAccountId,
    });

    const payoutResult = await airwallexService.initiatePayout({
      airwallexAccountId: milestone.contract.airwallexAccount.airwallexAccountId,
      beneficiaryBankAccount: milestone.contract.airwallexAccount.bankAccountNumber || '',
      beneficiaryName: `${milestone.user.firstName} ${milestone.user.lastName}`,
      amountUSD: milestone.amountUSD,
      currency: 'USD',
      reference: `MILESTONE_${milestoneId}`,
      milestoneId,
    });

    if (!payoutResult.success) {
      throw new Error(`Payout initiation failed: ${payoutResult.errorMessage}`);
    }

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'PAID',
        payoutInitiatedAt: new Date(),
        airwallexPayoutId: payoutResult.payoutId,
      },
    });

    await prisma.webhookEvent.create({
      data: {
        eventType: 'VETTEDPAY_PAYOUT_INITIATED',
        status: 'COMPLETED',
        payload: { milestoneId, payoutId: payoutResult.payoutId },
        sourceSystem: 'VettedPay',
        processedAt: new Date(),
      },
    });

    logger.info('Payout initiated successfully', {
      milestoneId,
      payoutId: payoutResult.payoutId,
    });
  }

  /**
   * Calculate algorithmic trust score (0-100)
   */
  private calculateTrustScore(passport: any): number {
    let score = 0;

    if (passport.livenessCheckPassed) score += 25;
    if (passport.ninVerified) score += 15;
    if (passport.bvnVerified) score += 15;
    if (passport.faceMatchScore && passport.faceMatchScore >= 0.9) score += 15;
    if (passport.skillVerificationStatus === 'VERIFIED') score += 20;
    if (passport.overallSkillScore && passport.overallSkillScore >= 70) score += 10;

    return Math.min(100, score);
  }
}

export const webhookOrchestrator = new WebhookOrchestrator();
