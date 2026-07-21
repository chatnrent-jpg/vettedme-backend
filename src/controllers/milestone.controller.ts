import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { SmileIDService } from '../services/vettedme/SmileIDService';
import { AirwallexService } from '../services/vettedpay/AirwallexService';
import { FraudDetectionService } from '../services/security/FraudDetectionService';
import { W8BENService } from '../services/compliance/W8BENService';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();
const smileIdService = new SmileIDService();
const airwallexService = new AirwallexService();
const fraudDetection = new FraudDetectionService();
const w8benService = new W8BENService();

/**
 * POST /api/v1/milestones/:id/release
 * 
 * Critical Payment Release Endpoint:
 * 1. Validates milestone is ready for payment
 * 2. Performs live biometric verification via Smile ID
 * 3. Executes Airwallex payout if verification passes
 * 4. Updates milestone, contract, and wallet balances atomically
 * 5. Creates payment transaction and invoice records
 */
export const releaseMilestone = async (req: Request, res: Response) => {
  const { id: milestoneId } = req.params;
  const { biometricImageBase64 } = req.body;
  const businessUserId = req.user?.id; // From auth middleware

  // Start transaction timer for monitoring
  const startTime = Date.now();

  try {
    // ========================================================================
    // STEP 1: VALIDATE MILESTONE & FETCH RELATIONSHIPS
    // ========================================================================
    logger.info(`[Milestone Release] Starting release for milestone ${milestoneId}`);

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            airwallexSubAccount: true,
            talent: {
              include: {
                vettedMEPassport: true,
              },
            },
            business: true,
          },
        },
      },
    });

    // Validation: Milestone exists
    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    // Validation: User is authorized (business owner)
    if (milestone.contract.businessId !== businessUserId) {
      throw new AppError('Unauthorized: You are not the owner of this contract', 403);
    }

    // Validation: Milestone status
    if (milestone.status !== 'WORK_SUBMITTED') {
      throw new AppError(
        `Milestone is not ready for release. Current status: ${milestone.status}`,
        400
      );
    }

    // Validation: VettedME Passport exists
    const passport = milestone.contract.talent.vettedMEPassport;
    if (!passport) {
      throw new AppError(
        'Contractor does not have a valid VettedME passport',
        400
      );
    }

    // Validation: Passport is verified
    if (passport.verificationStatus !== 'BIOMETRIC_PASSED') {
      throw new AppError(
        `Contractor passport status: ${passport.verificationStatus}. Must be BIOMETRIC_PASSED.`,
        400
      );
    }

    // Validation: W-8BEN Tax Compliance (CRITICAL FOR US ENTERPRISES)
    const hasW8BEN = await w8benService.hasSignedW8BEN(passport.userId);
    if (!hasW8BEN) {
      logger.warn('[Milestone Release] W-8BEN not signed', {
        userId: passport.userId,
        milestoneId: milestone.id,
      });
      
      throw new AppError(
        'Tax compliance required: Contractor must complete and sign IRS Form W-8BEN before receiving payments. This is a legal requirement for US tax withholding and reporting.',
        400
      );
    }

    // Verify W-8BEN signature is valid
    const w8benVerification = await w8benService.verifyW8BENSignature(passport.userId);
    if (!w8benVerification.valid) {
      throw new AppError(
        'W-8BEN signature verification failed. Please regenerate the tax document.',
        400
      );
    }

    logger.info('[Milestone Release] W-8BEN compliance verified', {
      userId: passport.userId,
      signedAt: w8benVerification.signedAt,
      signedBy: w8benVerification.signedBy,
    });

    // Validation: Airwallex sub-account exists
    const subAccount = milestone.contract.airwallexSubAccount;
    if (!subAccount) {
      throw new AppError('Airwallex sub-account not found for this contract', 400);
    }

    // Validation: Sufficient balance
    const milestoneAmount = milestone.amountUSD.toNumber();
    if (subAccount.availableBalanceUSD.toNumber() < milestoneAmount) {
      throw new AppError(
        `Insufficient escrow balance. Available: $${subAccount.availableBalanceUSD}, Required: $${milestoneAmount}`,
        400
      );
    }

    logger.info(`[Milestone Release] Validations passed for milestone ${milestoneId}`);

    // ========================================================================
    // STEP 2: INITIATE BIOMETRIC HANDSHAKE RECORD
    // ========================================================================
    const handshake = await prisma.milestoneHandshake.create({
      data: {
        milestoneId: milestone.id,
        passportId: passport.id,
        status: 'IN_PROGRESS',
        notificationSentAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: req.ip,
        deviceFingerprint: req.headers['user-agent'],
      },
    });

    logger.info(`[Milestone Release] Handshake created: ${handshake.id}`);

    // ========================================================================
    // STEP 3: BIOMETRIC VERIFICATION VIA SMILE ID
    // ========================================================================
    logger.info(`[Milestone Release] Starting Smile ID verification for user ${passport.userId}`);

    let biometricVerification;
    try {
      // Call Smile ID service to verify biometric
      const smileIdResult = await smileIdService.verifyBiometric({
        userId: passport.userId,
        passportId: passport.id,
        baselineImageHash: passport.biometricHash!,
        liveImageBase64: biometricImageBase64,
        smileIdUserId: passport.smileIdUserId!,
        verificationType: 'MILESTONE_HANDSHAKE',
        metadata: {
          milestoneId: milestone.id,
          contractId: milestone.contractId,
          handshakeId: handshake.id,
        },
      });

      biometricVerification = smileIdResult;

      // Check if verification passed
      if (!smileIdResult.success || smileIdResult.confidence < 0.95 || !smileIdResult.livenessDetected) {
        // Log failed verification
        await prisma.milestoneHandshake.update({
          where: { id: handshake.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            biometricSessionId: smileIdResult.sessionId,
            faceMatchScore: smileIdResult.confidence,
            livenessCheckPassed: smileIdResult.livenessDetected,
            verificationAttempts: { increment: 1 },
          },
        });

        // Get attempt count for this milestone
        const attemptCount = await prisma.milestoneHandshake.count({
          where: {
            milestoneId: milestone.id,
            status: 'FAILED',
          },
        });

        // FRAUD STATE 1: Trigger anti-spoofing protocol if multiple failures
        if (attemptCount >= 3 || smileIdResult.confidence < 0.70) {
          logger.error('[Milestone Release] FRAUD ALERT: Multiple biometric failures or very low confidence', {
            userId: passport.userId,
            passportId: passport.id,
            attemptCount,
            confidence: smileIdResult.confidence,
          });

          // Execute fraud detection protocol
          await fraudDetection.handleBiometricFailure({
            userId: passport.userId,
            passportId: passport.id,
            milestoneId: milestone.id,
            contractId: milestone.contractId,
            failureReason: `Low confidence score: ${(smileIdResult.confidence * 100).toFixed(1)}%, Liveness: ${smileIdResult.livenessDetected}`,
            faceMatchScore: smileIdResult.confidence,
            livenessDetected: smileIdResult.livenessDetected,
            attemptCount,
            ipAddress: req.ip,
            deviceFingerprint: req.headers['user-agent'],
          });

          throw new AppError(
            'SECURITY ALERT: Your VettedME passport has been revoked due to failed biometric verification. Please contact support.',
            401
          );
        }

        throw new AppError(
          `Biometric verification failed. Confidence: ${(smileIdResult.confidence * 100).toFixed(1)}%, Liveness: ${smileIdResult.livenessDetected}. Attempts remaining: ${3 - attemptCount}`,
          401
        );
      }

      logger.info(
        `[Milestone Release] Biometric verification PASSED. Confidence: ${(smileIdResult.confidence * 100).toFixed(1)}%`
      );

      // Update handshake with success
      await prisma.milestoneHandshake.update({
        where: { id: handshake.id },
        data: {
          status: 'VERIFIED',
          completedAt: new Date(),
          biometricSessionId: smileIdResult.sessionId,
          faceMatchScore: smileIdResult.confidence,
          livenessCheckPassed: smileIdResult.livenessDetected,
          verificationAttempts: { increment: 1 },
        },
      });
    } catch (error) {
      logger.error(`[Milestone Release] Biometric verification error:`, error);
      throw new AppError(
        'Biometric verification failed. Please ensure proper lighting and face positioning.',
        401
      );
    }

    // ========================================================================
    // STEP 4: CALCULATE PAYMENT BREAKDOWN
    // ========================================================================
    const platformFeeRate = 0.15; // 15%
    const fxSpreadRate = 0.005; // 0.5%

    const platformFee = milestoneAmount * platformFeeRate;
    const fxSpread = milestoneAmount * fxSpreadRate;
    const netContractorPayout = milestoneAmount - platformFee - fxSpread;

    logger.info(`[Milestone Release] Payment breakdown:`, {
      milestoneAmount,
      platformFee,
      fxSpread,
      netContractorPayout,
    });

    // ========================================================================
    // STEP 5: EXECUTE AIRWALLEX PAYOUT
    // ========================================================================
    logger.info(`[Milestone Release] Initiating Airwallex payout`);

    let airwallexTransferId: string;
    let airwallexReference: string;
    try {
      const payoutResult = await airwallexService.initiatePayout({
        sourceAccountId: subAccount.airwallexVirtualAccountId,
        amount: netContractorPayout,
        currency: 'USD',
        targetCurrency: 'NGN',
        beneficiaryDetails: {
          accountNumber: (passport.kycData as any)?.bankAccountNumber || '',
          routingNumber: (passport.kycData as any)?.bankRoutingCode || '',
          accountHolderName: `${milestone.contract.talent.firstName} ${milestone.contract.talent.lastName}`,
          bankCountry: 'NG',
        },
        platformFee: {
          amount: platformFee,
          walletId: process.env.VETTED_TREASURY_WALLET_ID!,
        },
        reference: `CTR-${milestone.contract.contractNumber}-M${milestone.milestoneNumber}`,
        metadata: {
          contractId: milestone.contractId,
          milestoneId: milestone.id,
          passportId: passport.id,
          biometricSessionId: biometricVerification.sessionId,
        },
      });

      if (!payoutResult.success) {
        throw new AppError(
          `Airwallex payout rejected: ${payoutResult.errorMessage}`,
          502
        );
      }

      airwallexTransferId = payoutResult.transferId;
      airwallexReference = payoutResult.reference;

      logger.info(
        `[Milestone Release] Airwallex payout initiated successfully. Transfer ID: ${airwallexTransferId}`
      );
    } catch (error) {
      logger.error(`[Milestone Release] Airwallex payout error:`, error);
      throw new AppError(
        'Payment processing failed. Funds remain in escrow. Please contact support.',
        502
      );
    }

    // ========================================================================
    // STEP 6: ATOMIC DATABASE UPDATES
    // ========================================================================
    logger.info(`[Milestone Release] Starting atomic database transaction`);

    const updatedMilestone = await prisma.$transaction(async (tx) => {
      // Update milestone status
      const milestone = await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          handshakeCompletedAt: new Date(),
        },
      });

      // Check if all milestones are paid
      const allMilestones = await tx.milestone.findMany({
        where: { contractId: milestone.contractId },
        select: { status: true },
      });

      const allPaid = allMilestones.every((m) => m.status === 'PAID');

      // Update contract status
      await tx.contract.update({
        where: { id: milestone.contractId },
        data: {
          status: allPaid ? 'COMPLETED' : 'IN_PROGRESS',
          ...(allPaid && { actualEndDate: new Date() }),
        },
      });

      // Update Airwallex sub-account balance
      await tx.airwallexSubAccount.update({
        where: { id: subAccount.id },
        data: {
          currentBalanceUSD: {
            decrement: new Prisma.Decimal(milestoneAmount),
          },
          availableBalanceUSD: {
            decrement: new Prisma.Decimal(milestoneAmount),
          },
        },
      });

      // Create payment transaction record
      const transaction = await tx.paymentTransaction.create({
        data: {
          transactionNumber: `TXN-${Date.now()}-${milestone.id.slice(0, 8)}`,
          contractId: milestone.contractId,
          milestoneId: milestone.id,
          airwallexSubAccountId: subAccount.id,
          transactionType: 'MILESTONE_PAYOUT',
          grossAmount: new Prisma.Decimal(milestoneAmount),
          platformFee: new Prisma.Decimal(platformFee),
          platformFeeRate: platformFeeRate,
          fxSpread: new Prisma.Decimal(fxSpread),
          fxSpreadRate: fxSpreadRate,
          netAmount: new Prisma.Decimal(netContractorPayout),
          sourceCurrency: 'USD',
          targetCurrency: 'NGN',
          exchangeRate: 1650.5, // Should come from Airwallex response
          airwallexTransferId: airwallexTransferId,
          airwallexReference: airwallexReference,
          status: 'COMPLETED',
          paymentMethod: 'ACH',
          processedAt: new Date(),
          completedAt: new Date(),
        },
      });

      // Create invoice record
      await tx.invoice.create({
        data: {
          invoiceNumber: `INV-${Date.now()}-${milestone.id.slice(0, 8)}`,
          contractId: milestone.contractId,
          milestoneId: milestone.id,
          paymentTransactionId: transaction.id,
          businessName: milestone.contract.business.firstName + ' ' + milestone.contract.business.lastName,
          businessEmail: milestone.contract.business.email,
          contractorName: milestone.contract.talent.firstName + ' ' + milestone.contract.talent.lastName,
          contractorPassportId: passport.passportId,
          contractorLocation: milestone.contract.talent.location || 'N/A',
          milestoneAmount: new Prisma.Decimal(milestoneAmount),
          platformFee: new Prisma.Decimal(platformFee),
          platformFeeRate: platformFeeRate,
          fxSpread: new Prisma.Decimal(fxSpread),
          fxSpreadRate: fxSpreadRate,
          contractorPayout: new Prisma.Decimal(netContractorPayout),
          sourceCurrency: 'USD',
          targetCurrency: 'NGN',
          exchangeRate: 1650.5,
          contractorReceivesLocal: new Prisma.Decimal(netContractorPayout * 1650.5),
          airwallexFee: new Prisma.Decimal(12.5),
          status: 'PAID',
          paymentDate: new Date(),
        },
      });

      // Update VettedME passport stats
      await tx.vettedMEPassport.update({
        where: { id: passport.id },
        data: {
          contractsCompleted: { increment: allPaid ? 1 : 0 },
          totalEarnedUSD: {
            increment: new Prisma.Decimal(netContractorPayout),
          },
          lastBiometricScanAt: new Date(),
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: businessUserId,
          userEmail: req.user?.email,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          action: 'milestone.released',
          resource: 'Milestone',
          resourceId: milestone.id,
          changes: {
            before: { status: 'WORK_SUBMITTED' },
            after: { status: 'PAID', paidAt: new Date() },
          },
          metadata: {
            milestoneId: milestone.id,
            contractId: milestone.contractId,
            transactionId: transaction.id,
            biometricSessionId: biometricVerification.sessionId,
            airwallexTransferId: airwallexTransferId,
          },
          contractId: milestone.contractId,
        },
      });

      return milestone;
    });

    const elapsedTime = Date.now() - startTime;
    logger.info(
      `[Milestone Release] Transaction completed successfully in ${elapsedTime}ms`
    );

    // ========================================================================
    // STEP 7: RETURN SUCCESS RESPONSE
    // ========================================================================
    return res.status(200).json({
      success: true,
      message: 'Biometric verification passed. Milestone payment released successfully.',
      data: {
        milestoneId: updatedMilestone.id,
        status: updatedMilestone.status,
        amountReleased: netContractorPayout,
        currency: 'USD',
        convertedAmount: netContractorPayout * 1650.5,
        convertedCurrency: 'NGN',
        transactionId: airwallexTransferId,
        reference: airwallexReference,
        biometricVerification: {
          sessionId: biometricVerification.sessionId,
          confidence: biometricVerification.confidence,
          livenessDetected: biometricVerification.livenessDetected,
        },
        breakdown: {
          grossAmount: milestoneAmount,
          platformFee: platformFee,
          fxSpread: fxSpread,
          netPayout: netContractorPayout,
        },
        processingTime: elapsedTime,
      },
    });
  } catch (error) {
    logger.error(`[Milestone Release] Error:`, error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error during milestone release',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

/**
 * GET /api/v1/milestones/:id/status
 * 
 * Check milestone release status
 */
export const getMilestoneStatus = async (req: Request, res: Response) => {
  const { id: milestoneId } = req.params;

  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        handshakes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    const latestHandshake = milestone.handshakes[0];
    const latestTransaction = milestone.transactions[0];

    return res.status(200).json({
      success: true,
      data: {
        milestoneId: milestone.id,
        status: milestone.status,
        amountUSD: milestone.amountUSD,
        submittedAt: milestone.submittedAt,
        approvedAt: milestone.approvedAt,
        paidAt: milestone.paidAt,
        handshake: latestHandshake
          ? {
              status: latestHandshake.status,
              faceMatchScore: latestHandshake.faceMatchScore,
              livenessCheckPassed: latestHandshake.livenessCheckPassed,
              completedAt: latestHandshake.completedAt,
            }
          : null,
        transaction: latestTransaction
          ? {
              transactionNumber: latestTransaction.transactionNumber,
              status: latestTransaction.status,
              netAmount: latestTransaction.netAmount,
              completedAt: latestTransaction.completedAt,
            }
          : null,
      },
    });
  } catch (error) {
    logger.error(`[Get Milestone Status] Error:`, error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch milestone status',
    });
  }
};
