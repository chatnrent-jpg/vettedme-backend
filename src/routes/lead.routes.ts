/**
 * ============================================================================
 * VETTED B2B LEAD CAPTURE ROUTES
 * ============================================================================
 * 
 * Handles enterprise lead submissions from the vettedforce.com landing page
 * 
 * ============================================================================
 */

import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { createLead, getLeads, updateLeadStatus } from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * Middleware to validate request and return errors
 */
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

/**
 * ============================================================================
 * PUBLIC ROUTES (NO AUTH REQUIRED)
 * ============================================================================
 */

/**
 * POST /api/v1/leads
 * 
 * Create new enterprise lead from landing page
 * 
 * Rate Limiting: Applied globally (handled by express-rate-limit)
 */
router.post(
  '/',
  [
    body('email')
      .isEmail()
      .withMessage('Valid corporate email is required')
      .normalizeEmail(),
    body('budget')
      .isString()
      .isIn(['5k-10k', '10k-20k', '20k-30k', '30k-50k', '50k+'])
      .withMessage('Valid budget range is required'),
    body('techStack')
      .isString()
      .isIn([
        'typescript-react',
        'python-django',
        'java-spring',
        'go-kubernetes',
        'mobile-ios-android',
        'fullstack',
        'other',
      ])
      .withMessage('Valid tech stack is required'),
  ],
  validateRequest,
  createLead
);

/**
 * ============================================================================
 * ADMIN ROUTES (AUTH REQUIRED)
 * ============================================================================
 */

/**
 * GET /api/v1/leads
 * 
 * Get all enterprise leads with filtering and pagination
 * 
 * Query Parameters:
 * - status: Filter by lead status (NEW, CONTACTED, QUALIFIED, etc.)
 * - minScore: Minimum lead score (0-100)
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50)
 */
router.get(
  '/',
  authenticate,
  [
    query('status')
      .optional()
      .isString()
      .isIn(['NEW', 'CONTACTED', 'QUALIFIED', 'DEMO_SCHEDULED', 'CONVERTED', 'LOST'])
      .withMessage('Invalid status filter'),
    query('minScore')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Minimum score must be between 0 and 100'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  getLeads
);

/**
 * PATCH /api/v1/leads/:id
 * 
 * Update lead status and notes (admin only)
 */
router.patch(
  '/:id',
  authenticate,
  [
    param('id')
      .isUUID()
      .withMessage('Invalid lead ID format'),
    body('status')
      .isString()
      .isIn(['NEW', 'CONTACTED', 'QUALIFIED', 'DEMO_SCHEDULED', 'CONVERTED', 'LOST'])
      .withMessage('Invalid status'),
    body('notes')
      .optional()
      .isString()
      .withMessage('Notes must be a string'),
  ],
  validateRequest,
  updateLeadStatus
);

export default router;
