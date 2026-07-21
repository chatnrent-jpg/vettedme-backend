/**
 * ============================================================================
 * VETTED - Sales Pipeline Management Service
 * ============================================================================
 * 
 * Purpose: Manage enterprise client acquisition pipeline state transitions
 * Flow: COLD_OUTREACH → EMAIL_REPLIED → DEMO_BOOKED → DEMO_COMPLETED → 
 *       CONTRACT_PENDING → ENTERPRISE_ACTIVE
 * 
 * Critical Rules:
 * 1. States can only move FORWARD (no backwards transitions except to LOST)
 * 2. Each state transition records an immutable timestamp
 * 3. Slack/PagerDuty webhooks triggered on key transitions
 * 4. Lead scoring updated based on engagement
 * 
 * ============================================================================
 */

import { PrismaClient, SalesPipelineStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { logAudit } from '../utils/audit-logger';

const prisma = new PrismaClient();

// ============================================================================
// Configuration
// ============================================================================

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';
const PAGERDUTY_INTEGRATION_KEY = process.env.PAGERDUTY_INTEGRATION_KEY || '';

// State machine configuration
const STATE_TRANSITIONS: Record<SalesPipelineStatus, SalesPipelineStatus[]> = {
  COLD_OUTREACH: ['EMAIL_REPLIED', 'LOST'],
  EMAIL_REPLIED: ['DEMO_BOOKED', 'LOST'],
  DEMO_BOOKED: ['DEMO_COMPLETED', 'LOST'],
  DEMO_COMPLETED: ['CONTRACT_PENDING', 'LOST'],
  CONTRACT_PENDING: ['ENTERPRISE_ACTIVE', 'LOST'],
  ENTERPRISE_ACTIVE: [], // Terminal state
  LOST: [], // Terminal state
};

const STATE_TIMESTAMP_FIELD: Record<SalesPipelineStatus, string> = {
  COLD_OUTREACH: 'coldOutreachAt',
  EMAIL_REPLIED: 'emailRepliedAt',
  DEMO_BOOKED: 'demoBookedAt',
  DEMO_COMPLETED: 'demoCompletedAt',
  CONTRACT_PENDING: 'contractPendingAt',
  ENTERPRISE_ACTIVE: 'enterpriseActiveAt',
  LOST: 'updatedAt',
};

// ============================================================================
// Types
// ============================================================================

interface LeadData {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  companyName?: string;
  companySize?: string;
  industry?: string;
  location?: string;
  companyWebsite?: string;
  fundingStage?: string;
  fundingAmount?: string;
  jobTitle?: string;
  budget?: string;
  techStack?: string;
  leadScore?: number;
  leadTier?: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface SlackNotification {
  text: string;
  blocks?: any[];
}

// ============================================================================
// Lead Creation
// ============================================================================

/**
 * Create a new enterprise lead
 */
export async function createEnterpriseLead(leadData: LeadData) {
  // Check for duplicate (same email within 30 days)
  const existingLead = await prisma.enterpriseLead.findFirst({
    where: {
      email: leadData.email,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  if (existingLead) {
    // Update existing lead
    return updateEnterpriseLead(existingLead.id, leadData);
  }

  // Create new lead
  const lead = await prisma.enterpriseLead.create({
    data: {
      ...leadData,
      pipelineStatus: 'COLD_OUTREACH',
      coldOutreachAt: new Date(),
    },
  });

  // Log audit trail
  await logAudit({
    userId: null,
    action: 'LEAD_CREATED',
    resourceType: 'EnterpriseLead',
    resourceId: lead.id,
    metadata: { leadData, source: leadData.source },
  });

  // Send Slack notification
  await notifySlack({
    text: `🎯 New Enterprise Lead: ${leadData.email}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🎯 New Enterprise Lead*\n\n*Email:* ${leadData.email}\n*Company:* ${leadData.companyName || 'Unknown'}\n*Job Title:* ${leadData.jobTitle || 'Unknown'}\n*Lead Score:* ${leadData.leadScore || 0}/100\n*Tier:* ${leadData.leadTier || 'Tier 4'}\n*Source:* ${leadData.source}`,
        },
      },
    ],
  });

  return lead;
}

/**
 * Update an existing enterprise lead
 */
export async function updateEnterpriseLead(leadId: string, updates: Partial<LeadData>) {
  const lead = await prisma.enterpriseLead.update({
    where: { id: leadId },
    data: updates,
  });

  await logAudit({
    userId: null,
    action: 'LEAD_UPDATED',
    resourceType: 'EnterpriseLead',
    resourceId: leadId,
    metadata: { updates },
  });

  return lead;
}

// ============================================================================
// Pipeline State Transitions
// ============================================================================

/**
 * Transition lead to next pipeline state
 */
export async function transitionPipelineState(
  leadId: string,
  targetState: SalesPipelineStatus,
  metadata?: Record<string, any>
) {
  // Fetch current lead
  const lead = await prisma.enterpriseLead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }

  // Validate transition
  const currentState = lead.pipelineStatus;
  const allowedTransitions = STATE_TRANSITIONS[currentState];

  if (!allowedTransitions.includes(targetState)) {
    throw new Error(
      `Invalid pipeline transition: ${currentState} → ${targetState}. ` +
      `Allowed transitions: ${allowedTransitions.join(', ')}`
    );
  }

  console.log(`\n🔄 Pipeline Transition: ${currentState} → ${targetState}`);
  console.log(`   Lead: ${lead.email}`);
  console.log(`   Company: ${lead.companyName || 'Unknown'}`);

  // Build update data
  const updateData: any = {
    pipelineStatus: targetState,
  };

  // Set timestamp for target state
  const timestampField = STATE_TIMESTAMP_FIELD[targetState];
  updateData[timestampField] = new Date();

  // Update lead
  const updatedLead = await prisma.enterpriseLead.update({
    where: { id: leadId },
    data: updateData,
  });

  // Log audit trail
  await logAudit({
    userId: null,
    action: `PIPELINE_${targetState}`,
    resourceType: 'EnterpriseLead',
    resourceId: leadId,
    metadata: {
      previousState: currentState,
      newState: targetState,
      ...metadata,
    },
  });

  // Send notifications for key transitions
  if (targetState === 'EMAIL_REPLIED') {
    await notifySlack({
      text: `📧 Lead Replied: ${lead.email}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📧 Lead Replied to Cold Email*\n\n*Email:* ${lead.email}\n*Company:* ${lead.companyName || 'Unknown'}\n*Lead Score:* ${lead.leadScore}/100\n*Action:* Book a demo call`,
          },
        },
      ],
    });
  } else if (targetState === 'DEMO_BOOKED') {
    await notifyPagerDuty({
      summary: `Demo Booked: ${lead.email} at ${lead.companyName}`,
      severity: 'info',
      source: 'VETTED Sales Pipeline',
      customDetails: {
        leadId,
        email: lead.email,
        company: lead.companyName,
        demoTime: metadata?.demoTime,
      },
    });
  } else if (targetState === 'ENTERPRISE_ACTIVE') {
    await notifySlack({
      text: `🎉 New Enterprise Client: ${lead.companyName}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🎉 NEW ENTERPRISE CLIENT!*\n\n*Company:* ${lead.companyName}\n*Contact:* ${lead.email}\n*Contract Value:* ${metadata?.contractValue || 'TBD'}\n\n🚀 Time to activate their first talent pipeline!`,
          },
        },
      ],
    });
  }

  console.log(`   ✅ Pipeline transition complete\n`);

  return updatedLead;
}

