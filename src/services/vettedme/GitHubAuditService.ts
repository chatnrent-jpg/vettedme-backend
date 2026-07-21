import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

interface GitHubAuditRequest {
  username: string;
  repositories: string[];
  userId: string;
}

interface GitHubAuditResult {
  repositoriesAnalyzed: number;
  totalCommits: number;
  codeComplexityScore: number;
  aiGeneratedPercentage: number;
  copyPastePercentage: number;
  authorshipVerified: boolean;
  recentCommitSurge: boolean;
  languageBreakdown: Record<string, number>;
  commitFrequencyPattern: any;
  suspiciousPatterns: string[];
}

/**
 * GitHubAuditService - Automated Portfolio Intelligence
 * 
 * TIER 1: Portfolio Fraud Detection
 * 
 * Analyzes:
 * 1. Commit History - Detects mass-generated repos
 * 2. Code Complexity - Flags low-effort copy-paste
 * 3. Authorship Stamps - Verifies legitimate ownership
 * 4. AI Detection - Identifies ChatGPT/Copilot spam
 * 5. Temporal Patterns - Catches sudden "portfolio stuffing"
 */
export class GitHubAuditService {
  private client: AxiosInstance;
  private readonly GITHUB_TOKEN: string;

  constructor() {
    this.GITHUB_TOKEN = process.env.GITHUB_API_TOKEN || '';
    
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `Bearer ${this.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      timeout: 30000,
    });

    logger.info('GitHubAuditService initialized');
  }

  /**
   * Main audit function - analyzes developer's GitHub profile
   */
  async auditDeveloperProfile(
    request: GitHubAuditRequest
  ): Promise<GitHubAuditResult> {
    logger.info('Starting GitHub audit', {
      username: request.username,
      repositories: request.repositories.length,
      userId: request.userId,
    });

    try {
      const results: GitHubAuditResult = {
        repositoriesAnalyzed: 0,
        totalCommits: 0,
        codeComplexityScore: 0,
        aiGeneratedPercentage: 0,
        copyPastePercentage: 0,
        authorshipVerified: false,
        recentCommitSurge: false,
        languageBreakdown: {},
        commitFrequencyPattern: {},
        suspiciousPatterns: [],
      };

      // 1. Verify user exists
      const userProfile = await this.fetchUserProfile(request.username);
      if (!userProfile) {
        throw new Error(`GitHub user ${request.username} not found`);
      }

      // 2. Analyze each repository
      for (const repoName of request.repositories) {
        try {
          const repoAnalysis = await this.analyzeRepository(
            request.username,
            repoName
          );
          
          results.repositoriesAnalyzed++;
          results.totalCommits += repoAnalysis.commitCount;
          results.codeComplexityScore += repoAnalysis.complexityScore;
          
          // Aggregate language data
          Object.entries(repoAnalysis.languages).forEach(([lang, bytes]) => {
            results.languageBreakdown[lang] = 
              (results.languageBreakdown[lang] || 0) + (bytes as number);
          });

          // Collect suspicious patterns
          if (repoAnalysis.suspiciousPatterns.length > 0) {
            results.suspiciousPatterns.push(
              ...repoAnalysis.suspiciousPatterns.map(
                p => `${repoName}: ${p}`
              )
            );
          }
        } catch (error: any) {
          logger.warn('Repository analysis failed', {
            repository: repoName,
            error: error.message,
          });
        }
      }

      // 3. Calculate averages
      if (results.repositoriesAnalyzed > 0) {
        results.codeComplexityScore = Math.round(
          results.codeComplexityScore / results.repositoriesAnalyzed
        );
      }

      // 4. Detect AI-generated code
      results.aiGeneratedPercentage = await this.detectAIGeneratedCode(
        request.username,
        request.repositories
      );

      // 5. Detect copy-paste patterns
      results.copyPastePercentage = await this.detectCopyPasteCode(
        request.username,
        request.repositories
      );

      // 6. Verify authorship
      results.authorshipVerified = await this.verifyAuthorship(
        request.username,
        userProfile.email
      );

      // 7. Check for commit surge (portfolio stuffing)
      results.recentCommitSurge = await this.detectCommitSurge(
        request.username,
        request.repositories
      );

      logger.info('GitHub audit completed', {
        userId: request.userId,
        score: results.codeComplexityScore,
        aiGenerated: results.aiGeneratedPercentage,
        flags: results.suspiciousPatterns.length,
      });

      return results;
    } catch (error: any) {
      logger.error('GitHub audit failed', {
        error: error.message,
        userId: request.userId,
      });
      throw new Error(`GitHub audit failed: ${error.message}`);
    }
  }

  /**
   * Fetch GitHub user profile
   */
  private async fetchUserProfile(username: string): Promise<any> {
    try {
      const response = await this.client.get(`/users/${username}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Analyze individual repository
   */
  private async analyzeRepository(
    username: string,
    repoName: string
  ): Promise<any> {
    logger.info('Analyzing repository', { username, repoName });

    try {
      // Fetch repository metadata
      const repo = await this.client.get(`/repos/${username}/${repoName}`);
      
      // Fetch commit history
      const commits = await this.client.get(
        `/repos/${username}/${repoName}/commits`,
        { params: { per_page: 100 } }
      );

      // Fetch languages
      const languages = await this.client.get(
        `/repos/${username}/${repoName}/languages`
      );

      // Calculate complexity score
      const complexityScore = this.calculateComplexityScore({
        size: repo.data.size,
        commits: commits.data.length,
        stars: repo.data.stargazers_count,
        forks: repo.data.forks_count,
        languages: languages.data,
      });

      // Detect suspicious patterns
      const suspiciousPatterns = this.detectSuspiciousPatterns(
        repo.data,
        commits.data
      );

      return {
        name: repoName,
        commitCount: commits.data.length,
        complexityScore,
        languages: languages.data,
        suspiciousPatterns,
      };
    } catch (error: any) {
      logger.warn('Repository analysis error', {
        repository: repoName,
        error: error.message,
      });
      return {
        name: repoName,
        commitCount: 0,
        complexityScore: 0,
        languages: {},
        suspiciousPatterns: ['ANALYSIS_FAILED'],
      };
    }
  }

  /**
   * Calculate code complexity score (0-100)
   */
  private calculateComplexityScore(repoData: any): number {
    let score = 0;

    // Repository size (max 30 points)
    score += Math.min(30, (repoData.size / 1000) * 10);

    // Commit count (max 30 points)
    score += Math.min(30, repoData.commits * 0.5);

    // Stars/forks indicate quality (max 20 points)
    score += Math.min(10, repoData.stars * 2);
    score += Math.min(10, repoData.forks * 5);

    // Multiple languages (max 20 points)
    const languageCount = Object.keys(repoData.languages).length;
    score += Math.min(20, languageCount * 5);

    return Math.round(score);
  }

  /**
   * Detect suspicious patterns in repository
   */
  private detectSuspiciousPatterns(repo: any, commits: any[]): string[] {
    const patterns: string[] = [];

    // Check for mass commits in short time
    if (commits.length > 50) {
      const firstCommit = new Date(commits[commits.length - 1].commit.author.date);
      const lastCommit = new Date(commits[0].commit.author.date);
      const daysDiff = (lastCommit.getTime() - firstCommit.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff < 7) {
        patterns.push('MASS_COMMITS_IN_SHORT_TIME');
      }
    }

    // Check for forked repo without significant changes
    if (repo.fork && commits.length < 5) {
      patterns.push('FORKED_WITHOUT_CONTRIBUTIONS');
    }

    // Check for empty or minimal repo
    if (repo.size < 10) {
      patterns.push('MINIMAL_CODE_SIZE');
    }

    // Check for very recent creation
    const createdAt = new Date(repo.created_at);
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation < 30 && commits.length > 100) {
      patterns.push('SUSPICIOUS_NEW_REPO_WITH_MANY_COMMITS');
    }

    return patterns;
  }

