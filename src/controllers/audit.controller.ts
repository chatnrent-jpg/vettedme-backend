import { Request, Response } from 'express';
import { auditLogService } from '../services/audit/AuditLogService';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';

/**
 * GET /api/v1/audit/resource/:resourceId
 * 
 * Get audit trail for a specific resource (contract, milestone, passport, etc.)
 */
export const getResourceAuditTrail = async (req: Request, res: Response) => {
  const { resourceId } = req.params;
  const { resource, limit } = req.query;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
    // Authorization: Admin only for now
    // In production, implement proper authorization based on resource ownership
    if (userRole !== 'ADMIN') {
      throw new AppError('Unauthorized: Admin access required', 403);
    }

    const trail = await auditLogService.getResourceAuditTrail(resourceId, {
      resource: resource as string,
      limit: limit ? parseInt(limit as string) : 100,
    });

    return res.status(200).json({
      success: true,
      data: {
        resourceId,
        resource,
        totalEntries: trail.length,
        trail,
      },
    });
  } catch (error) {
    logger.error('[Audit] Error fetching resource audit trail', {
      error,
      resourceId,
    });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch audit trail',
    });
  }
};

/**
 * GET /api/v1/audit/user/:userId
 * 
 * Get audit trail for a specific user
 */
export const getUserAuditTrail = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { actionType, limit } = req.query;
  const currentUserId = req.user?.id;
  const userRole = req.user?.role;

  try {
    // Authorization: User can see their own, admin can see all
    if (userRole !== 'ADMIN' && currentUserId !== userId) {
      throw new AppError('Unauthorized: Cannot view other users\' audit trails', 403);
    }

    const trail = await auditLogService.getUserAuditTrail(userId, {
      actionType: actionType as any,
      limit: limit ? parseInt(limit as string) : 100,
    });

    return res.status(200).json({
      success: true,
      data: {
        userId,
        totalEntries: trail.length,
        trail,
      },
    });
  } catch (error) {
    logger.error('[Audit] Error fetching user audit trail', { error, userId });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch audit trail',
    });
  }
};

/**
 * POST /api/v1/audit/verify
 * 
 * Verify the integrity of the audit trail
 */
export const verifyAuditTrailIntegrity = async (req: Request, res: Response) => {
  const { startSequence, endSequence } = req.body;
  const userRole = req.user?.role;

  try {
    // Authorization: Admin only
    if (userRole !== 'ADMIN') {
      throw new AppError('Unauthorized: Admin access required', 403);
    }

    logger.info('[Audit] Starting integrity verification', {
      startSequence,
      endSequence,
    });

    const result = await auditLogService.verifyAuditTrailIntegrity({
      startSequence,
      endSequence,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('[Audit] Error verifying audit trail integrity', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to verify audit trail integrity',
    });
  }
};

/**
 * GET /api/v1/audit/compliance/:contractId
 * 
 * Get compliance report for a contract (from identity verification to payout)
 */
export const getComplianceReport = async (req: Request, res: Response) => {
  const { contractId } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
    logger.info('[Audit] Generating compliance report', {
      contractId,
      requestedBy: userId,
    });

    // Authorization: Admin or contract parties
    if (userRole !== 'ADMIN') {
      // Check if user is part of this contract
      const { PrismaClient } = require('@prisma/client');
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        throw new AppError('Contract not found', 404);
      }

      if (contract.businessId !== userId && contract.talentId !== userId) {
        throw new AppError('Unauthorized: You are not part of this contract', 403);
      }
    }

    const report = await auditLogService.getComplianceReport(contractId);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('[Audit] Error generating compliance report', {
      error,
      contractId,
    });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report',
    });
  }
};

/**
 * GET /api/v1/audit/stats
 * 
 * Get audit log statistics
 */
export const getAuditStats = async (req: Request, res: Response) => {
  const userRole = req.user?.role;

  try {
    // Authorization: Admin only
    if (userRole !== 'ADMIN') {
      throw new AppError('Unauthorized: Admin access required', 403);
    }

    const { PrismaClient } = require('@prisma/client');
    // Get statistics
    const [
      totalLogs,
      totalUsers,
      logsByActionType,
      recentLogs,
    ] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        distinct: ['userId'],
        select: { userId: true },
      }),
      prisma.auditLog.groupBy({
        by: ['actionType'],
        _count: true,
      }),
      prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          actionType: true,
          resource: true,
          timestamp: true,
          userId: true,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalLogs,
        totalUniqueUsers: totalUsers.length,
        logsByActionType: logsByActionType.map((item) => ({
          actionType: item.actionType,
          count: item._count,
        })),
        recentLogs,
      },
    });
  } catch (error) {
    logger.error('[Audit] Error fetching audit stats', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch audit statistics',
    });
  }
};