// ============================================================================
// Individual State Helpers
// ============================================================================

/**
 * Mark lead as EMAIL_REPLIED
 */
export async function markEmailReplied(leadId: string, replyText?: string) {
  return transitionPipelineState(leadId, 'EMAIL_REPLIED', { replyText });
}

/**
 * Mark lead as DEMO_BOOKED
 */
export async function markDemoBooked(
  leadId: string,
  demoTime: Date,
  attendees: string[]
) {
  await prisma.enterpriseLead.update({
    where: { id: leadId },
    data: {
      demoScheduledFor: demoTime,
      demoAttendees: attendees,
    },
  });

  return transitionPipelineState(leadId, 'DEMO_BOOKED', {
    demoTime: demoTime.toISOString(),
    attendees,
  });
}

/**
 * Mark lead as DEMO_COMPLETED
 */
export async function markDemoCompleted(leadId: string, demoNotes?: string) {
  await prisma.enterpriseLead.update({
    where: { id: leadId },
    data: { demoNotes },
  });

  return transitionPipelineState(leadId, 'DEMO_COMPLETED', { demoNotes });
}

/**
 * Mark lead as CONTRACT_PENDING
 */
export async function markContractPending(
  leadId: string,
  contractValue?: number
) {
  return transitionPipelineState(leadId, 'CONTRACT_PENDING', { contractValue });
}

/**
 * Mark lead as ENTERPRISE_ACTIVE (converted!)
 */
export async function markEnterpriseActive(
  leadId: string,
  contractValue: number
) {
  return transitionPipelineState(leadId, 'ENTERPRISE_ACTIVE', { contractValue });
}

/**
 * Mark lead as LOST
 */
export async function markLost(leadId: string, reason?: string) {
  return transitionPipelineState(leadId, 'LOST', { reason });
}

// ============================================================================
// Pipeline Analytics
// ============================================================================