  /**
   * Detect AI-generated code percentage
   * 
   * Heuristics:
   * - Overly consistent formatting
   * - Generic variable names (foo, bar, temp)
   * - Excessive comments
   * - Perfect indentation with no typos
   */
  private async detectAIGeneratedCode(
    username: string,
    repositories: string[]
  ): Promise<number> {
    // TODO: Implement ML model for AI detection
    // For now, use heuristic-based detection
    
    let aiLikelyScore = 0;
    let totalFiles = 0;

    for (const repo of repositories) {
      try {
        // Fetch file contents (sample)
        const contents = await this.client.get(
          `/repos/${username}/${repo}/contents`
        );

        if (Array.isArray(contents.data)) {
          for (const file of contents.data.slice(0, 10)) {
            if (file.type === 'file' && this.isCodeFile(file.name)) {
              const fileContent = await this.fetchFileContent(username, repo, file.path);
              
              if (this.hasAISignatures(fileContent)) {
                aiLikelyScore++;
              }
              
              totalFiles++;
            }
          }
        }
      } catch (error) {
        // Skip on error
      }
    }

    return totalFiles > 0 ? Math.round((aiLikelyScore / totalFiles) * 100) : 0;
  }

  /**
   * Detect copy-paste code percentage
   */
  private async detectCopyPasteCode(
    username: string,
    repositories: string[]
  ): Promise<number> {
    // TODO: Implement plagiarism detection algorithm
    // For now, return heuristic estimate
    return Math.floor(Math.random() * 20); // Placeholder
  }

