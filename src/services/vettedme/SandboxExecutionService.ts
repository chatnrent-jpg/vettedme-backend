import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface SandboxInitRequest {
  userId: string;
  challengeId: string;
  language: string;
  timeLimit: number;
}

interface SandboxSession {
  sessionId: string;
  userId: string;
  challengeId: string;
  language: string;
  startTime: Date;
  expiresAt: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
}

interface ExecuteTestsRequest {
  sandboxSessionId: string;
  code: string;
}

interface TestExecutionResult {
  passedTests: number;
  totalTests: number;
  executionTime: number;
  codeQualityScore: number;
  testResults: any[];
}

interface FraudAnalysisRequest {
  sandboxSessionId: string;
  executionLogs: any;
}

interface FraudAnalysisResult {
  keystrokePatternScore: number;
  timingAnomalies: number;
  windowSwitchingDetected: boolean;
  suspiciousActivityFlags: string[];
}

/**
 * SandboxExecutionService - Secure Code Lab Environment
 * 
 * TIER 2: Live Coding Validation with Fraud Detection
 * 
 * Features:
 * 1. Isolated code execution environment
 * 2. Real-time test suite validation
 * 3. Keystroke pattern analysis (detects outsourcing)
 * 4. Timing anomaly detection (detects AI assistance)
 * 5. Window switching detection (detects external help)
 * 6. Code quality scoring
 */
export class SandboxExecutionService {
  private activeSessions: Map<string, SandboxSession> = new Map();

  /**
   * Initialize secure sandbox environment
   */
  async initializeSandbox(
    request: SandboxInitRequest
  ): Promise<SandboxSession> {
    logger.info('Initializing sandbox', {
      userId: request.userId,
      challengeId: request.challengeId,
    });

    const sessionId = `sandbox_${uuidv4()}`;
    const startTime = new Date();
    const expiresAt = new Date(startTime.getTime() + request.timeLimit * 1000);

    const session: SandboxSession = {
      sessionId,
      userId: request.userId,
      challengeId: request.challengeId,
      language: request.language,
      startTime,
      expiresAt,
      status: 'ACTIVE',
    };

    this.activeSessions.set(sessionId, session);

    logger.info('Sandbox initialized', {
      sessionId,
      userId: request.userId,
      expiresAt: expiresAt.toISOString(),
    });

    return session;
  }

  /**
   * Execute code and run test suite
   */
  async executeTests(
    request: ExecuteTestsRequest
  ): Promise<TestExecutionResult> {
    logger.info('Executing tests', {
      sandboxSessionId: request.sandboxSessionId,
    });

    const session = this.activeSessions.get(request.sandboxSessionId);
    if (!session) {
      throw new Error('Sandbox session not found');
    }

    if (session.status !== 'ACTIVE') {
      throw new Error('Sandbox session is not active');
    }

    try {
      const startTime = Date.now();

      // 1. Run code in isolated environment
      const executionResult = await this.runCodeInSandbox(
        request.code,
        session.language
      );

      // 2. Run test suite
      const testResults = await this.runTestSuite(
        request.code,
        session.challengeId
      );

      // 3. Calculate code quality
      const codeQualityScore = await this.analyzeCodeQuality(request.code);

      const executionTime = Math.round((Date.now() - startTime) / 1000);

      const result: TestExecutionResult = {
        passedTests: testResults.filter((t: any) => t.passed).length,
        totalTests: testResults.length,
        executionTime,
        codeQualityScore,
        testResults,
      };

      logger.info('Tests executed', {
        sessionId: request.sandboxSessionId,
        passed: result.passedTests,
        total: result.totalTests,
      });

      return result;
    } catch (error: any) {
      logger.error('Test execution failed', {
        error: error.message,
        sessionId: request.sandboxSessionId,
      });
      throw new Error(`Test execution failed: ${error.message}`);
    }
  }

  /**
   * Analyze fraud patterns in execution logs
   */
  async analyzeFraudPatterns(
    request: FraudAnalysisRequest
  ): Promise<FraudAnalysisResult> {
    logger.info('Analyzing fraud patterns', {
      sandboxSessionId: request.sandboxSessionId,
    });

    const logs = request.executionLogs;

    // 1. Analyze keystroke patterns
    const keystrokeScore = this.analyzeKeystrokePatterns(logs.keystrokes);

    // 2. Detect timing anomalies
    const timingAnomalies = this.detectTimingAnomalies(logs.timestamps);

    // 3. Detect window switching
    const windowSwitching = this.detectWindowSwitching(logs.focusEvents);

    // 4. Collect suspicious flags
    const flags: string[] = [];
    if (keystrokeScore < 50) flags.push('ABNORMAL_KEYSTROKE_PATTERN');
    if (timingAnomalies > 3) flags.push('MULTIPLE_TIMING_ANOMALIES');
    if (windowSwitching) flags.push('WINDOW_SWITCHING_DETECTED');
    if (logs.pasteEvents && logs.pasteEvents.length > 5) {
      flags.push('EXCESSIVE_PASTE_OPERATIONS');
    }

    const result: FraudAnalysisResult = {
      keystrokePatternScore: keystrokeScore,
      timingAnomalies,
      windowSwitchingDetected: windowSwitching,
      suspiciousActivityFlags: flags,
    };

    logger.info('Fraud analysis completed', {
      sessionId: request.sandboxSessionId,
      keystrokeScore,
      flags: flags.length,
    });

    return result;
  }

