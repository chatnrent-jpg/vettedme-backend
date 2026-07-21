/**
 * ============================================================================
 * VETTED - Automated GitHub Corridor Scraper
 * ============================================================================
 * 
 * Purpose: Source elite engineering profiles from target corridors
 * (Lagos, Nairobi, São Paulo) for invite-only beta program
 * 
 * Features:
 * - Geographic filtering (location-based search)
 * - Language/tech stack filtering (TypeScript, React, Go, Docker, Rust)
 * - Scoring algorithm (contributions, stars, commit frequency)
 * - Export to CSV for outreach campaigns
 * 
 * Usage:
 *   npm run scrape:github -- --corridor lagos --limit 100
 *   npm run scrape:github -- --corridor nairobi --limit 100
 *   npm run scrape:github -- --corridor saopaulo --limit 100
 * 
 * ============================================================================
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'json2csv';

// ============================================================================
// Configuration
// ============================================================================

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const octokit = new Octokit({ auth: GITHUB_TOKEN });

interface CorridorConfig {
  name: string;
  locations: string[];
  timezone: string;
  languages: string[];
  targetCount: number;
}

const CORRIDORS: Record<string, CorridorConfig> = {
  lagos: {
    name: 'Lagos, Nigeria',
    locations: ['Lagos', 'Lagos, Nigeria', 'Nigeria', 'NG'],
    timezone: 'Africa/Lagos',
    languages: ['TypeScript', 'JavaScript', 'React', 'Node.js', 'Python', 'Go'],
    targetCount: 20,
  },
  nairobi: {
    name: 'Nairobi, Kenya',
    locations: ['Nairobi', 'Nairobi, Kenya', 'Kenya', 'KE'],
    timezone: 'Africa/Nairobi',
    languages: ['Kotlin', 'Java', 'Android', 'Python', 'JavaScript', 'TypeScript'],
    targetCount: 15,
  },
  saopaulo: {
    name: 'São Paulo, Brazil',
    locations: ['São Paulo', 'Sao Paulo', 'Brazil', 'Brasil', 'BR'],
    timezone: 'America/Sao_Paulo',
    languages: ['Go', 'Rust', 'Docker', 'Kubernetes', 'Python', 'TypeScript'],
    targetCount: 15,
  },
};

// Minimum qualification thresholds
const MIN_PUBLIC_REPOS = 5;
const MIN_FOLLOWERS = 10;
const MIN_TOTAL_STARS = 20;

// ============================================================================
// Types
// ============================================================================

interface GitHubUser {
  login: string;
  name: string | null;
  email: string | null;
  location: string | null;
  bio: string | null;
  blog: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  avatar_url: string;
}

interface DeveloperProfile {
  // Basic Info
  username: string;
  name: string;
  email: string;
  location: string;
  bio: string;
  githubUrl: string;
  avatarUrl: string;
  blog: string;
  twitter: string;
  
  // Metrics
  publicRepos: number;
  followers: number;
  following: number;
  totalStars: number;
  totalForks: number;
  contributionScore: number;
  
  // Languages
  topLanguages: string[];
  
  // Scoring
  qualityScore: number; // 0-100
  
  // Metadata
  accountAge: number; // years
  lastActive: string;
  corridor: string;
}

// ============================================================================
// Main Scraper Function
// ============================================================================

async function scrapeGitHubCorridor(
  corridor: string,
  limit: number = 100
): Promise<DeveloperProfile[]> {
  const config = CORRIDORS[corridor];
  if (!config) {
    throw new Error(`Unknown corridor: ${corridor}. Valid corridors: lagos, nairobi, saopaulo`);
  }

  console.log(`\n🔍 Scraping GitHub for elite developers in ${config.name}...`);
  console.log(`Target: ${limit} developers`);
  console.log(`Languages: ${config.languages.join(', ')}`);
  console.log(`\n`);

  const allDevelopers: DeveloperProfile[] = [];

  // Search for developers in each location
  for (const location of config.locations) {
    console.log(`📍 Searching location: ${location}...`);

    try {
      // Search users by location and language
      const searchQuery = `location:${location} repos:>=${MIN_PUBLIC_REPOS} followers:>=${MIN_FOLLOWERS}`;
      
      const { data: searchResults } = await octokit.search.users({
        q: searchQuery,
        per_page: 100,
        sort: 'followers',
        order: 'desc',
      });

      console.log(`   Found ${searchResults.items.length} users`);

      // Process each user
      for (const user of searchResults.items.slice(0, limit)) {
        try {
          const profile = await analyzeDeveloperProfile(user.login, corridor);
          
          // Filter by quality score
          if (profile && profile.qualityScore >= 70) {
            allDevelopers.push(profile);
            console.log(`   ✅ ${profile.username} (Score: ${profile.qualityScore}/100)`);
          } else {
            console.log(`   ⏭️  ${user.login} (Score too low)`);
          }

          // Rate limiting: 1 request per second
          await sleep(1000);
        } catch (error) {
          console.error(`   ❌ Error processing ${user.login}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    } catch (error) {
      console.error(`Error searching location ${location}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Sort by quality score (descending)
  allDevelopers.sort((a, b) => b.qualityScore - a.qualityScore);

  // Deduplicate (same developer in multiple locations)
  const uniqueDevelopers = deduplicateDevelopers(allDevelopers);

  console.log(`\n✅ Found ${uniqueDevelopers.length} unique elite developers`);
  console.log(`📊 Average quality score: ${calculateAverageScore(uniqueDevelopers)}/100`);

  return uniqueDevelopers.slice(0, config.targetCount);
}

// ============================================================================
// Developer Profile Analysis
// ============================================================================

async function analyzeDeveloperProfile(
  username: string,
  corridor: string
): Promise<DeveloperProfile | null> {
  try {
    // Fetch user profile
    const { data: user } = await octokit.users.getByUsername({ username });

    // Fetch user's repositories
    const { data: repos } = await octokit.repos.listForUser({
      username,
      type: 'owner',
      sort: 'updated',
      per_page: 100,
    });

    // Calculate total stars and forks
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

    // Skip if below minimum thresholds
    if (totalStars < MIN_TOTAL_STARS) {
      return null;
    }

    // Calculate top languages
    const languageCounts: Record<string, number> = {};
    for (const repo of repos) {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
    }
    const topLanguages = Object.entries(languageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([lang]) => lang);

    // Calculate contribution score
    const contributionScore = calculateContributionScore(user, repos);

    // Calculate quality score (0-100)
    const qualityScore = calculateQualityScore({
      publicRepos: user.public_repos,
      followers: user.followers,
      totalStars,
      totalForks,
      contributionScore,
      accountAge: getAccountAge(user.created_at),
      topLanguages,
    });

    // Build developer profile
    const profile: DeveloperProfile = {
      // Basic Info
      username: user.login,
      name: user.name || user.login,
      email: user.email || '',
      location: user.location || '',
      bio: user.bio || '',
      githubUrl: user.html_url,
      avatarUrl: user.avatar_url,
      blog: user.blog || '',
      twitter: user.twitter_username || '',
      
      // Metrics
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      totalStars,
      totalForks,
      contributionScore,
      
      // Languages
      topLanguages,
      
      // Scoring
      qualityScore,
      
      // Metadata
      accountAge: getAccountAge(user.created_at),
      lastActive: user.updated_at,
      corridor,
    };

    return profile;
  } catch (error) {
    console.error(`Error analyzing ${username}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// ============================================================================
// Scoring Algorithms
// ============================================================================

function calculateContributionScore(user: GitHubUser, repos: any[]): number {
  let score = 0;

  // Active repos (updated in last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const activeRepos = repos.filter(
    (repo) => new Date(repo.updated_at) > sixMonthsAgo
  ).length;
  score += Math.min(activeRepos * 5, 30); // Max 30 points

  // Repo quality (stars per repo)
  const avgStarsPerRepo = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0) / repos.length;
  score += Math.min(avgStarsPerRepo * 2, 20); // Max 20 points

  // Consistency (repos spread over time)
  const yearsSinceCreation = getAccountAge(user.created_at);
  const reposPerYear = user.public_repos / yearsSinceCreation;
  score += Math.min(reposPerYear * 2, 20); // Max 20 points

  return Math.round(score);
}

function calculateQualityScore(params: {
  publicRepos: number;
  followers: number;
  totalStars: number;
  totalForks: number;
  contributionScore: number;
  accountAge: number;
  topLanguages: string[];
}): number {
  let score = 0;

  // Public repos (0-15 points)
  score += Math.min(params.publicRepos / 2, 15);

  // Followers (0-15 points)
  score += Math.min(params.followers / 10, 15);

  // Total stars (0-20 points)
  score += Math.min(params.totalStars / 5, 20);

  // Total forks (0-10 points)
  score += Math.min(params.totalForks / 3, 10);

  // Contribution score (0-20 points)
  score += Math.min(params.contributionScore / 3, 20);

  // Account age (0-10 points, bonus for established accounts)
  if (params.accountAge >= 3) {
    score += 10;
  } else if (params.accountAge >= 2) {
    score += 7;
  } else if (params.accountAge >= 1) {
    score += 5;
  }

  // Tech stack match (0-10 points)
  const highDemandLanguages = ['TypeScript', 'Go', 'Rust', 'Kotlin', 'Python'];
  const matchCount = params.topLanguages.filter((lang) =>
    highDemandLanguages.includes(lang)
  ).length;
  score += Math.min(matchCount * 2, 10);

  return Math.round(Math.min(score, 100));
}

// ============================================================================
// Utility Functions
// ============================================================================

function getAccountAge(createdAt: string): number {
  const accountDate = new Date(createdAt);
  const now = new Date();
  const diffInMs = now.getTime() - accountDate.getTime();
  const diffInYears = diffInMs / (1000 * 60 * 60 * 24 * 365);
  return Math.round(diffInYears * 10) / 10; // Round to 1 decimal
}

function deduplicateDevelopers(developers: DeveloperProfile[]): DeveloperProfile[] {
  const seen = new Set<string>();
  const unique: DeveloperProfile[] = [];

  for (const dev of developers) {
    if (!seen.has(dev.username)) {
      seen.add(dev.username);
      unique.push(dev);
    }
  }

  return unique;
}

function calculateAverageScore(developers: DeveloperProfile[]): number {
  if (developers.length === 0) return 0;
  const sum = developers.reduce((acc, dev) => acc + dev.qualityScore, 0);
  return Math.round(sum / developers.length);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Export Functions
// ============================================================================

function exportToCSV(developers: DeveloperProfile[], corridor: string): string {
  const fields = [
    'username',
    'name',
    'email',
    'location',
    'githubUrl',
    'qualityScore',
    'publicRepos',
    'followers',
    'totalStars',
    'topLanguages',
    'bio',
    'blog',
    'twitter',
  ];

  const csv = parse(developers, { fields });

  const outputDir = path.join(__dirname, '../../output/talent');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${corridor}_developers_${timestamp}.csv`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, csv);

  console.log(`\n📄 Exported to: ${filepath}`);
  return filepath;
}

function exportToJSON(developers: DeveloperProfile[], corridor: string): string {
  const outputDir = path.join(__dirname, '../../output/talent');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${corridor}_developers_${timestamp}.json`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(developers, null, 2));

  console.log(`📄 Exported to: ${filepath}`);
  return filepath;
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const corridorArg = args.find((arg) => arg.startsWith('--corridor='))?.split('=')[1];
  const limitArg = args.find((arg) => arg.startsWith('--limit='))?.split('=')[1];

  if (!corridorArg) {
    console.error('❌ Error: --corridor argument required');
    console.log('\nUsage:');
    console.log('  npm run scrape:github -- --corridor=lagos --limit=100');
    console.log('  npm run scrape:github -- --corridor=nairobi --limit=100');
    console.log('  npm run scrape:github -- --corridor=saopaulo --limit=100');
    process.exit(1);
  }

  const corridor = corridorArg.toLowerCase();
  const limit = limitArg ? parseInt(limitArg, 10) : 100;

  if (!GITHUB_TOKEN) {
    console.error('❌ Error: GITHUB_TOKEN environment variable not set');
    console.log('\nPlease set your GitHub personal access token:');
    console.log('  export GITHUB_TOKEN=your_token_here');
    console.log('\nGenerate a token at: https://github.com/settings/tokens');
    process.exit(1);
  }

  try {
    const developers = await scrapeGitHubCorridor(corridor, limit);

    if (developers.length === 0) {
      console.log('\n⚠️  No developers found matching criteria');
      process.exit(0);
    }

    // Export to both CSV and JSON
    exportToCSV(developers, corridor);
    exportToJSON(developers, corridor);

    // Print summary
    console.log('\n📊 Summary:');
    console.log(`   Total developers: ${developers.length}`);
    console.log(`   Average quality score: ${calculateAverageScore(developers)}/100`);
    console.log(`   Top languages: ${getTopLanguages(developers).join(', ')}`);
    console.log(`   Average followers: ${getAverageFollowers(developers)}`);
    console.log(`   Average stars: ${getAverageTotalStars(developers)}`);

    console.log('\n✅ Scraping complete!');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

function getTopLanguages(developers: DeveloperProfile[]): string[] {
  const languageCounts: Record<string, number> = {};
  for (const dev of developers) {
    for (const lang of dev.topLanguages) {
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    }
  }
  return Object.entries(languageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([lang]) => lang);
}

function getAverageFollowers(developers: DeveloperProfile[]): number {
  const sum = developers.reduce((acc, dev) => acc + dev.followers, 0);
  return Math.round(sum / developers.length);
}

function getAverageTotalStars(developers: DeveloperProfile[]): number {
  const sum = developers.reduce((acc, dev) => acc + dev.totalStars, 0);
  return Math.round(sum / developers.length);
}

// ============================================================================
// Execute
// ============================================================================

if (require.main === module) {
  main();
}

export { scrapeGitHubCorridor, analyzeDeveloperProfile, DeveloperProfile };