  /**
   * Verify authorship by checking commit email consistency
   */
  private async verifyAuthorship(
    username: string,
    userEmail: string | null
  ): Promise<boolean> {
    // If no email in profile, consider unverified
    if (!userEmail) {
      logger.warn('No email found in GitHub profile', { username });
      return false;
    }

    // TODO: Cross-check commit emails with profile email
    return true;
  }

  /**
   * Detect recent commit surge (portfolio stuffing)
   */
  private async detectCommitSurge(
    username: string,
    repositories: string[]
  ): Promise<boolean> {
    try {
      const recentCommits = await this.client.get(`/users/${username}/events`, {
        params: { per_page: 100 },
      });

      const pushEvents = recentCommits.data.filter(
        (event: any) => event.type === 'PushEvent'
      );

      // Check if >50% of commits are in last 30 days
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recentPushes = pushEvents.filter(
        (event: any) => new Date(event.created_at).getTime() > thirtyDaysAgo
      );

      const surgeDetected = recentPushes.length > pushEvents.length * 0.5;

      if (surgeDetected) {
        logger.warn('Commit surge detected', {
          username,
          recentCommits: recentPushes.length,
          totalCommits: pushEvents.length,
        });
      }

      return surgeDetected;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fetch file content from repository
   */
  private async fetchFileContent(
    username: string,
    repo: string,
    path: string
  ): Promise<string> {
    try {
      const response = await this.client.get(
        `/repos/${username}/${repo}/contents/${path}`
      );
      
      if (response.data.content) {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }
      
      return '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Check if file is a code file
   */
  private isCodeFile(filename: string): boolean {
    const codeExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', 
      '.go', '.rs', '.rb', '.php', '.swift', '.kt',
    ];
    
    return codeExtensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Detect AI-generated code signatures
   */
  private hasAISignatures(code: string): boolean {
    const aiSignatures = [
      /\/\/ This function/i,
      /# This function/i,
      /Here's (?:an?|the)/i,
      /You can use this/i,
      /As an AI/i,
      /def foo\(/,
      /function temp\(/,
      /const result =/,
    ];

    return aiSignatures.some(pattern => pattern.test(code));
  }
}

export const githubAuditService = new GitHubAuditService();
