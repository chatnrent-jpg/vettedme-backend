import { Request, Response } from 'express';
import { W8BENService } from '../services/compliance/W8BENService';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
const w8benService = new W8BENService();

/**
 * POST /api/v1/compliance/w8ben/generate
 * 
 * Generate and sign W-8BEN tax form for talent
 */
export const generateW8BEN = async (req: Request, res: Response) => {
  const { talentId, digitalSignatureName } = req.body;
  const userId = req.user?.id;
  const ipAddress = req.ip;

  try {
    logger.info('[Compliance] Generating W-8BEN', {
      talentId,
      requestedBy: userId,
    });

    // Validate authorization
    // Only the talent themselves can generate their own W-8BEN
    if (userId !== talentId) {
      throw new AppError(
        'Unauthorized: You can only generate your own tax documents',
        403
      );
    }

    // Validate talent exists and has verified passport
    const talent = await prisma.user.findUnique({
      where: { id: talentId },
      include: { vettedMEPassport: true },
    });

    if (!talent) {
      throw new AppError('Talent not found', 404);
    }

    if (!talent.vettedMEPassport) {
      throw new AppError('VettedME passport not found', 404);
    }

    if (talent.vettedMEPassport.verificationStatus !== 'VERIFIED') {
      throw new AppError(
        'Your VettedME passport must be fully verified before generating tax documents',
        400
      );
    }

    // Check if W-8BEN already exists
    const hasExisting = await w8benService.hasSignedW8BEN(talentId);
    if (hasExisting) {
      logger.warn('[Compliance] W-8BEN already exists', { talentId });
      
      return res.status(200).json({
        success: true,
        message: 'W-8BEN already exists. Use the download endpoint to retrieve it.',
        documentUrl: `/api/v1/compliance/w8ben/${talentId}/download`,
        alreadyExists: true,
      });
    }

    // Generate W-8BEN
    const result = await w8benService.generateW8BEN(
      talentId,
      digitalSignatureName,
      ipAddress
    );

    if (!result.success) {
      throw new AppError(
        result.error || 'Failed to generate W-8BEN',
        500
      );
    }

    logger.info('[Compliance] W-8BEN generated successfully', {
      talentId,
      documentUrl: result.documentUrl,
    });

    return res.status(200).json({
      success: true,
      message: 'IRS Form W-8BEN compiled, signed, and vaulted successfully',
      data: {
        documentUrl: result.documentUrl,
        signatureTimestamp: result.signatureTimestamp,
        signatureName: digitalSignatureName,
        complianceStatus: 'COMPLIANT',
      },
    });
  } catch (error) {
    logger.error('[Compliance] Error generating W-8BEN', { error, talentId });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to generate W-8BEN tax document',
    });
  }
};

/**
 * GET /api/v1/compliance/w8ben/:talentId/download
 * 
 * Download W-8BEN PDF for a talent
 */
export const downloadW8BEN = async (req: Request, res: Response) => {
  const { talentId } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
    logger.info('[Compliance] Downloading W-8BEN', {
      talentId,
      requestedBy: userId,
    });

    // Authorization check:
    // - Talent can download their own
    // - Business clients can download for contracts they own
    // - Admins can download any
    if (userRole === 'ADMIN') {
      // Admin can access any document
    } else if (userRole === 'TALENT' && userId === talentId) {
      // Talent can access their own document
    } else if (userRole === 'BUSINESS') {
      // Business can access documents for their contractors
      const contract = await prisma.contract.findFirst({
        where: {
          businessId: userId,
          talentId: talentId,
        },
      });

      if (!contract) {
        throw new AppError(
          'Unauthorized: You do not have a contract with this talent',
          403
        );
      }
    } else {
      throw new AppError('Unauthorized: Cannot access this document', 403);
    }

    // Check if W-8BEN exists
    const hasSigned = await w8benService.hasSignedW8BEN(talentId);
    if (!hasSigned) {
      throw new AppError('W-8BEN has not been generated for this talent', 404);
    }

    // Get document
    const pdfBuffer = await w8benService.getW8BENDocument(talentId);
    if (!pdfBuffer) {
      throw new AppError('W-8BEN document not found', 404);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: userId!,
        action: 'compliance.w8ben_downloaded',
        resource: 'TaxDocument',
        resourceId: `W8BEN_${talentId}`,
        metadata: {
          talentId,
          downloadedBy: userId,
          downloadedByRole: userRole,
        },
        ipAddress: req.ip,
      },
    });

    // Return PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=W8BEN_${talentId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('[Compliance] Error downloading W-8BEN', { error, talentId });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to download W-8BEN document',
    });
  }
};

