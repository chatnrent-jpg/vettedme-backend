import { AIStatus } from '@prisma/client';
import { logger } from '../../utils/logger';
import { githubAuditService } from './GitHubAuditService';
import { sandboxExecutionService } from './SandboxExecutionService';
import { aiVivaService } from './AIVivaService';
import { prisma } from '../../lib/prisma';

export enum AssessmentTier {
  TIER_1_PORTFOLIO_AUDIT = 'TIER_1_PORTFOLIO_AUDIT',
  TIER_2_CODE_LAB = 'TIER_2_CODE_LAB',
  TIER_3_AI_VIVA = 'TIER_3_AI_VIVA',
}

export interface AssessmentResult {
  tier: AssessmentTier;
  passed: boolean;
  score: number;
  maxScore: number;
  flags: string[];
  metadata: Record<string, any>;
  nextTier?: AssessmentTier;
}

export interface SkillAssessmentSession {
  userId: string;
  sessionId: string;
  currentTier: AssessmentTier;
  tier1Result?: AssessmentResult;
  tier2Result?: AssessmentResult;
  tier3Result?: AssessmentResult;
  overallScore: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  fraudFlags: string[];
}

/**
 * SkillAssessmentEngine - Three-Tier Automated Skill Validation
 * 
 * This is the CORE INTELLIGENCE LAYER that prevents resume fraud.
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Tier 1: Portfolio Audit (GitHub/GitLab API)                │
 * │  • Commit history analysis                                  │
 * │  • Code complexity scoring                                  │
 * │  • Authorship verification                                  │
 * │  • AI-generated code detection                              │
 * │  • Copy-paste pattern recognition                           │
 * └─────────────────────────────────────────────────────────────┘
 *                          ▼ (Pass: 70%+)
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Tier 2: Sandboxed Code Lab (Live Execution)               │
 * │  • In-browser IDE environment                               │
 * │  • Real broken codebase scenarios                           │
 * │  • Test suite validation                                    │
 * │  • Keystroke pattern analysis                               │
 * │  • Execution timing fraud detection                         │
 * └─────────────────────────────────────────────────────────────┘
 *                          ▼ (Pass: 85%+)
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Tier 3: AI Technical Viva (Anti-Deepfake)                 │
 * │  • Dynamic video interview                                  │
 * │  • Code explanation validation                              │
 * │  • Facial biometric tracking                                │
 * │  • Voice pattern analysis                                   │
 * │  • Third-party assistance detection                         │
 * └─────────────────────────────────────────────────────────────┘
 *                          ▼ (Pass: 90%+)
 *                  [VettedME Passport Issued]
 */
export class SkillAssessmentEngine {
  /**
   * Initialize a new skill assessment session
   */
  async startAssessment(
    userId: string,
    skillCategory: string,
    specificSkill: string
  ): Promise<SkillAssessmentSession> {
    logger.info('Starting skill assessment', {
      userId,
      skillCategory,
      specificSkill,
    });

    const sessionId = `assessment_${Date.now()}_${userId}`;

    const session: SkillAssessmentSession = {
      userId,
      sessionId,
      currentTier: AssessmentTier.TIER_1_PORTFOLIO_AUDIT,
      overallScore: 0,
      status: 'IN_PROGRESS',
      fraudFlags: [],
    };

    await prisma.skillAssessmentLog.create({
      data: {
        userId,
        assessmentType: 'PORTFOLIO_AUDIT',
        assessmentStatus: 'IN_PROGRESS',
        skillCategory,
        specificSkill,
        sandboxSessionId: sessionId,
      },
    });

    await this.syncUserAIProgress(userId, {
      aiStatus: AIStatus.TIER1_IN_PROGRESS,
      aiSessionId: sessionId,
      aiLastAttemptAt: new Date(),
      aiFailureReason: null,
    });

    return session;
  }

