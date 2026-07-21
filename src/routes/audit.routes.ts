import { Router } from 'express';
import {
  getResourceAuditTrail,
  getUserAuditTrail,
  verifyAuditTrailIntegrity,
  getComplianceReport,
  getAuditStats,
} from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth';
import { enforceSessionSecurity } from '../middleware/sessionSecurity';
import { validateRequest } from '../middleware/validator';
import { param, body, query } from 'express-validator';

const router = Router();

/**
 * @route   GET /api/v1/audit/resource/:resourceId
 * @desc    Get audit trail for a specific resource
 * @access  Private (Admin)
 */
router.get(
  '/resource/:resourceId',
  authenticate,
  enforceSessionSecurity,
  [
    param('resourceId').isString().withMessage('Invalid resource ID'),
    query('resource').optional().isString().withMessage('Invalid resource type'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
  ],
  validateRequest,
  getResourceAuditTrail
);

/**
 * @route   GET /api/v1/audit/user/:userId
 * @desc    Get audit trail for a specific user
 * @access  Private (User themselves or Admin)
 */
router.get(
  '/user/:userId',
  authenticate,
  enforceSessionSecurity,
  [
    param('userId').isUUID().withMessage('Invalid user ID'),
    query('actionType').optional().isString().withMessage('Invalid action type'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
  ],
  validateRequest,
  getUserAuditTrail
);

/**
 * @route   POST /api/v1/audit/verify
 * @desc    Verify the integrity of the audit trail
 * @access  Private (Admin only)
 */
router.post(
  '/verify',
  authenticate,
  enforceSessionSecurity,
  [
    body('startSequence')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Start sequence must be a positive integer'),
    body('endSequence')
      .optional()
      .isInt({ min: 1 })
      .withMessage('End sequence must be a positive integer'),
  ],
  validateRequest,
  verifyAuditTrailIntegrity
);

/**
 * @route   GET /api/v1/audit/compliance/:contractId
 * @desc    Get compliance report for a contract
 * @access  Private (Contract parties or Admin)
 */
router.get(
  '/compliance/:contractId',
  authenticate,
  enforceSessionSecurity,
  [param('contractId').isUUID().withMessage('Invalid contract ID')],
  validateRequest,
  getComplianceReport
);

/**
 * @route   GET /api/v1/audit/stats
 * @desc    Get audit log statistics
 * @access  Private (Admin only)
 */
router.get(
  '/stats',
  authenticate,
  enforceSessionSecurity,
  getAuditStats
);

export default router;
