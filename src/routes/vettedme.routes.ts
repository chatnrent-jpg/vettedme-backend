import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { smileIDService } from '../services/vettedme/SmileIDService';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/v1/vettedme/verification/initiate
 * Start biometric verification process
 */
router.post(
  '/verification/initiate',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, idType, idNumber, firstName, lastName, dateOfBirth } = req.body;

    if (!userId || !idType || !idNumber || !firstName || !lastName) {
      throw new AppError('Missing required fields', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const result = await smileIDService.initiateVerification({
      userId,
      idType,
      idNumber,
      firstName,
      lastName,
      dateOfBirth,
    });

    res.status(200).json({
      success: true,
      sessionId: result.sessionId,
      verificationUrl: result.verificationUrl,
      message: 'Biometric verification initiated. Please complete the verification at the provided URL.',
    });
  })
);

/**
 * GET /api/v1/vettedme/verification/:sessionId
 * Check verification status
 */
router.get(
  '/verification/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const result = await smileIDService.checkVerificationStatus(sessionId);

    res.status(200).json(result);
  })
);

/**
 * GET /api/v1/vettedme/passport/:userId
 * Get VettedME Passport details
 */
router.get(
  '/passport/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const passport = await prisma.vettedMEPassport.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            countryCode: true,
            createdAt: true,
          },
        },
      },
    });

    if (!passport) {
      throw new AppError('VettedME Passport not found', 404);
    }

    res.status(200).json({
      passport: {
        ...passport,
        passportUrl: passport.passportUrl || `https://vettedme.com/talent/${userId}`,
      },
    });
  })
);

/**
 * POST /api/v1/vettedme/nin/verify
 * Verify Nigerian National Identity Number (NIN)
 */
router.post(
  '/nin/verify',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, nin } = req.body;

    if (!userId || !nin) {
      throw new AppError('Missing userId or NIN', 400);
    }

    const verified = await smileIDService.verifyNIN(nin, userId);

    if (verified) {
      await prisma.vettedMEPassport.upsert({
        where: { userId },
        update: {
          ninVerified: true,
          registryLastChecked: new Date(),
        },
        create: {
          userId,
          ninVerified: true,
          registryLastChecked: new Date(),
        },
      });
    }

    res.status(200).json({
      success: verified,
      message: verified ? 'NIN verified successfully' : 'NIN verification failed',
    });
  })
);

/**
 * POST /api/v1/vettedme/bvn/verify
 * Verify Nigerian Bank Verification Number (BVN)
 */
router.post(
  '/bvn/verify',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, bvn } = req.body;

    if (!userId || !bvn) {
      throw new AppError('Missing userId or BVN', 400);
    }

    const verified = await smileIDService.verifyBVN(bvn, userId);

    if (verified) {
      await prisma.vettedMEPassport.upsert({
        where: { userId },
        update: {
          bvnVerified: true,
          registryLastChecked: new Date(),
        },
        create: {
          userId,
          bvnVerified: true,
          registryLastChecked: new Date(),
        },
      });
    }

    res.status(200).json({
      success: verified,
      message: verified ? 'BVN verified successfully' : 'BVN verification failed',
    });
  })
);

export { router as vettedMERouter };
