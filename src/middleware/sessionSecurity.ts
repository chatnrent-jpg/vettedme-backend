import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { FraudDetectionService } from '../services/security/FraudDetectionService';
import { logger } from '../utils/logger';

const fraudDetection = new FraudDetectionService();

/**
 * Session Security Middleware
 * 
 * Enforces 15-minute session expiry and detects account hijacking attempts
 */
export const enforceSessionSecurity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new AppError('No authentication token provided', 401);
    }

    // Decode token to check age
    const decoded = jwt.decode(token) as { iat: number; exp: number; userId: string };
    
    if (!decoded || !decoded.iat || !decoded.exp) {
      throw new AppError('Invalid token format', 401);
    }

    // Check if token is older than 15 minutes
    const tokenAge = Date.now() - decoded.iat * 1000;
    const MAX_SESSION_AGE = 15 * 60 * 1000; // 15 minutes

    if (tokenAge > MAX_SESSION_AGE) {
      logger.warn('[Session Security] Session expired', {
        userId: decoded.userId,
        tokenAge: tokenAge / 1000 / 60,
      });
      throw new AppError('Session expired. Please log in again.', 401);
    }

    // Check for account hijacking indicators
    const ipAddress = req.ip || 'unknown';
    const deviceFingerprint = req.headers['user-agent'] || 'unknown';

    const isHijacked = await fraudDetection.detectAccountHijacking(
      decoded.userId,
      token,
      ipAddress,
      deviceFingerprint
    );

    if (isHijacked) {
      logger.error('[Session Security] Potential account hijacking detected', {
        userId: decoded.userId,
        ipAddress,
      });
      throw new AppError(
        'Security alert: Your session appears compromised. Please log in again.',
        401
      );
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Session validation failed',
    });
  }
};

/**
 * Sensitive Action Protection Middleware
 * 
 * Requires biometric re-verification for critical actions:
 * - Changing payout bank details
 * - Releasing milestone payments
 * - Initiating disputes
 * - Withdrawing funds
 */
export const requireBiometricReVerification = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if biometric re-verification token exists in headers
  const biometricToken = req.headers['x-biometric-verification'];

  if (!biometricToken) {
    return res.status(403).json({
      success: false,
      error: 'Biometric re-verification required for this action',
      requiresBiometric: true,
      message: 'Please complete facial scan to proceed',
    });
  }

  try {
    // Verify biometric token (issued after successful facial scan)
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(biometricToken as string, JWT_SECRET) as {
      userId: string;
      biometricSessionId: string;
      exp: number;
    };

    // Check token is fresh (< 2 minutes old)
    const tokenAge = Date.now() - (decoded.exp - 120) * 1000;
    if (tokenAge > 2 * 60 * 1000) {
      throw new Error('Biometric verification expired');
    }

    // Attach biometric session to request
    req.biometricSession = {
      userId: decoded.userId,
      sessionId: decoded.biometricSessionId,
    };

    logger.info('[Session Security] Biometric re-verification passed', {
      userId: decoded.userId,
    });

    next();
  } catch (error) {
    logger.warn('[Session Security] Biometric re-verification failed', { error });
    return res.status(403).json({
      success: false,
      error: 'Biometric re-verification failed. Please try again.',
      requiresBiometric: true,
    });
  }
};

/**
 * Rate Limiting for Sensitive Actions
 * 
 * Limits API calls to prevent brute force attacks
 */
export const rateLimitSensitiveActions = (
  maxRequests: number,
  windowMs: number
) => {
  const requestCounts = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return next();
    }

    const now = Date.now();
    const userKey = `${userId}:${req.path}`;
    const userRequests = requestCounts.get(userKey);

    if (!userRequests || now > userRequests.resetAt) {
      requestCounts.set(userKey, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (userRequests.count >= maxRequests) {
      logger.warn('[Session Security] Rate limit exceeded', {
        userId,
        path: req.path,
        count: userRequests.count,
      });
      
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((userRequests.resetAt - now) / 1000),
      });
    }

    userRequests.count++;
    requestCounts.set(userKey, userRequests);
    next();
  };
};

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      biometricSession?: {
        userId: string;
        sessionId: string;
      };
    }
  }
}
