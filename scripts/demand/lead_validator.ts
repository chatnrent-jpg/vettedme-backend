/**
 * ============================================================================
 * VETTED - Inbound Lead Hydration & Scoring Validator
 * ============================================================================
 * 
 * Purpose: Validate and score scraped CSV lead data from Apollo.io/LinkedIn
 * before importing into database or outreach platform
 * 
 * Features:
 * - Email syntax validation & domain filtering
 * - Duplicate detection across datasets
 * - Lead scoring algorithm (0-100) based on firmographic parameters
 * - Company enrichment (funding, tech stack, growth signals)
 * - Export to clean CSV for outreach platforms
 * 
 * Usage:
 *   npm run validate:leads -- --input=apollo_export.csv --output=validated_leads.csv
 * 
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import axios from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const CLEARBIT_API_KEY = process.env.CLEARBIT_API_KEY || '';
const HUNTER_API_KEY = process.env.HUNTER_API_KEY || '';

// Generic email domains to filter out
const GENERIC_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'mail.com',
  'zoho.com',
];

// Target job titles
const VALID_JOB_TITLES = [
  'cto',
  'chief technology officer',
  'vp of engineering',
  'vp engineering',
  'head of engineering',
  'director of engineering',
  'engineering director',
  'co-founder',
  'founder',
  'technical co-founder',
  'cto & founder',
  'engineering manager',
];

// Target industries
const HIGH_VALUE_INDUSTRIES = [
  'fintech',
  'saas',
  'software',
  'healthtech',
  'web3',
  'blockchain',
  'crypto',
  'proptech',
  'edtech',
  'cloud',
];

// Target locations (US, UK, Eurozone)
const VALID_LOCATIONS = [
  'united states',
  'us',
  'usa',
  'united kingdom',
  'uk',
  'england',
  'germany',
  'de',
  'france',
  'fr',
  'netherlands',
  'nl',
  'spain',
  'es',
  'italy',
  'it',
  'ireland',
  'ie',
  'switzerland',
  'ch',
  'belgium',
  'be',
  'austria',
  'at',
];

// ============================================================================
// Types
// ============================================================================

interface RawLead {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  companyName: string;
  companySize: string;
  industry: string;
  location: string;
  linkedinUrl?: string;
  companyWebsite?: string;
  fundingStage?: string;
  fundingAmount?: string;
  lastFundingDate?: string;
  techStack?: string;
}

interface ValidatedLead extends RawLead {
  isValid: boolean;
  validationErrors: string[];
  leadScore: number;
  leadTier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4';
  scoreBreakdown: {
    firmographic: number;
    technographic: number;
    behavioral: number;
  };
}

interface ValidationStats {
  totalProcessed: number;
  valid: number;
  invalid: number;
  duplicates: number;
  genericDomains: number;
  invalidEmails: number;
  wrongJobTitle: number;
  wrongCompanySize: number;
  wrongLocation: number;
  averageScore: number;
}

// ============================================================================
// Email Validation
// ============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isGenericDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return GENERIC_DOMAINS.includes(domain);
}

async function verifyEmailWithHunter(email: string): Promise<boolean> {
  if (!HUNTER_API_KEY) {
    return true; // Skip verification if no API key
  }

  try {
    const response = await axios.get('https://api.hunter.io/v2/email-verifier', {
      params: {
        email,
        api_key: HUNTER_API_KEY,
      },
    });

    const status = response.data?.data?.status;
    return status === 'valid' || status === 'accept_all';
  } catch (error) {
    console.warn(`Hunter.io verification failed for ${email}:`, error instanceof Error ? error.message : 'Unknown error');
    return true; // Assume valid if API fails
  }
}

// ============================================================================
// Job Title Validation
// ============================================================================

function isValidJobTitle(jobTitle: string): boolean {
  const normalized = jobTitle.toLowerCase().trim();
  return VALID_JOB_TITLES.some((validTitle) => normalized.includes(validTitle));
}

// ============================================================================
// Company Validation
// ============================================================================

function isValidCompanySize(companySize: string | number): boolean {
  const size = typeof companySize === 'string' ? parseInt(companySize, 10) : companySize;
  return !isNaN(size) && size >= 50 && size <= 500;
}

function isValidLocation(location: string): boolean {
  const normalized = location.toLowerCase().trim();
  return VALID_LOCATIONS.some((validLocation) => normalized.includes(validLocation));
}

function isHighValueIndustry(industry: string): boolean {
  const normalized = industry.toLowerCase().trim();
  return HIGH_VALUE_INDUSTRIES.some((highValueIndustry) => normalized.includes(highValueIndustry));
}

// ============================================================================
// Lead Scoring Algorithm (0-100)
// ============================================================================

function calculateLeadScore(lead: RawLead): {
  score: number;
  breakdown: { firmographic: number; technographic: number; behavioral: number };
} {
  let firmographicScore = 0;
  let technographicScore = 0;
  let behavioralScore = 0;

  // ============================================================================
  // Firmographic Score (0-50 points)
  // ============================================================================

  // Company Size (0-15 points)
  const companySize = parseInt(lead.companySize, 10);
  if (companySize >= 50 && companySize <= 100) {
    firmographicScore += 15; // Sweet spot
  } else if (companySize > 100 && companySize <= 200) {
    firmographicScore += 12;
  } else if (companySize > 200 && companySize <= 500) {
    firmographicScore += 10;
  } else if (companySize > 500) {
    firmographicScore += 5; // Too large
  }

  // Funding Stage (0-15 points)
  const fundingStage = lead.fundingStage?.toLowerCase() || '';
  if (fundingStage.includes('series b') || fundingStage.includes('series c')) {
    firmographicScore += 15;
  } else if (fundingStage.includes('series a')) {
    firmographicScore += 12;
  } else if (fundingStage.includes('seed')) {
    firmographicScore += 8;
  } else if (fundingStage.includes('bootstrap')) {
    firmographicScore += 5;
  }

  // Industry Match (0-10 points)
  const industry = lead.industry?.toLowerCase() || '';
  if (
    industry.includes('fintech') ||
    industry.includes('saas') ||
    industry.includes('web3') ||
    industry.includes('blockchain')
  ) {
    firmographicScore += 10;
  } else if (industry.includes('healthtech') || industry.includes('proptech')) {
    firmographicScore += 8;
  } else if (industry.includes('software') || industry.includes('cloud')) {
    firmographicScore += 5;
  }

  // Geographic HQ (0-10 points)
  const location = lead.location?.toLowerCase() || '';
  if (location.includes('united states') || location.includes('us') || location.includes('usa')) {
    firmographicScore += 10;
  } else if (location.includes('united kingdom') || location.includes('uk')) {
    firmographicScore += 9;
  } else if (
    location.includes('germany') ||
    location.includes('france') ||
    location.includes('netherlands')
  ) {
    firmographicScore += 8;
  } else if (VALID_LOCATIONS.some((loc) => location.includes(loc))) {
    firmographicScore += 5;
  }

  // ============================================================================
  // Technographic Score (0-30 points)
  // ============================================================================

  // Tech Stack Match (0-15 points)
  const techStack = lead.techStack?.toLowerCase() || '';
  if (
    techStack.includes('typescript') ||
    techStack.includes('react') ||
    techStack.includes('go') ||
    techStack.includes('rust')
  ) {
    technographicScore += 15;
  } else if (techStack.includes('python') || techStack.includes('java')) {
    technographicScore += 10;
  } else if (techStack.includes('php') || techStack.includes('.net')) {
    technographicScore += 5;
  }

  // Engineering Team Size (0-10 points) - Estimate from company size
  const engTeamSize = Math.floor(companySize * 0.3); // Assume 30% are engineers
  if (engTeamSize >= 25 && engTeamSize <= 75) {
    technographicScore += 10;
  } else if (engTeamSize >= 10 && engTeamSize < 25) {
    technographicScore += 8;
  } else if (engTeamSize > 75 && engTeamSize <= 100) {
    technographicScore += 6;
  } else {
    technographicScore += 3;
  }

  // Remote Work Policy (0-5 points) - Inferred from LinkedIn bio
  // (Would need to scrape LinkedIn or Clearbit for this)
  // For now, default to 3 points (assume hybrid)
  technographicScore += 3;

  // ============================================================================
  // Behavioral Score (0-20 points)
  // ============================================================================

  // Recent Funding (0-10 points)
  if (lead.lastFundingDate) {
    const fundingDate = new Date(lead.lastFundingDate);
    const now = new Date();
    const monthsSinceFunding = (now.getTime() - fundingDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (monthsSinceFunding <= 6) {
      behavioralScore += 10;
    } else if (monthsSinceFunding <= 12) {
      behavioralScore += 7;
    } else if (monthsSinceFunding <= 24) {
      behavioralScore += 4;
    }
  }

  // Active Hiring (0-5 points) - Would need to check job board APIs
  // For now, default to 3 points
  behavioralScore += 3;

  // LinkedIn Activity (0-5 points) - Would need LinkedIn scraping
  // For now, default to 3 points
  behavioralScore += 3;

  // ============================================================================
  // Total Score
  // ============================================================================

  const totalScore = Math.min(firmographicScore + technographicScore + behavioralScore, 100);

  return {
    score: Math.round(totalScore),
    breakdown: {
      firmographic: firmographicScore,
      technographic: technographicScore,
      behavioral: behavioralScore,
    },
  };
}

function getLeadTier(score: number): 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4' {
  if (score >= 85) return 'Tier 1';
  if (score >= 70) return 'Tier 2';
  if (score >= 55) return 'Tier 3';
  return 'Tier 4';
}

// ============================================================================
// Lead Validation
// ============================================================================

async function validateLead(lead: RawLead): Promise<ValidatedLead> {
  const errors: string[] = [];
  let isValid = true;

  // Email validation
  if (!isValidEmail(lead.email)) {
    errors.push('Invalid email syntax');
    isValid = false;
  }

  if (isGenericDomain(lead.email)) {
    errors.push('Generic email domain (gmail, yahoo, etc.)');
    isValid = false;
  }

  // Job title validation
  if (!isValidJobTitle(lead.jobTitle)) {
    errors.push('Job title does not match target list');
    isValid = false;
  }

  // Company size validation
  if (!isValidCompanySize(lead.companySize)) {
    errors.push('Company size not in range (50-500 employees)');
    isValid = false;
  }

  // Location validation
  if (!isValidLocation(lead.location)) {
    errors.push('Location not in target geographies (US, UK, Eurozone)');
    isValid = false;
  }

  // Calculate lead score
  const { score, breakdown } = calculateLeadScore(lead);
  const tier = getLeadTier(score);

  return {
    ...lead,
    isValid,
    validationErrors: errors,
    leadScore: score,
    leadTier: tier,
    scoreBreakdown: breakdown,
  };
}

// ============================================================================
// Duplicate Detection
// ============================================================================

function detectDuplicates(leads: ValidatedLead[]): Set<string> {
  const seen = new Map<string, number>();
  const duplicates = new Set<string>();

  for (const lead of leads) {
    const key = lead.email.toLowerCase();
    if (seen.has(key)) {
      duplicates.add(key);
    } else {
      seen.set(key, 1);
    }
  }

  return duplicates;
}

// ============================================================================
// CSV Processing
// ============================================================================

function parseCSV(filepath: string): RawLead[] {
  const content = fs.readFileSync(filepath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((record: any) => ({
    firstName: record.firstName || record.first_name || record['First Name'] || '',
    lastName: record.lastName || record.last_name || record['Last Name'] || '',
    email: record.email || record.Email || '',
    jobTitle: record.jobTitle || record.job_title || record['Job Title'] || '',
    companyName: record.companyName || record.company_name || record['Company Name'] || '',
    companySize: record.companySize || record.company_size || record['Company Size'] || '0',
    industry: record.industry || record.Industry || '',
    location: record.location || record.Location || '',
    linkedinUrl: record.linkedinUrl || record.linkedin_url || record['LinkedIn URL'] || '',
    companyWebsite: record.companyWebsite || record.company_website || record['Company Website'] || '',
    fundingStage: record.fundingStage || record.funding_stage || record['Funding Stage'] || '',
    fundingAmount: record.fundingAmount || record.funding_amount || record['Funding Amount'] || '',
    lastFundingDate: record.lastFundingDate || record.last_funding_date || record['Last Funding Date'] || '',
    techStack: record.techStack || record.tech_stack || record['Tech Stack'] || '',
  }));
}

function exportToCSV(leads: ValidatedLead[], filepath: string): void {
  const csvContent = stringify(leads, {
    header: true,
    columns: [
      'firstName',
      'lastName',
      'email',
      'jobTitle',
      'companyName',
      'companySize',
      'industry',
      'location',
      'linkedinUrl',
      'companyWebsite',
      'fundingStage',
      'fundingAmount',
      'lastFundingDate',
      'techStack',
      'leadScore',
      'leadTier',
      'isValid',
      'validationErrors',
    ],
  });

  fs.writeFileSync(filepath, csvContent);
}

// ============================================================================
// Main Validation Function
// ============================================================================

async function validateLeads(inputFile: string, outputFile: string): Promise<ValidationStats> {
  console.log('\n🔍 VETTED Lead Validator');
  console.log('='.repeat(60));
  console.log(`Input:  ${inputFile}`);
  console.log(`Output: ${outputFile}\n`);

  // Parse CSV
  console.log('📄 Parsing CSV...');
  const rawLeads = parseCSV(inputFile);
  console.log(`   Found ${rawLeads.length} leads\n`);

  // Validate each lead
  console.log('✅ Validating leads...');
  const validatedLeads: ValidatedLead[] = [];
  for (let i = 0; i < rawLeads.length; i++) {
    const lead = rawLeads[i];
    const validated = await validateLead(lead);
    validatedLeads.push(validated);

    if ((i + 1) % 50 === 0) {
      console.log(`   Processed ${i + 1}/${rawLeads.length} leads...`);
    }
  }
  console.log(`   Processed ${rawLeads.length}/${rawLeads.length} leads ✓\n`);

  // Detect duplicates
  console.log('🔍 Detecting duplicates...');
  const duplicates = detectDuplicates(validatedLeads);
  console.log(`   Found ${duplicates.size} duplicate emails\n`);

  // Calculate statistics
  const stats: ValidationStats = {
    totalProcessed: validatedLeads.length,
    valid: validatedLeads.filter((l) => l.isValid).length,
    invalid: validatedLeads.filter((l) => !l.isValid).length,
    duplicates: duplicates.size,
    genericDomains: validatedLeads.filter((l) => isGenericDomain(l.email)).length,
    invalidEmails: validatedLeads.filter((l) => !isValidEmail(l.email)).length,
    wrongJobTitle: validatedLeads.filter((l) => !isValidJobTitle(l.jobTitle)).length,
    wrongCompanySize: validatedLeads.filter((l) => !isValidCompanySize(l.companySize)).length,
    wrongLocation: validatedLeads.filter((l) => !isValidLocation(l.location)).length,
    averageScore:
      validatedLeads.reduce((sum, l) => sum + l.leadScore, 0) / validatedLeads.length,
  };

  // Export to CSV
  console.log('💾 Exporting validated leads...');
  exportToCSV(validatedLeads, outputFile);
  console.log(`   Exported to ${outputFile} ✓\n`);

  // Print statistics
  console.log('📊 Validation Statistics:');
  console.log('='.repeat(60));
  console.log(`Total Processed:       ${stats.totalProcessed}`);
  console.log(`Valid Leads:           ${stats.valid} (${Math.round((stats.valid / stats.totalProcessed) * 100)}%)`);
  console.log(`Invalid Leads:         ${stats.invalid} (${Math.round((stats.invalid / stats.totalProcessed) * 100)}%)`);
  console.log(`Duplicates:            ${stats.duplicates}`);
  console.log(`Generic Domains:       ${stats.genericDomains}`);
  console.log(`Invalid Emails:        ${stats.invalidEmails}`);
  console.log(`Wrong Job Title:       ${stats.wrongJobTitle}`);
  console.log(`Wrong Company Size:    ${stats.wrongCompanySize}`);
  console.log(`Wrong Location:        ${stats.wrongLocation}`);
  console.log(`Average Lead Score:    ${Math.round(stats.averageScore)}/100`);
  console.log('='.repeat(60));

  // Score distribution
  console.log('\n📊 Lead Score Distribution:');
  console.log('='.repeat(60));
  const tier1 = validatedLeads.filter((l) => l.leadTier === 'Tier 1').length;
  const tier2 = validatedLeads.filter((l) => l.leadTier === 'Tier 2').length;
  const tier3 = validatedLeads.filter((l) => l.leadTier === 'Tier 3').length;
  const tier4 = validatedLeads.filter((l) => l.leadTier === 'Tier 4').length;

  console.log(`Tier 1 (85-100):       ${tier1} (${Math.round((tier1 / stats.totalProcessed) * 100)}%)`);
  console.log(`Tier 2 (70-84):        ${tier2} (${Math.round((tier2 / stats.totalProcessed) * 100)}%)`);
  console.log(`Tier 3 (55-69):        ${tier3} (${Math.round((tier3 / stats.totalProcessed) * 100)}%)`);
  console.log(`Tier 4 (<55):          ${tier4} (${Math.round((tier4 / stats.totalProcessed) * 100)}%)`);
  console.log('='.repeat(60));

  console.log('\n✅ Validation complete!\n');

  return stats;
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const inputArg = args.find((arg) => arg.startsWith('--input='))?.split('=')[1];
  const outputArg = args.find((arg) => arg.startsWith('--output='))?.split('=')[1];

  if (!inputArg || !outputArg) {
    console.error('❌ Error: Missing required arguments');
    console.log('\nUsage:');
    console.log('  npm run validate:leads -- --input=apollo_export.csv --output=validated_leads.csv');
    console.log('\nExample:');
    console.log('  npm run validate:leads -- --input=data/apollo_export.csv --output=data/validated_leads.csv');
    process.exit(1);
  }

  const inputFile = path.resolve(inputArg);
  const outputFile = path.resolve(outputArg);

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    await validateLeads(inputFile, outputFile);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// ============================================================================
// Execute
// ============================================================================

if (require.main === module) {
  main();
}

export { validateLeads, validateLead, calculateLeadScore, detectDuplicates };
