import { Router } from 'express';
import {
  generateW8BEN,
  downloadW8BEN,
  getW8BENStatus,
  verifyContractCompliance,
} from '../controllers/compliance.controller';
import { authenticate } from '../middleware/auth';
import { enforceSessionSecurity } from '../middleware/sessionSecurity';
import { validateRequest } from '../middleware/validator';
import { body, param } from 'express-validator';

const router = Router();

/**
 * @route   POST /api/v1/compliance/w8ben/generate
 * @desc    Generate and digitally sign W-8BEN tax form
 * @access  Private (Talent only)
 */
router.post(
  '/w8ben/generate',
  authenticate,
  enforceSessionSecurity,
  [
    body('talentId')
      .isUUID()
      .withMessage('Invalid talent ID format'),
    body('digitalSignatureName')
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Digital signature name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s\-\.]+$/)
      .withMessage('Digital signature name must contain only letters, spaces, hyphens, and periods'),
  ],
  validateRequest,
  generateW8BEN
);

/**
 * @route   GET /api/v1/compliance/w8ben/:talentId/download
 * @desc    Download W-8BEN PDF document
 * @access  Private (Talent, Contract Business, or Admin)
 */
router.get(
  '/w8ben/:talentId/download',
  authenticate,
  enforceSessionSecurity,
  [
    param('talentId')
      .isUUID()
      .withMessage('Invalid talent ID format'),
  ],
  validateRequest,
  downloadW8BEN
);

/**
 * @route   GET /api/v1/compliance/w8ben/:talentId/status
 * @desc    Check W-8BEN compliance status
 * @access  Private
 */
router.get(
  '/w8ben/:talentId/status',
  authenticate,
  enforceSessionSecurity,
  [
    param('talentId')
      .isUUID()
      .withMessage('Invalid talent ID format'),
  ],
  validateRequest,
  getW8BENStatus
);

/**
 * @route   POST /api/v1/compliance/contracts/:contractId/verify
 * @desc    Verify full tax compliance for a contract
 * @access  Private (Contract parties or Admin)
 */
router.post(
  '/contracts/:contractId/verify',
  authenticate,
  enforceSessionSecurity,
  [
    param('contractId')
      .isUUID()
      .withMessage('Invalid contract ID format'),
  ],
  validateRequest,
  verifyContractCompliance
);

export default router;