  /**
   * TIER 1: GitHub/Portfolio Audit
   * Analyzes commit history, code complexity, and authorship
   */
  async runTier1PortfolioAudit(
    session: SkillAssessmentSession,
    githubUsername: string,
    repositories: string[]
  ): Promise<AssessmentResult> {
    logger.info('Running Tier 1: Portfolio Audit', {
      userId: session.userId,
      sessionId: session.sessionId,
      githubUsername,
    });

    try {
      // 1. Fetch GitHub data
      const auditResult = await githubAuditService.auditDeveloperProfile({
        username: githubUsername,
        repositories,
        userId: session.userId,
      });

      // 2. Calculate score
      const score = this.calculateTier1Score(auditResult);
      const passed = score >= 70;

      // 3. Detect fraud patterns
      const flags = this.detectTier1FraudFlags(auditResult);

      const result: AssessmentResult = {
        tier: AssessmentTier.TIER_1_PORTFOLIO_AUDIT,
        passed,
        score,
        maxScore: 100,
        flags,
        metadata: {
          repositoriesAnalyzed: auditResult.repositoriesAnalyzed,
          totalCommits: auditResult.totalCommits,
          codeComplexityScore: auditResult.codeComplexityScore,
          aiGeneratedPercentage: auditResult.aiGeneratedPercentage,
          copyPastePercentage: auditResult.copyPastePercentage,
          authorshipVerified: auditResult.authorshipVerified,
        },
        nextTier: passed ? AssessmentTier.TIER_2_CODE_LAB : undefined,
      };

      // 4. Log results
      await prisma.skillAssessmentLog.create({
        data: {
          userId: session.userId,
          assessmentType: 'PORTFOLIO_AUDIT',
          assessmentStatus: passed ? 'COMPLETED' : 'FAILED',
          skillCategory: 'Portfolio Analysis',
          specificSkill: githubUsername,
          rawScore: score,
          normalizedScore: score,
          passed,
          sandboxSessionId: session.sessionId,
          aiAuditReport: auditResult as any,
          repositoriesScanned: repositories,
          codeQualityScore: auditResult.codeComplexityScore,
          completedAt: new Date(),
        },
      });

      await this.syncUserAIProgress(session.userId, {
        aiStatus: passed ? AIStatus.TIER1_PASSED : AIStatus.FAILED,
        aiTier1Score: score,
        aiSessionId: session.sessionId,
        aiLastAttemptAt: new Date(),
        aiFailureReason: passed ? null : 'Tier 1 portfolio audit below 70',
      });

      logger.info('Tier 1 completed', {
        userId: session.userId,
        passed,
        score,
        flags: flags.length,
      });

      return result;
    } catch (error: any) {
      await this.syncUserAIProgress(session.userId, {
        aiStatus: AIStatus.FAILED,
        aiFailureReason: `Tier 1 error: ${error.message}`,
        aiLastAttemptAt: new Date(),
      });
      logger.error('Tier 1 audit failed', {
        error: error.message,
        userId: session.userId,
      });
      throw new Error(`Portfolio audit failed: ${error.message}`);
    }
  }

