import { Prisma } from '@prisma/client';
import { logger } from '../../utils/logger';
import { AirwallexService } from '../vettedpay/AirwallexService';
import { prisma } from '../../lib/prisma';
const airwallexService = new AirwallexService();

interface BiometricFailureEvent {
  userId: string;
  passportId: string;
  milestoneId?: string;
  contractId?: string;
  failureReason: string;
  faceMatchScore?: number;
  livenessDetected: boolean;
  attemptCount: number;
  ipAddress?: string;
  deviceFingerprint?: string;
}

interface FraudAlert {
  alertType: 'BIOMETRIC_FAILURE' | 'ACCOUNT_HIJACKING' | 'SUSPICIOUS_ACTIVITY' | 'DISPUTE_INITIATED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId: string;
  contractId?: string;
  description: string;
  metadata: Record<string, any>;
}

/**
 * FraudDetectionService - Automated Fraud Mitigation Protocol
 * 
 * Handles three critical fraud states:
 * 1. Biometric Face Match Failure (Anti-Spoofing)
 * 2. Account Hijacking Detection (Token Invalidation)
 * 3. Milestone Performance Disputes (Arbitration Escrow)
 */
export class FraudDetectionService {
  /**
   * STATE 1: Handle Biometric Verification Failure
   * 
   * Actions:
   * 1. Revoke VettedME Passport
   * 2. Lock down associated milestone
   * 3. Freeze Airwallex wallet
   * 4. Fire security alert webhook
   * 5. Notify business buyer
   */
  async handleBiometricFailure(event: BiometricFailureEvent): Promise<void> {
    logger.warn('[Fraud Detection] Biometric failure detected', {
      userId: event.userId,
      passportId: event.passportId,
      failureReason: event.failureReason,
      attemptCount: event.attemptCount,
    });

    try {
      await prisma.$transaction(async (tx) => {
        // 1. REVOKE VETTEDME PASSPORT
        await tx.vettedMEPassport.update({
          where: { id: event.passportId },
          data: {
            verificationStatus: 'REVOKED',
            trustScore: 0, // Reset trust score
            updatedAt: new Date(),
          },
        });
        logger.info('[Fraud Detection] VettedME Passport revoked', {
          passportId: event.passportId,
        });

        // 2. LOCK ASSOCIATED MILESTONE (if exists)
        if (event.milestoneId) {
          await tx.milestone.update({
            where: { id: event.milestoneId },
            data: {
              status: 'DISPUTED',
              updatedAt: new Date(),
            },
          });
          logger.info('[Fraud Detection] Milestone locked to DISPUTED', {
            milestoneId: event.milestoneId,
          });
        }

        // 3. LOCK ALL ACTIVE CONTRACTS FOR THIS TALENT
        if (event.userId) {
          await tx.contract.updateMany({
            where: {
              talentId: event.userId,
              status: {
                in: ['CAPITAL_ESCROWED', 'IN_PROGRESS'],
              },
            },
            data: {
              status: 'DISPUTED',
              updatedAt: new Date(),
            },
          });
          logger.info('[Fraud Detection] All active contracts locked', {
            userId: event.userId,
          });
        }

        // 4. CREATE BIOMETRIC VERIFICATION FAILURE RECORD
        await tx.biometricVerification.create({
          data: {
            userId: event.userId,
            verificationType: 'MILESTONE_HANDSHAKE',
            smileIdSessionId: `fraud_${Date.now()}`,
            smileIdPartnerId: process.env.SMILE_ID_PARTNER_ID || '',
            smileIdJobType: 'biometric_kyc',
            confidence: event.faceMatchScore || 0,
            livenessDetected: event.livenessDetected,
            faceMatch: 'FAILED',
            idType: 'NIN',
            idNumber: 'REDACTED',
            idCountry: 'NG',
            capturedPhotoUrl: 'REDACTED',
            smileIdResponse: {
              result: 'FAILED',
              reason: event.failureReason,
            },
            fraudSignals: {
              biometric_spoof_attempt: true,
              failure_reason: event.failureReason,
              attempt_count: event.attemptCount,
            },
            fraudScore: 95, // High fraud score
            manualReviewRequired: true,
            ipAddress: event.ipAddress,
            deviceFingerprint: event.deviceFingerprint,
          },
        });

        // 5. CREATE AUDIT LOG
        await tx.auditLog.create({
          data: {
            userId: event.userId,
            action: 'fraud.biometric_failure',
            resource: 'VettedMEPassport',
            resourceId: event.passportId,
            changes: {
              before: { verificationStatus: 'BIOMETRIC_PASSED' },
              after: { verificationStatus: 'REVOKED' },
            },
            metadata: {
              failureReason: event.failureReason,
              faceMatchScore: event.faceMatchScore,
              livenessDetected: event.livenessDetected,
              attemptCount: event.attemptCount,
            },
            ipAddress: event.ipAddress,
            contractId: event.contractId,
          },
        });
      });

      // 6. FREEZE AIRWALLEX WALLET (if contract exists)
      if (event.contractId) {
        await this.freezeAirwallexWallet(event.contractId);
      }

      // 7. FIRE SECURITY ALERT WEBHOOK
      await this.fireSecurityAlert({
        alertType: 'BIOMETRIC_FAILURE',
        severity: 'CRITICAL',
        userId: event.userId,
        contractId: event.contractId,
        description: `Biometric verification failed for user ${event.userId}. Passport revoked, contracts locked.`,
        metadata: {
          failureReason: event.failureReason,
          faceMatchScore: event.faceMatchScore,
          livenessDetected: event.livenessDetected,
          attemptCount: event.attemptCount,
        },
      });

      // 8. NOTIFY BUSINESS BUYER (if contract exists)
      if (event.contractId) {
        await this.notifyBusinessBuyer(event.contractId, 'BIOMETRIC_FAILURE', {
          message: 'Security Alert: Contractor biometric verification failed',
          severity: 'CRITICAL',
          action: 'Contract has been locked for review',
        });
      }
    } catch (error) {
      logger.error('[Fraud Detection] Failed to handle biometric failure', error);
      throw error;
    }
  }

