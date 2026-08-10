import { Request, Response } from 'express';
import { FraudDetectionService } from '../services/security/FraudDetectionService';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
const fraudDetection = new FraudDetectionService();

/**
 * POST /api/v1/disputes/initiate
 * 
 * Initiate milestone dispute
 * Moves funds to arbitration escrow vault
 */
export const initiateDispute = async (req: Request, res: Response) => {
  const { milestoneId, disputeReason, evidence } = req.body;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  try {
    logger.info('[Dispute] Initiating dispute', {
      milestoneId,
      userId,
      userRole,
    });

    // Validate milestone exists and get contract
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            business: true,
            talent: true,
          },
        },
      },
    });

    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    // Determine initiator type
    let initiatedBy: 'BUSINESS' | 'TALENT';
    if (milestone.contract.businessId === userId) {
      initiatedBy = 'BUSINESS';
    } else if (milestone.contract.talentId === userId) {
      initiatedBy = 'TALENT';
    } else {
      throw new AppError('Unauthorized: You are not part of this contract', 403);
    }

    // Check milestone is in valid state for dispute
    if (milestone.status === 'DISPUTED') {
      throw new AppError('This milestone is already under dispute', 400);
    }

    if (milestone.status === 'PAID') {
      throw new AppError('Cannot dispute a milestone that has already been paid', 400);
    }

    // Initiate dispute via fraud detection service
    await fraudDetection.initiateDispute(
      milestoneId,
      initiatedBy,
      userId,
      disputeReason,
      evidence
    );

    logger.info('[Dispute] Dispute initiated successfully', {
      milestoneId,
      initiatedBy,
    });

    return res.status(200).json({
      success: true,
      message: 'Dispute initiated successfully. Funds moved to arbitration escrow.',
      data: {
        milestoneId,
        status: 'DISPUTED',
        initiatedBy,
        disputeReason,
        arbitrationProcess: {
          status: 'PENDING_REVIEW',
          estimatedResolutionDays: 5,
          nextSteps: [
            'Both parties will be contacted for evidence',
            'VETTED arbitration team will review',
            'Decision will be made within 5-7 business days',
          ],
        },
      },
    });
  } catch (error) {
    logger.error('[Dispute] Error initiating dispute', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to initiate dispute',
    });
  }
};

/**
 * GET /api/v1/disputes/:milestoneId
 * 
 * Get dispute details
 */
export const getDisputeDetails = async (req: Request, res: Response) => {
  const { milestoneId } = req.params;
  const userId = req.user?.id;

  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            business: true,
            talent: true,
          },
        },
      },
    });

    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    // Check authorization
    if (
      milestone.contract.businessId !== userId &&
      milestone.contract.talentId !== userId
    ) {
      throw new AppError('Unauthorized: You are not part of this contract', 403);
    }

    // Get dispute-related audit logs
    const disputeLogs = await prisma.auditLog.findMany({
      where: {
        resourceId: milestoneId,
        action: { startsWith: 'milestone.dispute' },
      },
      orderBy: { timestamp: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: {
        milestoneId,
        status: milestone.status,
        amountUSD: milestone.amountUSD,
        title: milestone.title,
        description: milestone.description,
        contract: {
          id: milestone.contract.id,
          contractNumber: milestone.contract.contractNumber,
          projectName: milestone.contract.projectName,
          business: {
            id: milestone.contract.business.id,
            name: `${milestone.contract.business.firstName} ${milestone.contract.business.lastName}`,
            email: milestone.contract.business.email,
          },
          talent: {
            id: milestone.contract.talent.id,
            name: `${milestone.contract.talent.firstName} ${milestone.contract.talent.lastName}`,
            email: milestone.contract.talent.email,
          },
        },
        disputeHistory: disputeLogs.map((log) => ({
          action: log.action,
          timestamp: log.timestamp,
          metadata: log.metadata,
        })),
      },
    });
  } catch (error) {
    logger.error('[Dispute] Error getting dispute details', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to get dispute details',
    });
  }
};

/**
 * POST /api/v1/disputes/:milestoneId/resolve
 * 
 * Resolve dispute (admin only)
 */
export const resolveDispute = async (req: Request, res: Response) => {
  const { milestoneId } = req.params;
  const { resolution, winner, notes } = req.body;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (userRole !== 'ADMIN') {
    throw new AppError('Unauthorized: Admin access required', 403);
  }

  try {
    logger.info('[Dispute] Resolving dispute', {
      milestoneId,
      resolution,
      winner,
      adminUserId: userId,
    });

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            airwallexSubAccount: true,
          },
        },
      },
    });

    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    if (milestone.status !== 'DISPUTED') {
      throw new AppError('Milestone is not under dispute', 400);
    }

    await prisma.$transaction(async (tx) => {
      // Update milestone status based on resolution
      let newStatus: 'PAID' | 'WORK_SUBMITTED' | 'LOCKED';
      
      if (winner === 'TALENT') {
        newStatus = 'PAID';
        // Release funds to talent (would trigger Airwallex payout)
      } else if (winner === 'BUSINESS') {
        newStatus = 'LOCKED';
        // Return funds to business escrow
      } else {
        newStatus = 'WORK_SUBMITTED';
        // Partial settlement or re-work required
      }

      await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
      });

      // Update contract status
      await tx.contract.update({
        where: { id: milestone.contractId },
        data: {
          status: 'IN_PROGRESS',
          updatedAt: new Date(),
        },
      });

      // Unlock funds in Airwallex
      if (milestone.contract.airwallexSubAccount) {
        await tx.airwallexSubAccount.update({
          where: { id: milestone.contract.airwallexSubAccount.id },
          data: {
            lockedBalanceUSD: {
              decrement: milestone.amountUSD,
            },
            availableBalanceUSD: {
              increment: milestone.amountUSD,
            },
          },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'milestone.dispute_resolved',
          resource: 'Milestone',
          resourceId: milestoneId,
          changes: {
            before: { status: 'DISPUTED' },
            after: { status: newStatus },
          },
          metadata: {
            resolution,
            winner,
            notes,
          },
          contractId: milestone.contractId,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Dispute resolved successfully',
      data: {
        milestoneId,
        resolution,
        winner,
      },
    });
  } catch (error) {
    logger.error('[Dispute] Error resolving dispute', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to resolve dispute',
    });
  }
};