  /**
   * TIER 2: Sandboxed Code Lab Execution
   * Real-time coding challenge with fraud detection
   */
  async runTier2CodeLab(
    session: SkillAssessmentSession,
    challengeId: string
  ): Promise<AssessmentResult> {
    logger.info('Running Tier 2: Code Lab', {
      userId: session.userId,
      sessionId: session.sessionId,
      challengeId,
    });

    await this.syncUserAIProgress(session.userId, {
      aiStatus: AIStatus.TIER2_IN_PROGRESS,
      aiSessionId: session.sessionId,
      aiLastAttemptAt: new Date(),
    });

    try {
      // 1. Load challenge
      const challenge = await this.loadCodeChallenge(challengeId);

      // 2. Initialize sandbox
      const sandboxSession = await sandboxExecutionService.initializeSandbox({
        userId: session.userId,
        challengeId,
        language: challenge.language,
        timeLimit: challenge.timeLimitSeconds,
      });

      // 3. Wait for candidate to submit solution
      // (This is handled by separate endpoint: POST /vettedme/assessment/tier2/submit)
      
      return {
        tier: AssessmentTier.TIER_2_CODE_LAB,
        passed: false, // Will be updated on submission
        score: 0,
        maxScore: 100,
        flags: [],
        metadata: {
          challengeId,
          sandboxSessionId: sandboxSession.sessionId,
          startedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      logger.error('Tier 2 initialization failed', {
        error: error.message,
        userId: session.userId,
      });
      throw new Error(`Code lab initialization failed: ${error.message}`);
    }
  }

  /**
   * Process Tier 2 code submission
   */
  async processTier2Submission(
    session: SkillAssessmentSession,
    sandboxSessionId: string,
    codeSubmitted: string,
    executionLogs: any
  ): Promise<AssessmentResult> {
    logger.info('Processing Tier 2 submission', {
      userId: session.userId,
      sandboxSessionId,
    });

    try {
      // 1. Run test suite
      const testResults = await sandboxExecutionService.executeTests({
        sandboxSessionId,
        code: codeSubmitted,
      });

      // 2. Analyze keystroke patterns and timing
      const fraudAnalysis = await sandboxExecutionService.analyzeFraudPatterns({
        sandboxSessionId,
        executionLogs,
      });

      // 3. Calculate score
      const score = this.calculateTier2Score(testResults, fraudAnalysis);
      const passed = score >= 85;

      // 4. Detect fraud
      const flags = this.detectTier2FraudFlags(fraudAnalysis);

      const result: AssessmentResult = {
        tier: AssessmentTier.TIER_2_CODE_LAB,
        passed,
        score,
        maxScore: 100,
        flags,
        metadata: {
          testsPassed: testResults.passedTests,
          totalTests: testResults.totalTests,
          executionTime: testResults.executionTime,
          keystrokePatternScore: fraudAnalysis.keystrokePatternScore,
          timingAnomalies: fraudAnalysis.timingAnomalies,
        },
        nextTier: passed ? AssessmentTier.TIER_3_AI_VIVA : undefined,
      };

      // 5. Log results
      await prisma.skillAssessmentLog.create({
        data: {
          userId: session.userId,
          assessmentType: 'CODING_CHALLENGE',
          assessmentStatus: passed ? 'COMPLETED' : 'FAILED',
          skillCategory: 'Live Coding',
          specificSkill: 'Sandbox Execution',
          rawScore: score,
          normalizedScore: score,
          passed,
          sandboxSessionId,
          codeSubmitted,
          executionLogs: executionLogs as any,
          timeSpentSeconds: testResults.executionTime,
          completedAt: new Date(),
        },
      });

      await this.syncUserAIProgress(session.userId, {
        aiStatus: passed ? AIStatus.TIER2_PASSED : AIStatus.FAILED,
        aiTier2Score: score,
        aiSessionId: session.sessionId,
        aiLastAttemptAt: new Date(),
        aiFailureReason: passed ? null : 'Tier 2 code lab below pass threshold',
      });

      logger.info('Tier 2 completed', {
        userId: session.userId,
        passed,
        score,
        flags: flags.length,
      });

      return result;
    } catch (error: any) {
      await this.syncUserAIProgress(session.userId, {
        aiStatus: AIStatus.FAILED,
        aiFailureReason: `Tier 2 error: ${error.message}`,
        aiLastAttemptAt: new Date(),
      });
      logger.error('Tier 2 processing failed', {
        error: error.message,
        userId: session.userId,
      });
      throw new Error(`Code lab processing failed: ${error.message}`);
    }
  }

  /**
   * TIER 3: AI Technical Viva with Biometric Tracking
   * Dynamic video interview with anti-deepfake detection
   */
  async runTier3AIViva(
    session: SkillAssessmentSession,
    tier2Code: string
  ): Promise<AssessmentResult> {
    logger.info('Running Tier 3: AI Technical Viva', {
      userId: session.userId,
      sessionId: session.sessionId,
    });

    await this.syncUserAIProgress(session.userId, {
      aiStatus: AIStatus.TIER3_IN_PROGRESS,
      aiSessionId: session.sessionId,
      aiLastAttemptAt: new Date(),
    });

    try {
      // 1. Generate dynamic questions based on Tier 2 code
      const questions = await aiVivaService.generateDynamicQuestions({
        code: tier2Code,
        userId: session.userId,
      });

      // 2. Initialize video session with biometric tracking
      const vivaSession = await aiVivaService.initializeVivaSession({
        userId: session.userId,
        questions,
        durationMinutes: 10,
      });

      return {
        tier: AssessmentTier.TIER_3_AI_VIVA,
        passed: false, // Will be updated after video session
        score: 0,
        maxScore: 100,
        flags: [],
        metadata: {
          vivaSessionId: vivaSession.sessionId,
          questionCount: questions.length,
          startedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      logger.error('Tier 3 initialization failed', {
        error: error.message,
        userId: session.userId,
      });
      throw new Error(`AI Viva initialization failed: ${error.message}`);
    }
  }

  /**
   * Process Tier 3 video interview results
   */
  async processTier3Results(
    session: SkillAssessmentSession,
    vivaSessionId: string,
    videoAnalysis: any
  ): Promise<AssessmentResult> {
    logger.info('Processing Tier 3 results', {
      userId: session.userId,
      vivaSessionId,
    });

    try {
      // 1. Analyze technical answers
      const technicalScore = await aiVivaService.scoreAnswers({
        vivaSessionId,
        videoAnalysis,
      });

      // 2. Biometric verification
      const biometricScore = await aiVivaService.verifyBiometrics({
        userId: session.userId,
        videoAnalysis,
      });

      // 3. Detect third-party assistance
      const fraudAnalysis = await aiVivaService.detectAssistance({
        videoAnalysis,
      });

      // 4. Calculate final score
      const score = this.calculateTier3Score(
        technicalScore,
        biometricScore,
        fraudAnalysis
      );
      const passed = score >= 90;

      // 5. Detect fraud
      const flags = this.detectTier3FraudFlags(fraudAnalysis);

      const result: AssessmentResult = {
        tier: AssessmentTier.TIER_3_AI_VIVA,
        passed,
        score,
        maxScore: 100,
        flags,
        metadata: {
          technicalScore: technicalScore.score,
          biometricMatchScore: biometricScore.matchScore,
          voicePatternScore: biometricScore.voicePatternScore,
          assistanceDetected: fraudAnalysis.assistanceDetected,
          deepfakeRisk: fraudAnalysis.deepfakeRisk,
        },
      };

      // 6. Log results
      await prisma.skillAssessmentLog.create({
        data: {
          userId: session.userId,
          assessmentType: 'TECHNICAL_INTERVIEW',
          assessmentStatus: passed ? 'COMPLETED' : 'FAILED',
          skillCategory: 'Technical Viva',
          specificSkill: 'AI Interview',
          rawScore: score,
          normalizedScore: score,
          passed,
          sandboxSessionId: vivaSessionId,
          aiAuditReport: videoAnalysis as any,
          completedAt: new Date(),
        },
      });

      await this.syncUserAIProgress(session.userId, {
        aiStatus: passed ? AIStatus.TIER3_PASSED : AIStatus.FAILED,
        aiTier3Score: score,
        aiSessionId: session.sessionId,
        aiLastAttemptAt: new Date(),
        aiFailureReason: passed ? null : 'Tier 3 AI viva below 90',
      });

      logger.info('Tier 3 completed', {
        userId: session.userId,
        passed,
        score,
        flags: flags.length,
      });

      return result;
    } catch (error: any) {
      await this.syncUserAIProgress(session.userId, {
        aiStatus: AIStatus.FAILED,
        aiFailureReason: `Tier 3 error: ${error.message}`,
        aiLastAttemptAt: new Date(),
      });
      logger.error('Tier 3 processing failed', {
        error: error.message,
        userId: session.userId,
      });
      throw new Error(`AI Viva processing failed: ${error.message}`);
    }
  }

  /**
   * Finalize assessment and issue VettedME Passport
   */
  async finalizeAssessment(
    session: SkillAssessmentSession
  ): Promise<{ passportIssued: boolean; trustScore: number }> {
    logger.info('Finalizing skill assessment', {
      userId: session.userId,
      sessionId: session.sessionId,
    });

    if (!session.tier1Result || !session.tier2Result || !session.tier3Result) {
      throw new Error('All three tiers must be completed');
    }

    const allPassed =
      session.tier1Result.passed &&
      session.tier2Result.passed &&
      session.tier3Result.passed;

    if (!allPassed) {
      await this.syncUserAIProgress(session.userId, {
        aiStatus: AIStatus.FAILED,
        aiTier1Score: session.tier1Result.score,
        aiTier2Score: session.tier2Result.score,
        aiTier3Score: session.tier3Result.score,
        aiFailureReason: 'One or more assessment tiers failed',
        aiLastAttemptAt: new Date(),
      });
      logger.warn('Assessment failed', {
        userId: session.userId,
        tier1: session.tier1Result.passed,
        tier2: session.tier2Result.passed,
        tier3: session.tier3Result.passed,
      });
      return { passportIssued: false, trustScore: 0 };
    }

    // Calculate overall trust score
    const overallScore = this.calculateOverallScore(
      session.tier1Result.score,
      session.tier2Result.score,
      session.tier3Result.score
    );

    // Update VettedME Passport
    await prisma.vettedMEPassport.upsert({
      where: { userId: session.userId },
      update: {
        skillVerificationStatus: 'VERIFIED',
        overallSkillScore: overallScore,
        assessmentsPassed: { increment: 1 },
        lastVerificationAt: new Date(),
      },
      create: {
        userId: session.userId,
        skillVerificationStatus: 'VERIFIED',
        overallSkillScore: overallScore,
        assessmentsPassed: 1,
      },
    });

    await this.syncUserAIProgress(session.userId, {
      aiStatus: AIStatus.COMPLETED,
      aiScore: overallScore,
      aiTier1Score: session.tier1Result.score,
      aiTier2Score: session.tier2Result.score,
      aiTier3Score: session.tier3Result.score,
      aiSessionId: session.sessionId,
      aiCompletedAt: new Date(),
      aiLastAttemptAt: new Date(),
      aiFailureReason: null,
    });

    logger.info('VettedME Passport updated', {
      userId: session.userId,
      overallScore,
    });

    return {
      passportIssued: true,
      trustScore: overallScore,
    };
  }

  /**
   * Persist AI assessment progress onto the User record (ai_status attributes).
   */
  private async syncUserAIProgress(
    userId: string,
    data: {
      aiStatus?: AIStatus;
      aiScore?: number;
      aiTier1Score?: number;
      aiTier2Score?: number;
      aiTier3Score?: number;
      aiSessionId?: string | null;
      aiLastAttemptAt?: Date | null;
      aiCompletedAt?: Date | null;
      aiFailureReason?: string | null;
    }
  ): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data,
      });
    } catch (error: any) {
      // Justice: never invent success — log and continue assessment path.
      logger.error('Failed to sync user AI progress', {
        userId,
        error: error?.message,
        aiStatus: data.aiStatus,
      });
    }
  }

