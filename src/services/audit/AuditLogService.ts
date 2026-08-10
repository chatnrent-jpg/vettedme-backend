import { ActionType } from '@prisma/client';
import crypto from 'crypto';
import { logger } from '../../utils/logger';
import { prisma } from '../../lib/prisma';
interface AuditLogEntry {
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  actionType?: ActionType;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  contractId?: string;
}

interface AuditLogResult {
  id: string;
  payloadHash: string;
  sequenceNumber: number;
  timestamp: Date;
}

/**
 * AuditLogService - Immutable Audit Trail with Cryptographic Hashing
 * 
 * Creates an append-only, tamper-proof audit log for banking & regulatory compliance.
 * 
 * Features:
 * - SHA-256 cryptographic hashing of every event
 * - Blockchain-like chaining (each log references previous hash)
 * - Standardized action types for compliance
 * - Complete actor tracking (who, when, where, what)
 * - Immutable audit trail for regulatory audits
 * 
 * Use Cases:
 * - Banking compliance audits
 * - Regulatory investigations
 * - Fraud detection
 * - Dispute resolution
 * - Legal evidence
 */
export class AuditLogService {
  /**
   * Create an immutable audit log entry with cryptographic hash
   */
  async log(entry: AuditLogEntry): Promise<AuditLogResult> {
    try {
      // 1. Get the previous audit log to create chain
      const previousLog = await this.getLatestAuditLog();
      
      // 2. Generate payload hash
      const payloadHash = this.generatePayloadHash({
        ...entry,
        previousHash: previousLog?.payloadHash || 'GENESIS',
        timestamp: new Date().toISOString(),
      });

      // 3. Create audit log entry
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: entry.userId,
          userEmail: entry.userEmail,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          action: entry.action,
          actionType: entry.actionType,
          resource: entry.resource,
          resourceId: entry.resourceId,
          changes: entry.changes || {},
          metadata: entry.metadata || {},
          contractId: entry.contractId,
          payloadHash,
          previousHash: previousLog?.payloadHash || null,
        },
      });

      logger.info('[Audit Log] Entry created', {
        id: auditLog.id,
        action: entry.action,
        actionType: entry.actionType,
        resource: entry.resource,
        resourceId: entry.resourceId,
        sequenceNumber: auditLog.sequenceNumber,
      });

      return {
        id: auditLog.id,
        payloadHash: auditLog.payloadHash,
        sequenceNumber: auditLog.sequenceNumber,
        timestamp: auditLog.timestamp,
      };
    } catch (error) {
      logger.error('[Audit Log] Failed to create entry', {
        error,
        entry,
      });
      
      // Audit logging should NEVER fail - if it does, log to external system
      // In production, send to external log aggregation (e.g., Datadog, Sentry)
      throw error;
    }
  }

  /**
   * Generate SHA-256 hash of audit log payload
   * 
   * This creates a tamper-proof fingerprint of the event
   */
  private generatePayloadHash(payload: Record<string, any>): string {
    // Create deterministic string representation
    const canonicalPayload = JSON.stringify(payload, Object.keys(payload).sort());
    
    // Generate SHA-256 hash
    const hash = crypto
      .createHash('sha256')
      .update(canonicalPayload)
      .digest('hex');

    return hash;
  }

  /**
   * Get the latest audit log (for blockchain-like chaining)
   */
  private async getLatestAuditLog(): Promise<{
    id: string;
    payloadHash: string;
    sequenceNumber: number;
  } | null> {
    const latestLog = await prisma.auditLog.findFirst({
      orderBy: { sequenceNumber: 'desc' },
      select: {
        id: true,
        payloadHash: true,
        sequenceNumber: true,
      },
    });

    return latestLog;
  }

  /**
   * Verify the integrity of the audit trail
   * 
   * Checks that the chain of hashes is unbroken and no records have been tampered with
   */
  async verifyAuditTrailIntegrity(options?: {
    startSequence?: number;
    endSequence?: number;
  }): Promise<{
    valid: boolean;
    totalChecked: number;
    brokenChains: number;
    tamperedRecords: number;
    details: Array<{
      sequenceNumber: number;
      issue: string;
    }>;
  }> {
    try {
      logger.info('[Audit Log] Verifying audit trail integrity', options);

      // Fetch audit logs in sequence order
      const logs = await prisma.auditLog.findMany({
        where: {
          sequenceNumber: {
            gte: options?.startSequence || 1,
            lte: options?.endSequence,
          },
        },
        orderBy: { sequenceNumber: 'asc' },
      });

      let brokenChains = 0;
      let tamperedRecords = 0;
      const details: Array<{ sequenceNumber: number; issue: string }> = [];

      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        
        // Check 1: Verify payload hash
        const reconstructedHash = this.generatePayloadHash({
          userId: log.userId,
          userEmail: log.userEmail,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          action: log.action,
          actionType: log.actionType,
          resource: log.resource,
          resourceId: log.resourceId,
          changes: log.changes,
          metadata: log.metadata,
          contractId: log.contractId,
          previousHash: log.previousHash || 'GENESIS',
          timestamp: log.timestamp.toISOString(),
        });

        if (reconstructedHash !== log.payloadHash) {
          tamperedRecords++;
          details.push({
            sequenceNumber: log.sequenceNumber,
            issue: `Payload hash mismatch. Expected: ${log.payloadHash}, Got: ${reconstructedHash}`,
          });
        }

        // Check 2: Verify chain continuity
        if (i > 0) {
          const previousLog = logs[i - 1];
          if (log.previousHash !== previousLog.payloadHash) {
            brokenChains++;
            details.push({
              sequenceNumber: log.sequenceNumber,
              issue: `Broken chain. Expected previousHash: ${previousLog.payloadHash}, Got: ${log.previousHash}`,
            });
          }
        }
      }

      const valid = brokenChains === 0 && tamperedRecords === 0;

      logger.info('[Audit Log] Integrity check complete', {
        valid,
        totalChecked: logs.length,
        brokenChains,
        tamperedRecords,
      });

      return {
        valid,
        totalChecked: logs.length,
        brokenChains,
        tamperedRecords,
        details,
      };
    } catch (error) {
      logger.error('[Audit Log] Failed to verify integrity', error);
      throw error;
    }
  }

  /**
   * Get audit trail for a specific resource
   */
  async getResourceAuditTrail(resourceId: string, options?: {
    resource?: string;
    limit?: number;
  }): Promise<Array<{
    id: string;
    action: string;
    actionType: string | null;
    timestamp: Date;
    userId: string | null;
    userEmail: string | null;
    ipAddress: string | null;
    changes: any;
    metadata: any;
    payloadHash: string;
  }>> {
    const logs = await prisma.auditLog.findMany({
      where: {
        resourceId,
        resource: options?.resource,
      },
      orderBy: { timestamp: 'desc' },
      take: options?.limit || 100,
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      actionType: log.actionType,
      timestamp: log.timestamp,
      userId: log.userId,
      userEmail: log.userEmail,
      ipAddress: log.ipAddress,
      changes: log.changes,
      metadata: log.metadata,
      payloadHash: log.payloadHash,
    }));
  }

  /**
   * Get audit trail for a specific user
   */
  async getUserAuditTrail(userId: string, options?: {
    actionType?: ActionType;
    limit?: number;
  }): Promise<Array<{
    id: string;
    action: string;
    actionType: string | null;
    resource: string;
    resourceId: string | null;
    timestamp: Date;
    ipAddress: string | null;
    payloadHash: string;
  }>> {
    const logs = await prisma.auditLog.findMany({
      where: {
        userId,
        actionType: options?.actionType,
      },
      orderBy: { timestamp: 'desc' },
      take: options?.limit || 100,
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      actionType: log.actionType,
      resource: log.resource,
      resourceId: log.resourceId,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      payloadHash: log.payloadHash,
    }));
  }

  /**
   * Get compliance audit report
   * 
   * Generates a report showing the complete trail from identity verification to payout
   */
  async getComplianceReport(contractId: string): Promise<{
    contractId: string;
    talentUserId: string;
    businessUserId: string;
    auditTrail: Array<{
      sequenceNumber: number;
      actionType: string;
      timestamp: Date;
      actor: string;
      details: string;
      payloadHash: string;
      verified: boolean;
    }>;
    integrityCheck: {
      valid: boolean;
      totalEvents: number;
    };
  }> {
    try {
      // 1. Get contract details
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          talent: true,
          business: true,
        },
      });

      if (!contract) {
        throw new Error('Contract not found');
      }

      // 2. Get all audit logs for this contract
      const logs = await prisma.auditLog.findMany({
        where: {
          OR: [
            { contractId },
            { resourceId: contractId },
            { userId: contract.talentId },
            { userId: contract.businessId },
          ],
        },
        orderBy: { sequenceNumber: 'asc' },
      });

      // 3. Verify integrity of these logs
      const sequenceNumbers = logs.map((l) => l.sequenceNumber);
      const integrityCheck = await this.verifyAuditTrailIntegrity({
        startSequence: Math.min(...sequenceNumbers),
        endSequence: Math.max(...sequenceNumbers),
      });

      // 4. Format audit trail
      const auditTrail = logs.map((log) => ({
        sequenceNumber: log.sequenceNumber,
        actionType: log.actionType || log.action,
        timestamp: log.timestamp,
        actor: log.userEmail || log.userId || 'SYSTEM',
        details: JSON.stringify(log.metadata || {}),
        payloadHash: log.payloadHash,
        verified: !integrityCheck.details.some(
          (d) => d.sequenceNumber === log.sequenceNumber
        ),
      }));

      return {
        contractId,
        talentUserId: contract.talentId,
        businessUserId: contract.businessId,
        auditTrail,
        integrityCheck: {
          valid: integrityCheck.valid,
          totalEvents: logs.length,
        },
      };
    } catch (error) {
      logger.error('[Audit Log] Failed to generate compliance report', {
        error,
        contractId,
      });
      throw error;
    }
  }

  /**
   * Quick logging methods for common actions
   */
  
  async logPassportVerification(
    userId: string,
    success: boolean,
    metadata: Record<string, any>
  ): Promise<AuditLogResult> {
    return this.log({
      userId,
      action: success
        ? 'passport.verification_success'
        : 'passport.verification_failed',
      actionType: success
        ? ActionType.PASSPORT_VERIFICATION_SUCCESS
        : ActionType.PASSPORT_VERIFICATION_FAILED,
      resource: 'VettedMEPassport',
      resourceId: metadata.passportId,
      metadata,
    });
  }

  async logBiometricHandshake(
    userId: string,
    milestoneId: string,
    contractId: string,
    metadata: Record<string, any>
  ): Promise<AuditLogResult> {
    return this.log({
      userId,
      action: 'milestone.biometric_handshake_triggered',
      actionType: ActionType.BIOMETRIC_HANDSHAKE_TRIGGERED,
      resource: 'Milestone',
      resourceId: milestoneId,
      contractId,
      metadata,
    });
  }

  async logPayoutExecution(
    userId: string,
    milestoneId: string,
    contractId: string,
    metadata: Record<string, any>
  ): Promise<AuditLogResult> {
    return this.log({
      userId,
      action: 'payout.disbursement_executed',
      actionType: ActionType.PAYOUT_DISBURSEMENT_EXECUTED,
      resource: 'PaymentTransaction',
      resourceId: metadata.transactionId,
      contractId,
      metadata,
    });
  }

  async logW8BENGeneration(
    userId: string,
    metadata: Record<string, any>
  ): Promise<AuditLogResult> {
    return this.log({
      userId,
      action: 'compliance.w8ben_generated',
      actionType: ActionType.W8BEN_GENERATED,
      resource: 'TaxDocument',
      resourceId: `W8BEN_${userId}`,
      metadata,
    });
  }

  async logDisputeRaised(
    userId: string,
    milestoneId: string,
    contractId: string,
    metadata: Record<string, any>
  ): Promise<AuditLogResult> {
    return this.log({
      userId,
      action: 'milestone.dispute_raised',
      actionType: ActionType.CONTRACT_DISPUTE_RAISED,
      resource: 'Milestone',
      resourceId: milestoneId,
      contractId,
      metadata,
    });
  }
}

// Export singleton instance
export const auditLogService = new AuditLogService();
