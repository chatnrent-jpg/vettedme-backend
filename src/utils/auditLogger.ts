import crypto from 'crypto';
import { PrismaClient, ActionType } from '@prisma/client';
import { logger } from './logger';
import { auditLogService } from '../services/audit/AuditLogService';

const prisma = new PrismaClient();

/**
 * Global Audit Logger Utility
 * 
 * Simple, easy-to-use function for logging audit events throughout the codebase.
 * Automatically generates cryptographic SHA-256 hash of the payload for immutability.
 * 
 * Usage:
 * ```typescript
 * await logAuditEvent(
 *   userId,
 *   ActionType.MILESTONE_RELEASED,
 *   milestoneId,
 *   { amount: 3000, currency: 'USD' },
 *   req.ip,
 *   req.headers['user-agent']
 * );
 * ```
 */
export const logAuditEvent = async (
  actorId: string,
  actionType: ActionType,
  resourceId: string,
  rawPayload: object,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  try {
    // Convert payload into an immutable SHA-256 string signature hash
    const payloadString = JSON.stringify(rawPayload, Object.keys(rawPayload).sort());
    const hash = crypto.createHash('sha256').update(payloadString).digest('hex');

    // Determine resource type from ActionType
    const resource = getResourceFromActionType(actionType);

    // Determine action string
    const action = getActionStringFromActionType(actionType);

    // Create audit log entry with blockchain-like chaining via service
    await auditLogService.log({
      userId: actorId,
      action,
      actionType,
      resource,
      resourceId,
      metadata: rawPayload,
      ipAddress,
      userAgent,
    });

    logger.debug('[Audit Logger] Event logged', {
      actorId,
      actionType,
      resourceId,
      payloadHash: hash,
    });
  } catch (error) {
    // Critical: Audit logging failures should be logged but not throw
    // We don't want to break the main application flow
    logger.error('[Audit Logger] Failed to log audit event', {
      error,
      actorId,
      actionType,
      resourceId,
    });
    
    // In production, send to external monitoring (Datadog, Sentry, etc.)
    // This ensures audit failures are tracked even if database is down
  }
};

/**
 * Quick logging functions for common events
 */

export const logPassportVerification = async (
  userId: string,
  passportId: string,
  success: boolean,
  metadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    success
      ? ActionType.PASSPORT_VERIFICATION_SUCCESS
      : ActionType.PASSPORT_VERIFICATION_FAILED,
    passportId,
    metadata,
    ipAddress,
    userAgent
  );
};

export const logBiometricScan = async (
  userId: string,
  passportId: string,
  success: boolean,
  metadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    success ? ActionType.BIOMETRIC_SCAN_SUCCESS : ActionType.BIOMETRIC_SCAN_FAILED,
    passportId,
    metadata,
    ipAddress,
    userAgent
  );
};

export const logAirwallexSubAccountProvisioned = async (
  userId: string,
  contractId: string,
  metadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    ActionType.AIRWALLEX_SUBACCOUNT_PROVISIONED,
    contractId,
    metadata,
    ipAddress,
    userAgent
  );
};

export const logCapitalDepositConfirmed = async (
  userId: string,
  contractId: string,
  metadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    ActionType.CAPITAL_DEPOSIT_CONFIRMED,
    contractId,
    metadata,
    ipAddress,
    userAgent
  );
};

export const logBiometricHandshake = async (
  userId: string,
  milestoneId: string,
  metadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    ActionType.BIOMETRIC_HANDSHAKE_TRIGGERED,
    milestoneId,
    metadata,
    ipAddress,
    userAgent
  );
};

export const logPayoutDisbursement = async (
  userId: string,
  transactionId: string,
  metadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    ActionType.PAYOUT_DISBURSEMENT_EXECUTED,
    transactionId,
    metadata,
    ipAddress,
    userAgent
  );
};

export const logW8BENGenerated = async (
  userId: string,
  taxDocId: string,
  metadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    ActionType.W8BEN_GENERATED,
    taxDocId,
    metadata,
    ipAddress,
    userAgent
  );
};

export const logW8BENDownloaded = async (
  userId: string,
  taxDocId: string,
  metadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    ActionType.W8BEN_DOWNLOADED,
    taxDocId,
    metadata,
    ipAddress,
    userAgent
  );
};

export const logContractCreated = async (
  userId: string,
  contractId: string,
  metadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    ActionType.CONTRACT_CREATED,
    contractId,
    metadata,
    ipAddress,
    userAgent
  );
};

export const logMilestoneReleased = async (
  userId: string,
  milestoneId: string,
  metadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    ActionType.MILESTONE_RELEASED,
    milestoneId,
    metadata,
    ipAddress,
    userAgent
  );
};

