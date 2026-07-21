import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { leadManagementService } from '../services/gtm/LeadManagementService';
import { multiCurrencyLedgerService } from '../services/vettedpay/MultiCurrencyLedgerService';

const router = Router();

/**
 * ============================================================================
 * LEAD MANAGEMENT & OUTREACH
 * ============================================================================
 */

/**
 * POST /api/v1/gtm/leads
 * Create new lead from LinkedIn/email outreach
 */
router.post(
  '/leads',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      firstName,
      lastName,
      email,
      linkedInUrl,
      companyName,
      title,
      leadSource,
      companySize,
      companyWebsite,
    } = req.body;

    const lead = await leadManagementService.createLead({
      firstName,
      lastName,
      email,
      linkedInUrl,
      companyName,
      title,
      leadSource,
      companySize,
      companyWebsite,
    });

    res.status(201).json({
      success: true,
      message: 'Lead created and outreach sequence initiated',
      lead,
    });
  })
);

/**
 * POST /api/v1/gtm/leads/:leadId/qualify
 * Qualify lead after discovery call
 */
router.post(
  '/leads/:leadId/qualify',
  asyncHandler(async (req: Request, res: Response) => {
    const { leadId } = req.params;
    const { hiringIntentDetected, budgetQualified, technicalFitScore } = req.body;

    await leadManagementService.qualifyLead({
      leadId,
      hiringIntentDetected,
      budgetQualified,
      technicalFitScore,
    });

    res.status(200).json({
      success: true,
      message: 'Lead qualified',
    });
  })
);

/**
 * POST /api/v1/gtm/leads/:leadId/deals
 * Create deal from qualified lead
 */
router.post(
  '/leads/:leadId/deals',
  asyncHandler(async (req: Request, res: Response) => {
    const { leadId } = req.params;
    const dealData = req.body;

    const deal = await leadManagementService.createDeal(leadId, dealData);

    res.status(201).json({
      success: true,
      message: 'Deal created',
      deal,
    });
  })
);

/**
 * POST /api/v1/gtm/outreach/:touchId/opened
 * Track email open
 */
router.post(
  '/outreach/:touchId/opened',
  asyncHandler(async (req: Request, res: Response) => {
    const { touchId } = req.params;

    await leadManagementService.trackEmailOpen(touchId);

    res.status(200).json({ success: true });
  })
);

/**
 * POST /api/v1/gtm/outreach/:touchId/clicked
 * Track link click
 */
router.post(
  '/outreach/:touchId/clicked',
  asyncHandler(async (req: Request, res: Response) => {
    const { touchId } = req.params;

    await leadManagementService.trackLinkClick(touchId);

    res.status(200).json({ success: true });
  })
);

/**
 * GET /api/v1/gtm/leads/follow-up
 * Get leads requiring follow-up
 */
router.get(
  '/leads/follow-up',
  asyncHandler(async (req: Request, res: Response) => {
    const leads = await leadManagementService.getLeadsForFollowUp();

    res.status(200).json({
      success: true,
      leads,
      count: leads.length,
    });
  })
);

/**
 * ============================================================================
 * MULTI-CURRENCY LEDGER & TREASURY
 * ============================================================================
 */

/**
 * POST /api/v1/gtm/wallets
 * Create multi-currency wallet
 */
router.post(
  '/wallets',
  asyncHandler(async (req: Request, res: Response) => {
    const { walletType, ownerId, ownerType } = req.body;

    const wallet = await multiCurrencyLedgerService.createWallet({
      walletType,
      ownerId,
      ownerType,
    });

    res.status(201).json({
      success: true,
      message: 'Multi-currency wallet created',
      wallet,
    });
  })
);

/**
 * POST /api/v1/gtm/wallets/:walletId/deposit
 * Deposit funds into wallet
 */
router.post(
  '/wallets/:walletId/deposit',
  asyncHandler(async (req: Request, res: Response) => {
    const { walletId } = req.params;
    const { amount, currency, reference } = req.body;

    const transaction = await multiCurrencyLedgerService.depositFunds({
      walletId,
      amount,
      currency,
      reference,
    });

    res.status(200).json({
      success: true,
      message: 'Funds deposited successfully',
      transaction,
    });
  })
);

/**
 * POST /api/v1/gtm/milestones/:milestoneId/disburse
 * Disburse milestone payment with revenue capture
 */
router.post(
  '/milestones/:milestoneId/disburse',
  asyncHandler(async (req: Request, res: Response) => {
    const { milestoneId } = req.params;
    const { talentWalletId, buyerWalletId, amount, currency } = req.body;

    const result = await multiCurrencyLedgerService.disburseMilestonePayment({
      milestoneId,
      talentWalletId,
      buyerWalletId,
      amount,
      currency,
    });

    res.status(200).json({
      success: true,
      message: 'Milestone disbursed with revenue capture',
      result,
    });
  })
);

/**
 * GET /api/v1/gtm/treasury
 * Get treasury snapshot
 */
router.get(
  '/treasury',
  asyncHandler(async (req: Request, res: Response) => {
    const snapshot = await multiCurrencyLedgerService.getTreasurySnapshot();

    res.status(200).json({
      success: true,
      snapshot,
    });
  })
);

export { router as gtmRouter };