/**
 * Get pipeline statistics
 */
export async function getPipelineStats() {
  const stats = await prisma.enterpriseLead.groupBy({
    by: ['pipelineStatus'],
    _count: true,
  });

  const total = await prisma.enterpriseLead.count();
  const converted = await prisma.enterpriseLead.count({
    where: { pipelineStatus: 'ENTERPRISE_ACTIVE' },
  });
  const conversionRate = total > 0 ? (converted / total) * 100 : 0;

  return {
    byState: stats.reduce((acc, stat) => {
      acc[stat.pipelineStatus] = stat._count;
      return acc;
    }, {} as Record<string, number>),
    total: {
      leads: total,
      converted,
      conversionRate: Math.round(conversionRate * 100) / 100,
    },
  };
}

/**
 * Get leads by pipeline state
 */
export async function getLeadsByState(state: SalesPipelineStatus) {
  return prisma.enterpriseLead.findMany({
    where: { pipelineStatus: state },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get leads by tier
 */
export async function getLeadsByTier(tier: string) {
  return prisma.enterpriseLead.findMany({
    where: { leadTier: tier },
    orderBy: [
      { leadScore: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

// ============================================================================
// Webhook Notifications
// ============================================================================

/**
 * Send Slack notification
 */
async function notifySlack(notification: SlackNotification): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    console.log('⏭️  Slack webhook not configured, skipping notification');
    return;
  }

  try {
    await axios.post(SLACK_WEBHOOK_URL, notification);
    console.log('✅ Slack notification sent');
  } catch (error) {
    console.error('❌ Failed to send Slack notification:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Send PagerDuty alert
 */
async function notifyPagerDuty(event: {
  summary: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  source: string;
  customDetails?: Record<string, any>;
}): Promise<void> {
  if (!PAGERDUTY_INTEGRATION_KEY) {
    console.log('⏭️  PagerDuty integration not configured, skipping alert');
    return;
  }

  try {
    await axios.post('https://events.pagerduty.com/v2/enqueue', {
      routing_key: PAGERDUTY_INTEGRATION_KEY,
      event_action: 'trigger',
      payload: {
        summary: event.summary,
        severity: event.severity,
        source: event.source,
        custom_details: event.customDetails,
      },
    });
    console.log('✅ PagerDuty alert sent');
  } catch (error) {
    console.error('❌ Failed to send PagerDuty alert:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// ============================================================================
// Lead Enrichment
// ============================================================================

/**
 * Enrich lead with Clearbit data
 */
export async function enrichLeadWithClearbit(leadId: string): Promise<void> {
  const CLEARBIT_API_KEY = process.env.CLEARBIT_API_KEY;
  if (!CLEARBIT_API_KEY) {
    console.log('⏭️  Clearbit API key not configured');
    return;
  }

  const lead = await prisma.enterpriseLead.findUnique({
    where: { id: leadId },
  });

  if (!lead || !lead.email) {
    return;
  }

  try {
    // Enrich person
    const personResponse = await axios.get(
      `https://person.clearbit.com/v2/combined/find?email=${lead.email}`,
      {
        headers: {
          Authorization: `Bearer ${CLEARBIT_API_KEY}`,
        },
      }
    );

    const person = personResponse.data.person;
    const company = personResponse.data.company;

    // Update lead with enriched data
    await prisma.enterpriseLead.update({
      where: { id: leadId },
      data: {
        firstName: person?.name?.givenName || lead.firstName,
        lastName: person?.name?.familyName || lead.lastName,
        jobTitle: person?.employment?.title || lead.jobTitle,
        linkedinUrl: person?.linkedin?.handle ? `https://linkedin.com/in/${person.linkedin.handle}` : lead.linkedinUrl,
        companyName: company?.name || lead.companyName,
        companyWebsite: company?.domain ? `https://${company.domain}` : lead.companyWebsite,
        industry: company?.category?.industry || lead.industry,
        location: company?.location || lead.location,
        companySize: company?.metrics?.employees ? `${company.metrics.employees}` : lead.companySize,
        fundingStage: company?.category?.sector || lead.fundingStage,
      },
    });

    console.log(`✅ Lead ${leadId} enriched with Clearbit data`);
  } catch (error) {
    console.error(`❌ Failed to enrich lead ${leadId}:`, error instanceof Error ? error.message : 'Unknown error');
  }
}

export default {
  createEnterpriseLead,
  updateEnterpriseLead,
  transitionPipelineState,
  markEmailReplied,
  markDemoBooked,
  markDemoCompleted,
  markContractPending,
  markEnterpriseActive,
  markLost,
  getPipelineStats,
  getLeadsByState,
  getLeadsByTier,
  enrichLeadWithClearbit,
};
