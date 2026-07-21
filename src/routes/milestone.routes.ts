import { Router } from 'express';
import { releaseMilestone, getMilestoneStatus } from '../controllers/milestone.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { rateLimitMilestoneRelease } from '../middleware/rateLimiter';
import { body, param } from 'express-validator';

const router = Router();

/**
 * @route   POST /api/v1/milestones/:id/release
 * @desc    Release milestone payment after biometric verification
 * @access  Private (Business users only)
 * 
 * AGGRESSIVE RATE LIMITS (TOKEN BUCKET - Prevents face-spoofing brute-force):
 * - 5 biometric validation attempts per 15 minutes per IP
 * - 5 biometric validation attempts per 15 minutes per User ID
 * - BOTH limits enforced simultaneously (IP AND User)
 * - 30-minute lockout after exhaustion
 * - Clean 429 JSON response with lockout duration details
 */
router.post(
  '/:id/release',
  rateLimitMilestoneRelease, // Apply rate limiting FIRST
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid milestone ID format'),
    body('biometricImageBase64')
      .isString()
      .notEmpty()
      .withMessage('Biometric image is required')
      .isBase64()
      .withMessage('Biometric image must be base64 encoded'),
  ],
  validateRequest,
  releaseMilestone
);

/**
 * @route   GET /api/v1/milestones/:id/status
 * @desc    Get milestone status and payment details
 * @access  Private
 */
router.get(
  '/:id/status',
  authenticate,
  [param('id').isUUID().withMessage('Invalid milestone ID format')],
  validateRequest,
  getMilestoneStatus
);

export default router;