  /**
   * Run code in isolated Docker container
   */
  private async runCodeInSandbox(
    code: string,
    language: string
  ): Promise<any> {
    // TODO: Implement actual sandboxed execution
    // Options:
    // - Docker container with resource limits
    // - VM-based isolation
    // - Cloud sandbox service (e.g., Judge0 API)
    
    logger.info('Running code in sandbox', { language });

    // Placeholder: return mock execution result
    return {
      success: true,
      output: 'Code executed successfully',
      executionTime: 250,
    };
  }

  /**
   * Run test suite against submitted code
   */
  private async runTestSuite(
    code: string,
    challengeId: string
  ): Promise<any[]> {
    // TODO: Load challenge test cases from database
    // Run each test case and collect results
    
    logger.info('Running test suite', { challengeId });

    // Placeholder: return mock test results
    return [
      { name: 'Test 1: Basic functionality', passed: true, time: 50 },
      { name: 'Test 2: Edge cases', passed: true, time: 75 },
      { name: 'Test 3: Performance', passed: true, time: 100 },
      { name: 'Test 4: Error handling', passed: true, time: 60 },
      { name: 'Test 5: Complex scenario', passed: false, time: 120 },
    ];
  }

  /**
   * Analyze code quality metrics
   */
  private async analyzeCodeQuality(code: string): Promise<number> {
    let score = 100;

    // Deduct points for bad practices
    if (code.includes('console.log')) score -= 5;
    if (code.includes('var ')) score -= 10;
    if (code.includes('eval(')) score -= 20;
    if (code.length < 50) score -= 20;
    if (code.split('\n').length < 5) score -= 10;

    // Bonus points for good practices
    if (code.includes('const ')) score += 5;
    if (code.includes('try {')) score += 5;
    if (code.includes('// ')) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze keystroke patterns
   * 
   * Legitimate typing: Natural rhythm, pauses, backspaces
   * Outsourced/AI: Unnatural consistency, no pauses, perfect typing
   */
  private analyzeKeystrokePatterns(keystrokes: any[]): number {
    if (!keystrokes || keystrokes.length === 0) {
      return 50; // Neutral score if no data
    }

    let score = 100;

    // Calculate typing speed variance
    const intervals: number[] = [];
    for (let i = 1; i < keystrokes.length; i++) {
      intervals.push(keystrokes[i].timestamp - keystrokes[i - 1].timestamp);
    }

    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce(
        (sum, val) => sum + Math.pow(val - avgInterval, 2),
        0
      ) / intervals.length;

      // Too consistent = suspicious
      if (variance < 100) {
        score -= 30;
      }

      // Too fast = suspicious
      if (avgInterval < 50) {
        score -= 20;
      }
    }

    // Check for backspaces (natural typing has mistakes)
    const backspaces = keystrokes.filter((k: any) => k.key === 'Backspace').length;
    const backspaceRatio = backspaces / keystrokes.length;
    
    if (backspaceRatio < 0.05) {
      // Too perfect
      score -= 20;
    }

    return Math.max(0, score);
  }

  /**
   * Detect timing anomalies
   * 
   * Examples:
   * - Sudden burst of activity after long pause (getting help)
   * - Completing complex task too quickly (copy-paste)
   * - Unusual idle periods followed by perfect code
   */
  private detectTimingAnomalies(timestamps: any[]): number {
    if (!timestamps || timestamps.length < 2) {
      return 0;
    }

    let anomalies = 0;

    // Check for unusual gaps
    for (let i = 1; i < timestamps.length; i++) {
      const gap = timestamps[i] - timestamps[i - 1];
      
      // Gap > 5 minutes = suspicious
      if (gap > 300000) {
        anomalies++;
      }
      
      // Burst after long pause = suspicious
      if (gap > 180000 && i < timestamps.length - 10) {
        const nextGaps = [];
        for (let j = i; j < Math.min(i + 10, timestamps.length); j++) {
          nextGaps.push(timestamps[j] - timestamps[j - 1]);
        }
        const avgNextGap = nextGaps.reduce((a, b) => a + b, 0) / nextGaps.length;
        
        if (avgNextGap < 1000) {
          // Sudden burst
          anomalies++;
        }
      }
    }

    return anomalies;
  }

  /**
   * Detect window switching (indicates external assistance)
   */
  private detectWindowSwitching(focusEvents: any[]): boolean {
    if (!focusEvents || focusEvents.length === 0) {
      return false;
    }

    // Count focus loss events during active coding
    const focusLossCount = focusEvents.filter(
      (e: any) => e.type === 'blur'
    ).length;

    // More than 5 window switches = suspicious
    return focusLossCount > 5;
  }
}

export const sandboxExecutionService = new SandboxExecutionService();