  /**
   * STATE 2: Detect Account Hijacking Attempt
   * 
   * Checks for:
   * - Session token age > 15 minutes
   * - IP address changes
   * - Device fingerprint mismatches
   * - Rapid API calls from different locations
   */
  async detectAccountHijacking(
    userId: string,
    sessionToken: string,
    ipAddress: string,
    deviceFingerprint: string
  ): Promise<boolean> {
    logger.info('[Fraud Detection] Checking for account hijacking', { userId });

    try {
      // Check session age
      const sessionAge = await this.getSessionAge(sessionToken);
      if (sessionAge > 15 * 60 * 1000) {
        // 15 minutes
        logger.warn('[Fraud Detection] Session expired', {
          userId,
          sessionAge: sessionAge / 1000 / 60,
        });
        return true;
      }

      // Check for IP address change
      const lastIpAddress = await this.getLastIpAddress(userId);
      if (lastIpAddress && lastIpAddress !== ipAddress) {
        logger.warn('[Fraud Detection] IP address changed', {
          userId,
          lastIpAddress,
          currentIpAddress: ipAddress,
        });
        
        // Create alert but don't block (might be legitimate)
        await this.fireSecurityAlert({
          alertType: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          userId,
          description: `IP address changed from ${lastIpAddress} to ${ipAddress}`,
          metadata: { lastIpAddress, currentIpAddress: ipAddress },
        });
      }

      // Check for device fingerprint change
      const lastDeviceFingerprint = await this.getLastDeviceFingerprint(userId);
      if (lastDeviceFingerprint && lastDeviceFingerprint !== deviceFingerprint) {
        logger.warn('[Fraud Detection] Device fingerprint changed', {
          userId,
          lastDeviceFingerprint: lastDeviceFingerprint.slice(0, 20) + '...',
          currentDeviceFingerprint: deviceFingerprint.slice(0, 20) + '...',
        });
        
        // Create alert but don't block (might be legitimate)
        await this.fireSecurityAlert({
          alertType: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          userId,
          description: 'Device fingerprint changed',
          metadata: { deviceChanged: true },
        });
      }

      // Check for rapid API calls (potential bot)
      const recentCallCount = await this.getRecentApiCallCount(userId, 60000); // Last minute
      if (recentCallCount > 30) {
        logger.warn('[Fraud Detection] Suspicious API call rate', {
          userId,
          callCount: recentCallCount,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('[Fraud Detection] Error detecting account hijacking', error);
      return false; // Fail open (don't block legitimate users)
    }
  }

  /**
   * STATE 3: Initiate Dispute & Move to Arbitration Escrow
   * 
   * Actions:
   * 1. Lock milestone to DISPUTED status
   * 2. Move funds to arbitration escrow vault
   * 3. Notify both parties
   * 4. Create dispute record
   * 5. Trigger arbitration workflow
   */
  async initiateDispute(
    milestoneId: string,
    initiatedBy: 'BUSINESS' | 'TALENT',
    initiatorUserId: string,
    disputeReason: string,
    evidence?: string[]
  ): Promise<void> {
    logger.info('[Fraud Detection] Dispute initiated', {
      milestoneId,
      initiatedBy,
      initiatorUserId,
      disputeReason,
    });

    try {
      await prisma.$transaction(async (tx) => {
        // 1. GET MILESTONE WITH CONTRACT
        const milestone = await tx.milestone.findUnique({
          where: { id: milestoneId },
          include: {
            contract: {
              include: {
                airwallexSubAccount: true,
                business: true,
                talent: true,
              },
            },
          },
        });

        if (!milestone) {
          throw new Error('Milestone not found');
        }

        // 2. VALIDATE INITIATOR
        const isBusinessInitiator = milestone.contract.businessId === initiatorUserId;
        const isTalentInitiator = milestone.contract.talentId === initiatorUserId;
        
        if (!isBusinessInitiator && !isTalentInitiator) {
          throw new Error('Unauthorized: User is not part of this contract');
        }

        // 3. LOCK MILESTONE TO DISPUTED
        await tx.milestone.update({
          where: { id: milestoneId },
          data: {
            status: 'DISPUTED',
            updatedAt: new Date(),
          },
        });

        // 4. UPDATE CONTRACT STATUS
        await tx.contract.update({
          where: { id: milestone.contractId },
          data: {
            status: 'DISPUTED',
            updatedAt: new Date(),
          },
        });

        // 5. MOVE FUNDS TO ARBITRATION ESCROW (conceptual - Airwallex internal transfer)
        // In production, this would transfer from client sub-account to platform arbitration wallet
        const arbitrationWalletId = process.env.VETTED_ARBITRATION_WALLET_ID!;
        const subAccount = milestone.contract.airwallexSubAccount;

        if (subAccount) {
          await tx.airwallexSubAccount.update({
            where: { id: subAccount.id },
            data: {
              lockedBalanceUSD: {
                increment: milestone.amountUSD,
              },
              availableBalanceUSD: {
                decrement: milestone.amountUSD,
              },
            },
          });

          logger.info('[Fraud Detection] Funds moved to arbitration escrow', {
            milestoneId,
            amount: milestone.amountUSD,
          });
        }

        // 6. CREATE WEBHOOK EVENT
        await tx.webhookEvent.create({
          data: {
            source: 'INTERNAL',
            eventType: 'milestone.disputed',
            payload: {
              milestoneId,
              contractId: milestone.contractId,
              initiatedBy,
              initiatorUserId,
              disputeReason,
              amount: milestone.amountUSD,
              timestamp: new Date().toISOString(),
            },
            status: 'PROCESSED',
            contractId: milestone.contractId,
          },
        });

        // 7. CREATE AUDIT LOG
        await tx.auditLog.create({
          data: {
            userId: initiatorUserId,
            action: 'milestone.dispute_initiated',
            resource: 'Milestone',
            resourceId: milestoneId,
            changes: {
              before: { status: milestone.status },
              after: { status: 'DISPUTED' },
            },
            metadata: {
              initiatedBy,
              disputeReason,
              evidence: evidence || [],
            },
            contractId: milestone.contractId,
          },
        });

        // 8. NOTIFY OTHER PARTY
        const otherPartyId = isBusinessInitiator
          ? milestone.contract.talentId
          : milestone.contract.businessId;

        await this.notifyDisputeInitiated(
          otherPartyId,
          milestoneId,
          initiatedBy,
          disputeReason
        );
      });

      // 9. FIRE DISPUTE ALERT
      await this.fireSecurityAlert({
        alertType: 'DISPUTE_INITIATED',
        severity: 'HIGH',
        userId: initiatorUserId,
        contractId: (await prisma.milestone.findUnique({
          where: { id: milestoneId },
          select: { contractId: true },
        }))?.contractId,
        description: `Milestone dispute initiated by ${initiatedBy}`,
        metadata: {
          milestoneId,
          initiatedBy,
          disputeReason,
        },
      });
    } catch (error) {
      logger.error('[Fraud Detection] Failed to initiate dispute', error);
      throw error;
    }
  }

  /**
   * Helper: Freeze Airwallex wallet
   */
  private async freezeAirwallexWallet(contractId: string): Promise<void> {
    logger.info('[Fraud Detection] Freezing Airwallex wallet', { contractId });

    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: { airwallexSubAccount: true },
      });

      if (!contract?.airwallexSubAccount) {
        logger.warn('[Fraud Detection] No Airwallex account found', { contractId });
        return;
      }

      // Mark entire balance as locked
      await prisma.airwallexSubAccount.update({
        where: { id: contract.airwallexSubAccount.id },
        data: {
          lockedBalanceUSD: contract.airwallexSubAccount.currentBalanceUSD,
          availableBalanceUSD: 0,
          updatedAt: new Date(),
        },
      });

      logger.info('[Fraud Detection] Airwallex wallet frozen', {
        accountId: contract.airwallexSubAccount.airwallexAccountId,
      });
    } catch (error) {
      logger.error('[Fraud Detection] Failed to freeze wallet', error);
    }
  }

