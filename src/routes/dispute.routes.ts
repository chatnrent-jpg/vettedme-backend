import { Router } from 'express';
import {
  initiateDispute,
  getDisputeDetails,
  resolveDispute,
} from '../controllers/dispute.controller';
import { authenticate } from '../middleware/auth';
import { enforceSessionSecurity, requireBiometricReVerification, rateLimitSensitiveActions } from '../middleware/sessionSecurity';
import { validateRequest } from '../middleware/validator';
import { body, param } from 'express-validator';

const router = Router();

/**
 * @route   POST /api/v1/disputes/initiate
 * @desc    Initiate milestone dispute
 * @access  Private (Business or Talent)
 * @security Requires biometric re-verification
 */
router.post(
  '/initiate',
  authenticate,
  enforceSessionSecurity,
  requireBiometricReVerification,
  rateLimitSensitiveActions(3, 60 * 60 * 1000), // 3 disputes per hour max
  [
    body('milestoneId').isUUID().withMessage('Invalid milestone ID format'),
    body('disputeReason')
      .isString()
      .trim()
      .isLength({ min: 20, max: 1000 })
      .withMessage('Dispute reason must be between 20 and 1000 characters'),
    body('evidence')
      .optional()
      .isArray()
      .withMessage('Evidence must be an array of URLs'),
  ],
  validateRequest,
  initiateDispute
);

/**
 * @route   GET /api/v1/disputes/:milestoneId
 * @desc    Get dispute details and history
 * @access  Private (Contract parties only)
 */
router.get(
  '/:milestoneId',
  authenticate,
  enforceSessionSecurity,
  [param('milestoneId').isUUID().withMessage('Invalid milestone ID format')],
  validateRequest,
  getDisputeDetails
);

/**
 * @route   POST /api/v1/disputes/:milestoneId/resolve
 * @desc    Resolve dispute (admin only)
 * @access  Private (Admin only)
 */
router.post(
  '/:milestoneId/resolve',
  authenticate,
  enforceSessionSecurity,
  [
    param('milestoneId').isUUID().withMessage('Invalid milestone ID format'),
    body('resolution')
      .isString()
      .isIn(['FAVOR_TALENT', 'FAVOR_BUSINESS', 'PARTIAL_SETTLEMENT'])
      .withMessage('Invalid resolution type'),
    body('winner')
      .isString()
      .isIn(['TALENT', 'BUSINESS', 'PARTIAL'])
      .withMessage('Invalid winner'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 2000 })
      .withMessage('Notes must be less than 2000 characters'),
  ],
  validateRequest,
  resolveDispute
);

export default router;