  // ========================================================================
  // SCORING ALGORITHMS
  // ========================================================================

  private calculateTier1Score(auditResult: any): number {
    let score = 0;

    // Code complexity (40 points)
    score += Math.min(40, auditResult.codeComplexityScore * 0.4);

    // Authorship verification (30 points)
    if (auditResult.authorshipVerified) score += 30;

    // Low AI-generated content (20 points)
    score += Math.max(0, 20 - auditResult.aiGeneratedPercentage * 0.2);

    // Low copy-paste content (10 points)
    score += Math.max(0, 10 - auditResult.copyPastePercentage * 0.1);

    return Math.round(score);
  }

  private calculateTier2Score(testResults: any, fraudAnalysis: any): number {
    let score = 0;

    // Test pass rate (60 points)
    const testPassRate = testResults.passedTests / testResults.totalTests;
    score += testPassRate * 60;

    // Code quality (20 points)
    score += Math.min(20, testResults.codeQualityScore * 0.2);

    // Keystroke pattern validity (20 points)
    score += Math.min(20, fraudAnalysis.keystrokePatternScore * 0.2);

    // Penalty for timing anomalies
    score -= fraudAnalysis.timingAnomalies * 5;

    return Math.max(0, Math.round(score));
  }

  private calculateTier3Score(
    technicalScore: any,
    biometricScore: any,
    fraudAnalysis: any
  ): number {
    let score = 0;

    // Technical answer quality (50 points)
    score += technicalScore.score * 0.5;

    // Biometric match (30 points)
    score += biometricScore.matchScore * 0.3;

    // Voice pattern match (20 points)
    score += biometricScore.voicePatternScore * 0.2;

    // Penalty for assistance detection
    if (fraudAnalysis.assistanceDetected) score -= 30;

    // Penalty for deepfake risk
    score -= fraudAnalysis.deepfakeRisk * 20;

    return Math.max(0, Math.round(score));
  }