  /**
   * Helper: Fire security alert webhook
   */
  private async fireSecurityAlert(alert: FraudAlert): Promise<void> {
    logger.info('[Fraud Detection] Firing security alert', {
      alertType: alert.alertType,
      severity: alert.severity,
    });

    try {
      await prisma.webhookEvent.create({
        data: {
          source: 'INTERNAL',
          eventType: `security.${alert.alertType.toLowerCase()}`,
          payload: {
            alertType: alert.alertType,
            severity: alert.severity,
            userId: alert.userId,
            contractId: alert.contractId,
            description: alert.description,
            metadata: alert.metadata,
            timestamp: new Date().toISOString(),
          },
          status: 'PENDING',
          contractId: alert.contractId,
        },
      });

      // In production, this would trigger:
      // - Email to business buyer
      // - Slack notification to ops team
      // - Push notification to mobile app
      // - Dashboard alert banner
    } catch (error) {
      logger.error('[Fraud Detection] Failed to fire security alert', error);
    }
  }

  /**
   * Helper: Notify business buyer of security event
   */
  private async notifyBusinessBuyer(
    contractId: string,
    eventType: string,
    data: Record<string, any>
  ): Promise<void> {
    logger.info('[Fraud Detection] Notifying business buyer', {
      contractId,
      eventType,
    });

    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: { business: true },
      });

      if (!contract) {
        logger.warn('[Fraud Detection] Contract not found', { contractId });
        return;
      }

      // In production, send email/notification
      logger.info('[Fraud Detection] Notification sent to business', {
        businessEmail: contract.business.email,
        eventType,
      });
    } catch (error) {
      logger.error('[Fraud Detection] Failed to notify business', error);
    }
  }

  /**
   * Helper: Notify party of dispute initiation
   */
  private async notifyDisputeInitiated(
    userId: string,
    milestoneId: string,
    initiatedBy: string,
    reason: string
  ): Promise<void> {
    logger.info('[Fraud Detection] Notifying party of dispute', {
      userId,
      milestoneId,
    });

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        logger.warn('[Fraud Detection] User not found', { userId });
        return;
      }

      // In production, send email/push notification
      logger.info('[Fraud Detection] Dispute notification sent', {
        userEmail: user.email,
        milestoneId,
      });
    } catch (error) {
      logger.error('[Fraud Detection] Failed to notify dispute', error);
    }
  }

  /**
   * Helper methods for hijacking detection
   */
  private async getSessionAge(sessionToken: string): Promise<number> {
    // In production, check Redis or session store
    // For now, decode JWT and check exp
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(sessionToken) as { iat: number };
      if (!decoded || !decoded.iat) return Infinity;
      return Date.now() - decoded.iat * 1000;
    } catch {
      return Infinity;
    }
  }

  private async getLastIpAddress(userId: string): Promise<string | null> {
    const lastLog = await prisma.auditLog.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      select: { ipAddress: true },
    });
    return lastLog?.ipAddress || null;
  }

  private async getLastDeviceFingerprint(userId: string): Promise<string | null> {
    const lastLog = await prisma.auditLog.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      select: { userAgent: true },
    });
    return lastLog?.userAgent || null;
  }

  private async getRecentApiCallCount(userId: string, windowMs: number): Promise<number> {
    const since = new Date(Date.now() - windowMs);
    const count = await prisma.auditLog.count({
      where: {
        userId,
        timestamp: { gte: since },
      },
    });
    return count;
  }
}
