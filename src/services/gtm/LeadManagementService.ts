import { logger } from '../../utils/logger';
import { prisma } from '../../lib/prisma';
interface CreateLeadRequest {
  firstName: string;
  lastName: string;
  email: string;
  linkedInUrl?: string;
  companyName: string;
  title: string;
  leadSource: string;
  companySize?: string;
  companyWebsite?: string;
}

interface QualifyLeadRequest {
  leadId: string;
  hiringIntentDetected: boolean;
  budgetQualified: boolean;
  technicalFitScore: number;
}

/**
 * LeadManagementService - B2B Client Acquisition Engine
 * 
 * Manages the entire lead lifecycle:
 * 1. Lead capture and enrichment
 * 2. Lead scoring and qualification
 * 3. Outreach sequence initiation
 * 4. Pipeline progression
 * 5. Deal creation and tracking
 */
export class LeadManagementService {
  /**
   * Create new lead from LinkedIn/email outreach
   */
  async createLead(request: CreateLeadRequest): Promise<any> {
    logger.info('Creating new lead', {
      email: request.email,
      company: request.companyName,
    });

    try {
      // Check if lead already exists
      const existing = await prisma.lead.findUnique({
        where: { email: request.email },
      });

      if (existing) {
        logger.warn('Lead already exists', { email: request.email });
        return existing;
      }

      // Calculate initial lead score
      const leadScore = this.calculateLeadScore({
        title: request.title,
        companySize: request.companySize,
        leadSource: request.leadSource,
      });

      const lead = await prisma.lead.create({
        data: {
          firstName: request.firstName,
          lastName: request.lastName,
          email: request.email,
          linkedInUrl: request.linkedInUrl,
          companyName: request.companyName,
          companyWebsite: request.companyWebsite,
          title: request.title,
          leadSource: request.leadSource as any,
          companySize: request.companySize as any,
          status: 'NEW',
          leadScore,
        },
      });

      logger.info('Lead created', {
        leadId: lead.id,
        leadScore,
      });

      // Auto-initiate outreach sequence for qualified leads
      if (leadScore >= 60) {
        await this.initiateOutreachSequence(lead.id);
      }

      return lead;
    } catch (error: any) {
      logger.error('Lead creation failed', {
        error: error.message,
        email: request.email,
      });
      throw new Error(`Lead creation failed: ${error.message}`);
    }
  }

  /**
   * Calculate lead score (0-100)
   */
  private calculateLeadScore(data: any): number {
    let score = 0;

    // Title (30 points)
    const titleKeywords = ['cto', 'vp', 'head', 'director', 'founder', 'ceo'];
    const title = data.title?.toLowerCase() || '';
    if (titleKeywords.some(kw => title.includes(kw))) {
      score += 30;
    } else if (title.includes('engineer') || title.includes('developer')) {
      score += 15;
    }

    // Company Size (30 points) - Sweet spot is Series A (10-50 employees)
    if (data.companySize === 'SERIES_A') {
      score += 30;
    } else if (data.companySize === 'SEED') {
      score += 20;
    } else if (data.companySize === 'SERIES_B') {
      score += 15;
    }

    // Lead Source (20 points)
    if (data.leadSource === 'REFERRAL') {
      score += 20;
    } else if (data.leadSource === 'LINKEDIN_SEARCH') {
      score += 15;
    } else if (data.leadSource === 'INBOUND_LANDING') {
      score += 18;
    }

    // Intent Signals (20 points)
    if (data.hiringIntentDetected) score += 10;
    if (data.budgetQualified) score += 10;

    return Math.min(100, score);
  }