  private calculateOverallScore(
    tier1: number,
    tier2: number,
    tier3: number
  ): number {
    // Weighted average: Tier 1 (20%), Tier 2 (40%), Tier 3 (40%)
    return Math.round(tier1 * 0.2 + tier2 * 0.4 + tier3 * 0.4);
  }

  // ========================================================================
  // FRAUD DETECTION
  // ========================================================================

  private detectTier1FraudFlags(auditResult: any): string[] {
    const flags: string[] = [];

    if (auditResult.aiGeneratedPercentage > 30) {
      flags.push('HIGH_AI_GENERATED_CODE');
    }

    if (auditResult.copyPastePercentage > 50) {
      flags.push('EXCESSIVE_COPY_PASTE');
    }

    if (!auditResult.authorshipVerified) {
      flags.push('AUTHORSHIP_MISMATCH');
    }

    if (auditResult.recentCommitSurge) {
      flags.push('SUSPICIOUS_COMMIT_PATTERN');
    }

    return flags;
  }

  private detectTier2FraudFlags(fraudAnalysis: any): string[] {
    const flags: string[] = [];

    if (fraudAnalysis.timingAnomalies > 3) {
      flags.push('TIMING_ANOMALIES_DETECTED');
    }

    if (fraudAnalysis.keystrokePatternScore < 50) {
      flags.push('ABNORMAL_KEYSTROKE_PATTERN');
    }

    if (fraudAnalysis.windowSwitchingDetected) {
      flags.push('EXTERNAL_ASSISTANCE_SUSPECTED');
    }

    return flags;
  }

  private detectTier3FraudFlags(fraudAnalysis: any): string[] {
    const flags: string[] = [];

    if (fraudAnalysis.assistanceDetected) {
      flags.push('THIRD_PARTY_ASSISTANCE_DETECTED');
    }

    if (fraudAnalysis.deepfakeRisk > 0.5) {
      flags.push('DEEPFAKE_RISK_HIGH');
    }

    if (fraudAnalysis.voiceMismatch) {
      flags.push('VOICE_PATTERN_MISMATCH');
    }

    if (fraudAnalysis.multipleFacesDetected) {
      flags.push('MULTIPLE_PEOPLE_IN_FRAME');
    }

    return flags;
  }

  private async loadCodeChallenge(challengeId: string) {
    // TODO: Load from challenge database
    return {
      id: challengeId,
      language: 'javascript',
      timeLimitSeconds: 3600,
      description: 'Debug and refactor broken API endpoint',
      starterCode: '// Broken code here...',
      testCases: [],
    };
  }
}

export const skillAssessmentEngine = new SkillAssessmentEngine();