/**
 * GET /api/v1/compliance/w8ben/:talentId/status
 * 
 * Check W-8BEN compliance status for a talent
 */
export const getW8BENStatus = async (req: Request, res: Response) => {
  const { talentId } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
    // Basic authorization check
    if (userRole !== 'ADMIN' && userId !== talentId && userRole !== 'BUSINESS') {
      throw new AppError('Unauthorized', 403);
    }

    const hasSigned = await w8benService.hasSignedW8BEN(talentId);
    const verification = await w8benService.verifyW8BENSignature(talentId);

    return res.status(200).json({
      success: true,
      data: {
        talentId,
        w8benSigned: hasSigned,
        complianceStatus: hasSigned ? 'COMPLIANT' : 'PENDING',
        signatureDetails: verification.valid
          ? {
              signedAt: verification.signedAt,
              signedBy: verification.signedBy,
            }
          : null,
        documentUrl: hasSigned
          ? `/api/v1/compliance/w8ben/${talentId}/download`
          : null,
      },
    });
  } catch (error) {
    logger.error('[Compliance] Error getting W-8BEN status', { error, talentId });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to get W-8BEN status',
    });
  }
};

/**
 * POST /api/v1/compliance/contracts/:contractId/verify
 * 
 * Verify tax compliance for a contract before allowing payment release
 */
export const verifyContractCompliance = async (req: Request, res: Response) => {
  const { contractId } = req.params;
  const userId = req.user?.id;

  try {
    logger.info('[Compliance] Verifying contract compliance', {
      contractId,
      userId,
    });

    // Get contract
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        talent: {
          include: { vettedMEPassport: true },
        },
        business: true,
      },
    });

    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Authorization check
    if (
      userId !== contract.businessId &&
      userId !== contract.talentId &&
      req.user?.role !== 'ADMIN'
    ) {
      throw new AppError('Unauthorized', 403);
    }

    // Check W-8BEN status
    const w8benSigned = await w8benService.hasSignedW8BEN(contract.talentId);
    
    // Check VettedME passport
    const passportVerified =
      contract.talent.vettedMEPassport?.verificationStatus === 'VERIFIED';

    // Check biometric verification
    const biometricVerified =
      contract.talent.vettedMEPassport?.biometricHash !== null;

    // Determine compliance status
    const isCompliant = w8benSigned && passportVerified && biometricVerified;

    const complianceIssues: string[] = [];
    if (!w8benSigned) {
      complianceIssues.push('W-8BEN form not signed');
    }
    if (!passportVerified) {
      complianceIssues.push('VettedME passport not verified');
    }
    if (!biometricVerified) {
      complianceIssues.push('Biometric verification incomplete');
    }

    return res.status(200).json({
      success: true,
      data: {
        contractId,
        isCompliant,
        complianceStatus: isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT',
        checks: {
          w8benSigned,
          passportVerified,
          biometricVerified,
        },
        issues: complianceIssues,
        actions: isCompliant
          ? []
          : [
              !w8benSigned && 'Talent must complete W-8BEN form',
              !passportVerified && 'Talent must complete VettedME verification',
              !biometricVerified && 'Talent must complete biometric scan',
            ].filter(Boolean),
      },
    });
  } catch (error) {
    logger.error('[Compliance] Error verifying contract compliance', {
      error,
      contractId,
    });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to verify contract compliance',
    });
  }
};