  /**
   * Qualify lead based on discovery call
   */
  async qualifyLead(request: QualifyLeadRequest): Promise<void> {
    logger.info('Qualifying lead', { leadId: request.leadId });

    const lead = await prisma.lead.findUnique({
      where: { id: request.leadId },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Update qualification criteria
    await prisma.lead.update({
      where: { id: request.leadId },
      data: {
        hiringIntentDetected: request.hiringIntentDetected,
        budgetQualified: request.budgetQualified,
        technicalFitScore: request.technicalFitScore,
        status: request.budgetQualified && request.hiringIntentDetected 
          ? 'QUALIFIED' 
          : 'ENGAGED',
      },
    });

    // Recalculate lead score
    const updatedScore = this.calculateLeadScore({
      ...lead,
      hiringIntentDetected: request.hiringIntentDetected,
      budgetQualified: request.budgetQualified,
    });

    await prisma.lead.update({
      where: { id: request.leadId },
      data: { leadScore: updatedScore },
    });

    logger.info('Lead qualified', {
      leadId: request.leadId,
      qualified: request.budgetQualified && request.hiringIntentDetected,
      updatedScore,
    });
  }

  /**
   * Initiate 4-touch outreach sequence
   */
  async initiateOutreachSequence(leadId: string): Promise<void> {
    logger.info('Initiating outreach sequence', { leadId });

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Create outreach sequence
    const sequence = await prisma.outreachSequence.create({
      data: {
        leadId,
        sequenceName: '4-Touch B2B Cold Outreach',
        totalSteps: 4,
        status: 'ACTIVE',
      },
    });

    // Schedule Touch 1: LinkedIn Connection (Day 0)
    await this.scheduleTouchpoint({
      sequenceId: sequence.id,
      stepNumber: 1,
      channel: 'LINKEDIN_CONNECTION',
      subject: null,
      messageBody: this.getOutreachTemplate('linkedin_connection', lead),
      daysDelay: 0,
    });

    // Schedule Touch 2: LinkedIn InMail (Day 3)
    await this.scheduleTouchpoint({
      sequenceId: sequence.id,
      stepNumber: 2,
      channel: 'LINKEDIN_INMAIL',
      subject: 'De-risking offshore engineering / 55% budget savings',
      messageBody: this.getOutreachTemplate('linkedin_inmail', lead),
      daysDelay: 3,
    });

    // Schedule Touch 3: Email (Day 6)
    await this.scheduleTouchpoint({
      sequenceId: sequence.id,
      stepNumber: 3,
      channel: 'EMAIL',
      subject: 'De-risking offshore engineering / 55% budget savings',
      messageBody: this.getOutreachTemplate('email', lead),
      daysDelay: 6,
    });

    // Schedule Touch 4: Value Drop Email (Day 10)
    await this.scheduleTouchpoint({
      sequenceId: sequence.id,
      stepNumber: 4,
      channel: 'EMAIL',
      subject: 'Elite pre-verified Nigerian engineers (zero fraud risk)',
      messageBody: this.getOutreachTemplate('value_drop', lead),
      daysDelay: 10,
    });

    logger.info('Outreach sequence initiated', {
      leadId,
      sequenceId: sequence.id,
    });
  }

  /**
   * Schedule individual touchpoint
   */
  private async scheduleTouchpoint(data: any): Promise<void> {
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + data.daysDelay);

    await prisma.outreachTouch.create({
      data: {
        sequenceId: data.sequenceId,
        stepNumber: data.stepNumber,
        channel: data.channel,
        subject: data.subject,
        messageBody: data.messageBody,
        scheduledAt,
        status: 'SCHEDULED',
      },
    });
  }

  /**
   * Get outreach message template
   */
  private getOutreachTemplate(type: string, lead: any): string {
    const templates = {
      linkedin_connection: `Hi ${lead.firstName},

I saw your posts about engineering hiring at ${lead.companyName}. With AI making resume fraud a massive problem, we built VETTED - an embedded trust protocol that eliminates offshore hiring risk through biometric verification + sandboxed code audits.

Would love to connect and share how we're helping US startups access elite Nigerian talent with zero identity fraud and 50%+ cost savings.

Best,
[Your Name]`,

      linkedin_inmail: `Hi ${lead.firstName},

With generative AI making resume fraud and deepfake tech screening a massive problem, hiring remote offshore talent has become highly insecure for US engineering teams.

We built VETTED to solve this. We are an embedded trust protocol that runs automated biometric identity liveness checks, direct government registry lookups, and sandboxed live code audits on elite Nigerian tech talent.

**By utilizing our infrastructure:**

✓ **Zero Identity Fraud**: Bulletproof certainty that your engineer is real and fully verified
✓ **Zero Capital Risk**: Funds sit in secure, non-custodial milestone accounts (Airwallex APIs). Payments release only when cryptographic milestones clear.
✓ **Massive Savings**: Access senior DevOps and AI engineers at 50%+ savings vs. local markets

We have 20 pre-verified, elite senior developers ready for deployment this month.

Are you open to a brief 5-minute review of our automated verification passports?

Best regards,
[Your Name]
Founder, VettedME & VettedPay
https://vettedme.com`,

      email: `Subject: De-risking offshore engineering / 55% budget savings

Hi ${lead.firstName},

Quick question for ${lead.companyName}:

Are you currently hiring engineers, or planning to in the next quarter?

If so, you're likely facing two massive problems:
1. Local talent costs are crushing your runway
2. Offshore talent comes with massive fraud risk (fake resumes, deepfake interviews)

We built VETTED to solve both.

**What we do:**
• Biometric verification + government ID cross-checks (NIN/BVN in Nigeria)
• Sandboxed live coding assessments (can't be faked or outsourced)
• Automated milestone escrow (funds release on cryptographic handshake)

**Result:**
Elite Nigerian engineers (same quality as US talent) at 50%+ cost savings, with ZERO fraud risk.

**The kicker:**
We have 20 pre-verified senior developers (React/Node/Python/DevOps) ready to deploy THIS MONTH.

Would 10 minutes on your calendar make sense to review their passports?

Best,
[Your Name]
Founder, VETTED
📧 [email]
🔗 https://vettedme.com`,

      value_drop: `Subject: Elite pre-verified Nigerian engineers (zero fraud risk)

Hi ${lead.firstName},

Following up on my last message about VETTED.

I've attached 3 developer profiles from our pre-verified talent pool:

1. **Senior Full-Stack Engineer** (React/Node/AWS)
   - VettedME Trust Score: 94/100
   - 8 years experience
   - Available: Immediate start
   - Rate: $45/hr (vs. $150/hr US market)

2. **DevOps Engineer** (Kubernetes/Terraform/CI/CD)
   - VettedME Trust Score: 91/100
   - 6 years experience
   - Available: 2 weeks
   - Rate: $50/hr (vs. $160/hr US market)

3. **AI/ML Engineer** (Python/TensorFlow/LangChain)
   - VettedME Trust Score: 96/100
   - 7 years experience
   - Available: 1 week
   - Rate: $55/hr (vs. $180/hr US market)

**All three have:**
✓ Biometric verification (liveness + government ID)
✓ Passed sandboxed coding assessments
✓ GitHub portfolios audited
✓ Zero fraud risk guarantee

If any of these profiles fit ${lead.companyName}'s needs, I can set up a technical interview this week.

Would that work?

Best,
[Your Name]
📧 [email]
🔗 View full profiles: https://vettedme.com/talent-pool`,
    };

    return templates[type as keyof typeof templates] || '';
  }

  /**
   * Mark touch as sent
   */
  async markTouchSent(touchId: string): Promise<void> {
    await prisma.outreachTouch.update({
      where: { id: touchId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // Update lead touch count
    const touch = await prisma.outreachTouch.findUnique({
      where: { id: touchId },
      include: { sequence: true },
    });

    if (touch) {
      await prisma.lead.update({
        where: { id: touch.sequence.leadId },
        data: {
          touchCount: { increment: 1 },
          lastContactedAt: new Date(),
        },
      });
    }
  }

  /**
   * Track email open
   */
  async trackEmailOpen(touchId: string): Promise<void> {
    await prisma.outreachTouch.update({
      where: { id: touchId },
      data: {
        status: 'OPENED',
        openedAt: new Date(),
      },
    });

    const touch = await prisma.outreachTouch.findUnique({
      where: { id: touchId },
      include: { sequence: true },
    });

    if (touch) {
      await prisma.lead.update({
        where: { id: touch.sequence.leadId },
        data: {
          emailsOpened: { increment: 1 },
        },
      });
    }
  }

  /**
   * Track link click
   */
  async trackLinkClick(touchId: string): Promise<void> {
    await prisma.outreachTouch.update({
      where: { id: touchId },
      data: {
        status: 'CLICKED',
        clickedAt: new Date(),
      },
    });

    const touch = await prisma.outreachTouch.findUnique({
      where: { id: touchId },
      include: { sequence: true },
    });

    if (touch) {
      await prisma.lead.update({
        where: { id: touch.sequence.leadId },
        data: {
          linksClicked: { increment: 1 },
        },
      });
    }
  }

  /**
   * Create deal from qualified lead
   */
  async createDeal(leadId: string, dealData: any): Promise<any> {
    logger.info('Creating deal', { leadId });

    const deal = await prisma.deal.create({
      data: {
        leadId,
        dealName: dealData.dealName,
        dealValue: dealData.dealValue,
        stage: 'DISCOVERY',
        probability: 10,
        contractType: dealData.contractType,
        developersNeeded: dealData.developersNeeded,
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'QUALIFIED' },
    });

    logger.info('Deal created', {
      dealId: deal.id,
      dealValue: deal.dealValue,
    });

    return deal;
  }

  /**
   * Get leads requiring follow-up
   */
  async getLeadsForFollowUp(): Promise<any[]> {
    const now = new Date();

    return await prisma.lead.findMany({
      where: {
        nextFollowUpAt: {
          lte: now,
        },
        status: {
          in: ['CONTACTED', 'ENGAGED'],
        },
      },
      include: {
        outreachSequences: {
          where: { status: 'ACTIVE' },
        },
      },
      orderBy: {
        nextFollowUpAt: 'asc',
      },
    });
  }
}

export const leadManagementService = new LeadManagementService();
