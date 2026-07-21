/**
 * ============================================================================
 * VETTED B2B LEAD CAPTURE CONTROLLER
 * ============================================================================
 * 
 * Handles enterprise lead submissions from the vettedforce.com landing page
 * 
 * Features:
 * - Lead capture and validation
 * - Automated lead scoring
 * - CRM integration hooks (future: Salesforce, HubSpot)
 * - Email notifications to sales team
 * 
 * ============================================================================
 */

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { logAuditEvent } from '../utils/auditLogger';

/**
 * ============================================================================
 * CREATE ENTERPRISE LEAD
 * ============================================================================
 * 
 * POST /api/v1/leads
 * 
 * Captures enterprise lead from landing page and initiates sales workflow
 */
export const createLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, budget, techStack } = req.body;

    // Check for duplicate leads (same email within 7 days)
    const existingLead = await prisma.enterpriseLead.findFirst({
      where: {
        email,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    if (existingLead) {
      // Update existing lead instead of creating duplicate
      const updatedLead = await prisma.enterpriseLead.update({
        where: { id: existingLead.id },
        data: {
          budget,
          techStack,
          lastContactedAt: new Date(),
          contactAttempts: existingLead.contactAttempts + 1,
        },
      });

      logger.info('Enterprise lead updated', {
        leadId: updatedLead.id,
        email,
        budget,
        techStack,
      });

      res.status(200).json({
        success: true,
        message: 'Thank you for your interest! We have your updated information.',
        leadId: updatedLead.id,
      });
      return;
    }

    // Calculate lead score (0-100)
    const leadScore = calculateLeadScore(budget, techStack, email);

    // Create new lead
    const lead = await prisma.enterpriseLead.create({
      data: {
        email,
        budget,
        techStack,
        leadScore,
        status: 'NEW',
        source: 'LANDING_PAGE',
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      },
    });

    // Log audit event
    await logAuditEvent({
      action: 'LEAD_CAPTURED',
      entityType: 'ENTERPRISE_LEAD',
      entityId: lead.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        email,
        budget,
        techStack,
        leadScore,
      },
    });

    logger.info('Enterprise lead captured', {
      leadId: lead.id,
      email,
      budget,
      techStack,
      leadScore,
    });

    // TODO: Trigger email notification to sales team
    // TODO: Trigger automated outreach sequence (if lead score >= 70)
    // TODO: Sync to CRM (Salesforce/HubSpot)

    res.status(201).json({
      success: true,
      message: 'Thank you! We will be in touch within 24 hours.',
      leadId: lead.id,
    });
  } catch (error) {
    logger.error('Failed to capture enterprise lead', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to submit lead. Please try again or email enterprise@vetted.ai',
    });
  }
};

/**
 * ============================================================================
 * GET ALL LEADS (ADMIN ONLY)
 * ============================================================================
 * 
 * GET /api/v1/leads
 * 
 * Returns all enterprise leads with filtering and pagination
 */
export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      minScore,
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (minScore) {
      where.leadScore = {
        gte: parseInt(minScore as string, 10),
      };
    }

    const [leads, totalCount] = await Promise.all([
      prisma.enterpriseLead.findMany({
        where,
        orderBy: [
          { leadScore: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limitNum,
      }),
      prisma.enterpriseLead.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch enterprise leads', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch leads',
    });
  }
};

/**
 * ============================================================================
 * LEAD SCORING ALGORITHM
 * ============================================================================
 * 
 * Calculates a lead quality score (0-100) based on:
 * - Budget range (higher budget = higher score)
 * - Tech stack match (high-demand stacks = higher score)
 * - Email domain (corporate email = higher score)
 */
function calculateLeadScore(
  budget: string,
  techStack: string,
  email: string
): number {
  let score = 0;

  // Budget scoring (0-50 points)
  const budgetScores: Record<string, number> = {
    '5k-10k': 20,
    '10k-20k': 30,
    '20k-30k': 40,
    '30k-50k': 45,
    '50k+': 50,
  };
  score += budgetScores[budget] || 0;

  // Tech stack scoring (0-30 points)
  const techStackScores: Record<string, number> = {
    'typescript-react': 30,
    'python-django': 25,
    'java-spring': 20,
    'go-kubernetes': 30,
    'mobile-ios-android': 25,
    'fullstack': 28,
    'other': 15,
  };
  score += techStackScores[techStack] || 0;

  // Email domain scoring (0-20 points)
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (emailDomain) {
    // Personal email domains (lower score)
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    if (personalDomains.includes(emailDomain)) {
      score += 5; // Low score for personal emails
    } else {
      score += 20; // Corporate email = high score
    }
  }

  return Math.min(score, 100);
}

/**
 * ============================================================================
 * UPDATE LEAD STATUS (ADMIN ONLY)
 * ============================================================================
 * 
 * PATCH /api/v1/leads/:id
 * 
 * Updates lead status and contact information
 */
export const updateLeadStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const lead = await prisma.enterpriseLead.update({
      where: { id },
      data: {
        status,
        notes,
        lastContactedAt: new Date(),
      },
    });

    logger.info('Enterprise lead status updated', {
      leadId: lead.id,
      status,
    });

    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    logger.error('Failed to update lead status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      leadId: req.params.id,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update lead status',
    });
  }
};
