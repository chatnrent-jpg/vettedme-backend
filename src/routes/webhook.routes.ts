import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { webhookOrchestrator } from '../services/webhooks/WebhookOrchestrator';
import { smileIDService } from '../services/vettedme/SmileIDService';
import { airwallexService } from '../services/vettedpay/AirwallexService';
import { 
  handleAirwallexDepositWebhook, 
  handleAirwallexPayoutWebhook 
} from '../controllers/webhook.controller';
import { rateLimitAirwallexWebhook } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = Router();

/**
 * VettedME Webhook Endpoint
 * Receives verification completion events from Smile ID
 */
router.post(
  '/vettedme',
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-signature'] as string;
    const payload = JSON.stringify(req.body);

    if (!smileIDService.validateWebhookSignature(payload, signature)) {
      logger.warn('Invalid VettedME webhook signature', {
        ip: req.ip,
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    logger.info('VettedME webhook received', {
      eventType: req.body.event_type,
      userId: req.body.user_id,
    });

    const event = {
      userId: req.body.user_id,
      sessionId: req.body.session_id,
      verificationType: req.body.verification_type,
      verificationStatus: req.body.verification_status,
      biometricData: req.body.biometric_data,
      skillData: req.body.skill_data,
    };

    await webhookOrchestrator.handleVettedMEVerification(event);

    res.status(200).json({ received: true });
  })
);

/**
 * VettedPay Biometric Handshake Webhook
 * Triggered when talent completes biometric handshake for milestone
 */
router.post(
  '/vettedpay/handshake',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('VettedPay handshake webhook received', {
      milestoneId: req.body.milestone_id,
      userId: req.body.user_id,
    });

    const event = {
      milestoneId: req.body.milestone_id,
      userId: req.body.user_id,
      biometricSessionId: req.body.biometric_session_id,
      handshakeVerified: req.body.handshake_verified,
    };

    await webhookOrchestrator.handleBiometricHandshake(event);

    res.status(200).json({ received: true });
  })
);

/**
 * Airwallex Deposit Webhook
 * Handles payment.inbound_transfer.success events when enterprises fund escrow
 * 
 * MULTI-LAYER PROTECTION:
 * 1. IP Whitelist: Only accepts webhooks from verified Airwallex IP ranges
 * 2. Deduplication: Rejects duplicate transaction hashes (24hr cache)
 * 3. Rate Limiting: 100 req/min, 500 req/hr per IP
 * 4. Concurrency Control: Prevents race conditions on simultaneous identical transactions
 */
router.post(
  '/airwallex/deposit',
  rateLimitAirwallexWebhook, // Apply rate limiting FIRST
  asyncHandler(handleAirwallexDepositWebhook)
);

/**
 * Airwallex Payout Webhook
 * Handles payout.completed and payout.failed events
 * 
 * MULTI-LAYER PROTECTION:
 * 1. IP Whitelist: Only accepts webhooks from verified Airwallex IP ranges
 * 2. Deduplication: Rejects duplicate transaction hashes (24hr cache)
 * 3. Rate Limiting: 100 req/min, 500 req/hr per IP
 * 4. Concurrency Control: Prevents race conditions on simultaneous identical transactions
 */
router.post(
  '/airwallex/payout',
  rateLimitAirwallexWebhook, // Apply rate limiting FIRST
  asyncHandler(handleAirwallexPayoutWebhook)
);

/**
 * Health check for webhook endpoints
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhooks: {
      vettedme: {
        endpoint: '/api/v1/webhooks/vettedme',
        events: ['verification.completed', 'verification.failed'],
        status: 'active'
      },
      vettedpay_handshake: {
        endpoint: '/api/v1/webhooks/vettedpay/handshake',
        events: ['handshake.verified', 'handshake.failed'],
        status: 'active'
      },
      airwallex_deposit: {
        endpoint: '/api/v1/webhooks/airwallex/deposit',
        events: ['payment.inbound_transfer.success'],
        status: 'active'
      },
      airwallex_payout: {
        endpoint: '/api/v1/webhooks/airwallex/payout',
        events: ['payout.completed', 'payout.failed'],
        status: 'active'
      },
    },
  });
});

export { router as webhookRouter };