export const logMilestonePaid = async (
  userId: string,
  milestoneId: string,
  metadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    ActionType.MILESTONE_PAID,
    milestoneId,
    metadata,
    ipAddress,
    userAgent
  );
};

export const logDisputeRaised = async (
  userId: string,
  milestoneId: string,
  metadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    ActionType.CONTRACT_DISPUTE_RAISED,
    milestoneId,
    metadata,
    ipAddress,
    userAgent
  );
};

export const logFraudAlert = async (
  userId: string,
  resourceId: string,
  metadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    ActionType.FRAUD_ALERT_TRIGGERED,
    resourceId,
    metadata,
    ipAddress,
    userAgent
  );
};

export const logUserLogin = async (
  userId: string,
  metadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    ActionType.USER_LOGIN,
    userId,
    metadata,
    ipAddress,
    userAgent
  );
};

export const logUserLogout = async (
  userId: string,
  metadata: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    ActionType.USER_LOGOUT,
    userId,
    metadata,
    ipAddress,
    userAgent
  );
};

/**
 * Helper: Map ActionType to resource name
 */
function getResourceFromActionType(actionType: ActionType): string {
  const resourceMap: Record<string, string> = {
    PASSPORT_VERIFICATION_SUCCESS: 'VettedMEPassport',
    PASSPORT_VERIFICATION_FAILED: 'VettedMEPassport',
    PASSPORT_REVOKED: 'VettedMEPassport',
    BIOMETRIC_SCAN_SUCCESS: 'VettedMEPassport',
    BIOMETRIC_SCAN_FAILED: 'VettedMEPassport',
    KYC_DOCUMENT_UPLOADED: 'VettedMEPassport',
    
    AIRWALLEX_SUBACCOUNT_PROVISIONED: 'AirwallexSubAccount',
    CAPITAL_DEPOSIT_CONFIRMED: 'Contract',
    ESCROW_FUNDS_LOCKED: 'Contract',
    ESCROW_FUNDS_RELEASED: 'Contract',
    BIOMETRIC_HANDSHAKE_TRIGGERED: 'Milestone',
    PAYOUT_DISBURSEMENT_EXECUTED: 'PaymentTransaction',
    PAYOUT_DISBURSEMENT_FAILED: 'PaymentTransaction',
    PLATFORM_FEE_CAPTURED: 'PaymentTransaction',
    FX_SPREAD_CAPTURED: 'PaymentTransaction',
    
    W8BEN_GENERATED: 'TaxDocument',
    W8BEN_DOWNLOADED: 'TaxDocument',
    W8BEN_SIGNATURE_CAPTURED: 'TaxDocument',
    COMPLIANCE_TAX_FORM_VAULTED: 'TaxDocument',
    
    CONTRACT_CREATED: 'Contract',
    CONTRACT_FUNDED: 'Contract',
    CONTRACT_ACTIVATED: 'Contract',
    CONTRACT_COMPLETED: 'Contract',
    CONTRACT_CANCELLED: 'Contract',
    
    MILESTONE_CREATED: 'Milestone',
    MILESTONE_WORK_SUBMITTED: 'Milestone',
    MILESTONE_RELEASED: 'Milestone',
    MILESTONE_PAID: 'Milestone',
    MILESTONE_DISPUTED: 'Milestone',
    
    CONTRACT_DISPUTE_RAISED: 'Dispute',
    DISPUTE_RESOLVED: 'Dispute',
    FRAUD_ALERT_TRIGGERED: 'SecurityIncident',
    SECURITY_INCIDENT: 'SecurityIncident',
    
    USER_LOGIN: 'User',
    USER_LOGOUT: 'User',
    SESSION_EXPIRED: 'User',
    PASSWORD_CHANGED: 'User',
    
    ADMIN_ACTION: 'System',
    SYSTEM_CONFIGURATION_CHANGED: 'System',
  };

  return resourceMap[actionType] || 'Unknown';
}

/**
 * Helper: Map ActionType to action string
 */
function getActionStringFromActionType(actionType: ActionType): string {
  // Convert PASSPORT_VERIFICATION_SUCCESS to passport.verification_success
  return actionType.toLowerCase().replace(/_/g, '.');
}

/**
 * Batch logging for multiple events (e.g., during milestone release)
 */
export const logAuditEventBatch = async (
  events: Array<{
    actorId: string;
    actionType: ActionType;
    resourceId: string;
    rawPayload: object;
    ipAddress?: string;
    userAgent?: string;
  }>
): Promise<void> => {
  try {
    // Log events in parallel for performance
    await Promise.all(
      events.map((event) =>
        logAuditEvent(
          event.actorId,
          event.actionType,
          event.resourceId,
          event.rawPayload,
          event.ipAddress,
          event.userAgent
        )
      )
    );
  } catch (error) {
    logger.error('[Audit Logger] Failed to log batch events', {
      error,
      eventCount: events.length,
    });
  }
};
