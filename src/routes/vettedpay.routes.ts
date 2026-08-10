import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { airwallexService } from '../services/vettedpay/AirwallexService';
import { prisma } from '../lib/prisma';
const router = Router();
/**
 * POST /api/v1/vettedpay/account/create
 * Create Airwallex sub-account for buyer
 */
router.post(
  '/account/create',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, buyerLegalName, buyerEmail, initialBalanceUSD } = req.body;

    if (!userId || !buyerLegalName || !buyerEmail) {
      throw new AppError('Missing required fields', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'BUYER') {
      throw new AppError('Invalid buyer user', 400);
    }

    const result = await airwallexService.createSubAccount({
      userId,
      buyerLegalName,
      buyerEmail,
      initialBalanceUSD: initialBalanceUSD || 0,
    });

    if (!result.success) {
      throw new AppError(result.errorMessage || 'Account creation failed', 500);
    }

    await prisma.airwallexSubAccount.create({
      data: {
        userId,
        airwallexAccountId: result.airwallexAccountId,
        accountHolderName: buyerLegalName,
        accountStatus: 'ACTIVE',
        legalOwner: buyerLegalName,
        availableBalance: result.availableBalance,
      },
    });

    res.status(201).json({
      success: true,
      accountId: result.airwallexAccountId,
      status: result.accountStatus,
      availableBalance: result.availableBalance,
    });
  })
);

/**
 * POST /api/v1/vettedpay/escrow/lock
 * Lock escrow funds for milestone
 */
router.post(
  '/escrow/lock',
  asyncHandler(async (req: Request, res: Response) => {
    const { milestoneId, amountUSD } = req.body;

    if (!milestoneId || !amountUSD) {
      throw new AppError('Missing milestoneId or amountUSD', 400);
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            airwallexAccount: true,
          },
        },
      },
    });

    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    if (!milestone.contract.airwallexAccount) {
      throw new AppError('No Airwallex account linked to contract', 400);
    }

    const success = await airwallexService.lockEscrowFunds(
      milestone.contract.airwallexAccount.airwallexAccountId,
      amountUSD,
      milestoneId
    );

    if (!success) {
      throw new AppError('Escrow fund locking failed', 500);
    }

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        escrowedAmount: amountUSD,
        status: 'IN_PROGRESS',
      },
    });

    await prisma.webhookEvent.create({
      data: {
        eventType: 'VETTEDPAY_ESCROW_LOCKED',
        status: 'COMPLETED',
        payload: { milestoneId, amountUSD },
        sourceSystem: 'VettedPay',
        processedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Escrow funds locked successfully',
      milestoneId,
      amountLocked: amountUSD,
    });
  })
);

/**
 * POST /api/v1/vettedpay/w8ben/generate
 * Generate W-8BEN tax form
 */
router.post(
  '/w8ben/generate',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, taxIdNumber } = req.body;

    if (!userId || !taxIdNumber) {
      throw new AppError('Missing userId or taxIdNumber', 400);
    }

    const documentUrl = await airwallexService.generateW8BEN(userId, taxIdNumber);

    if (!documentUrl) {
      throw new AppError('W-8BEN generation failed', 500);
    }

    const account = await prisma.airwallexSubAccount.findFirst({
      where: { userId },
    });

    if (account) {
      await prisma.airwallexSubAccount.update({
        where: { id: account.id },
        data: {
          w8benGenerated: true,
          w8benDocumentUrl: documentUrl,
        },
      });
    }

    res.status(200).json({
      success: true,
      documentUrl,
      message: 'W-8BEN form generated successfully',
    });
  })
);

/**
 * GET /api/v1/vettedpay/payout/:payoutId
 * Get payout status
 */
router.get(
  '/payout/:payoutId',
  asyncHandler(async (req: Request, res: Response) => {
    const { payoutId } = req.params;

    const status = await airwallexService.getPayoutStatus(payoutId);

    const milestone = await prisma.milestone.findFirst({
      where: { airwallexPayoutId: payoutId },
    });

    res.status(200).json({
      payoutId,
      status,
      milestoneId: milestone?.id,
    });
  })
);

/**
 * GET /api/v1/vettedpay/account/:userId
 * Get Airwallex account details
 */
router.get(
  '/account/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const account = await prisma.airwallexSubAccount.findFirst({
      where: { userId },
    });

    if (!account) {
      throw new AppError('Airwallex account not found', 404);
    }

    res.status(200).json({ account });
  })
);

export { router as vettedPayRouter };
