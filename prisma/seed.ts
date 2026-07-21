import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * VETTED Premium Investor Demo Seed Script
 * 
 * HIGH-FIDELITY DATA FOR INVESTOR PRESENTATIONS
 * 
 * Generates exactly 5 premium tech contractor profiles across:
 * - Nigeria (2 contractors)
 * - Kenya (2 contractors)
 * - Brazil (1 contractor)
 * 
 * Includes:
 * - Complete user profiles with GitHub tracking hashes
 * - Real-looking technical capability scores
 * - Biometric logs with verified Smile ID/Persona sessions
 * - Pass tokens and timestamp histories
 * - Active Airwallex ledger string identifiers
 * - Sub-account states
 * - 3 historical milestone payments marked as COMPLETED
 * - 1 active contract sitting securely in CAPITAL_ESCROWED (ready for release demo)
 * 
 * Usage: npm run db:seed
 */

// Helper: Generate realistic GitHub commit hash
function generateGitHubHash(): string {
  return crypto.randomBytes(20).toString('hex');
}

// Helper: Generate realistic Airwallex account ID
function generateAirwallexAccountId(region: string): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `aw_acc_${region}_${timestamp}_${random}`;
}

// Helper: Generate Smile ID session token
function generateSmileIdToken(): string {
  return `smile_token_${crypto.randomBytes(16).toString('hex')}`;
}

async function main() {
  console.log('\n' + '═'.repeat(80));
  console.log('🎯 VETTED PREMIUM INVESTOR DEMO SEED SCRIPT');
  console.log('High-Fidelity Data for Enterprise Presentations');
  console.log('═'.repeat(80) + '\n');

  // ========================================================================
  // 1. CREATE BUSINESS CLIENTS (ENTERPRISE BUYERS)
  // ========================================================================
  console.log('👔 Creating Enterprise Business Clients...');

  const businessPassword = await bcrypt.hash('business123', 10);

  const techVentures = await prisma.user.upsert({
    where: { email: 'sarah.chen@techventures.io' },
    update: {},
    create: {
      email: 'sarah.chen@techventures.io',
      passwordHash: businessPassword,
      role: 'BUSINESS',
      firstName: 'Sarah',
      lastName: 'Chen',
      phoneNumber: '+1 415 555 0123',
      location: 'San Francisco, CA, USA',
      timezone: 'America/Los_Angeles',
      isActive: true,
      isVerified: true,
      lastLoginAt: new Date(),
    },
  });
  console.log('  ✓ TechVentures Inc. (San Francisco) - CTO: Sarah Chen');

  const dubaiBiz = await prisma.user.upsert({
    where: { email: 'omar.hassan@dubaiventures.ae' },
    update: {},
    create: {
      email: 'omar.hassan@dubaiventures.ae',
      passwordHash: businessPassword,
      role: 'BUSINESS',
      firstName: 'Omar',
      lastName: 'Hassan',
      phoneNumber: '+971 4 123 4567',
      location: 'Dubai, UAE',
      timezone: 'Asia/Dubai',
      isActive: true,
      isVerified: true,
      lastLoginAt: new Date(),
    },
  });
  console.log('  ✓ Dubai Ventures LLC (UAE) - CTO: Omar Hassan');

  // ========================================================================
  // 2. CREATE 5 PREMIUM TECH CONTRACTOR PROFILES
  // ========================================================================
  console.log('\n🌍 Creating 5 Premium Tech Contractor Profiles...\n');

  const talentPassword = await bcrypt.hash('talent123', 10);

  // ------------------------------------------------------------------------
  // CONTRACTOR 1: Chidi Okafor (Nigeria) - Full Stack Engineer
  // ------------------------------------------------------------------------
  const chidi = await prisma.user.create({
    data: {
      email: 'chidi.okafor@techpro.ng',
      passwordHash: talentPassword,
      role: 'TALENT',
      firstName: 'Chidi',
      lastName: 'Okafor',
      phoneNumber: '+234 803 789 4561',
      location: 'Lagos, Nigeria',
      timezone: 'Africa/Lagos',
      isActive: true,
      isVerified: true,
      lastLoginAt: new Date(),
    },
  });

  const chidiGitHubHash = generateGitHubHash();
  const chidiPassport = await prisma.vettedMEPassport.create({
    data: {
      userId: chidi.id,
      passportId: `VETTED-NG-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      verificationStatus: 'BIOMETRIC_PASSED',
      trustScore: 94,
      smileIdUserId: `smile_ng_user_${crypto.randomBytes(8).toString('hex')}`,
      smileIdJobId: `smile_job_${crypto.randomBytes(8).toString('hex')}`,
      biometricHash: crypto.createHash('sha256').update(`chidi_baseline_${Date.now()}`).digest('hex'),
      kycData: {
        nin: '12345678901',
        firstName: 'CHIDI',
        lastName: 'OKAFOR',
        dateOfBirth: '1995-03-15',
        photoUrl: 'https://cdn.vettedme.com/profiles/chidi_okafor.jpg',
        bankAccountNumber: '0123456789',
        bankName: 'Access Bank Nigeria',
        bankCode: '044',
        githubTrackingHash: chidiGitHubHash, // Mock GitHub tracking hash
      },
      governmentIdType: 'NIN',
      governmentIdNumber: '12345678901',
      governmentIdVerified: true,
      faceMatchScore: 0.97,
      livenessCheckPassed: true,
      lastBiometricScanAt: new Date('2026-07-15T10:30:00Z'),
      publicProfileUrl: `https://vettedme.com/passport/${chidiPassport.passportId}`,
      linkedinUrl: 'https://linkedin.com/in/chidiokafor',
      githubUrl: 'https://github.com/chidiokafor',
      primarySkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
      yearsOfExperience: 5,
      hourlyRateUSD: 45.00,
      contractsCompleted: 12,
      totalEarnedUSD: 84500.00,
      averageRating: 4.8,
      onTimeDeliveryRate: 95.5,
      verifiedAt: new Date('2026-06-10T14:00:00Z'),
    },
  });

  // Biometric Log for Chidi
  await prisma.biometricVerification.create({
    data: {
      userId: chidi.id,
      passportId: chidiPassport.id,
      verificationType: 'INITIAL_ONBOARDING',
      sessionId: generateSmileIdToken(),
      confidence: 0.97,
      livenessDetected: true,
      matchResult: 'PASS',
      verificationProvider: 'SMILE_ID',
      verificationTimestamp: new Date('2026-06-10T14:00:00Z'),
      deviceFingerprint: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ipAddress: '197.210.85.123',
      geoLocation: 'Lagos, Nigeria',
      metadata: {
        passToken: generateSmileIdToken(),
        sessionDuration: 45,
        attemptNumber: 1,
      },
    },
  });

  console.log(`  ✓ Chidi Okafor (Nigeria) - Full Stack Engineer`);
  console.log(`     Trust Score: 94% | GitHub Hash: ${chidiGitHubHash.substring(0, 12)}...`);
  console.log(`     Passport ID: ${chidiPassport.passportId}`);

  // ------------------------------------------------------------------------
  // CONTRACTOR 2: Amara Nwankwo (Nigeria) - Backend Python Engineer
  // ------------------------------------------------------------------------
  const amara = await prisma.user.create({
    data: {
      email: 'amara.nwankwo@devpro.ng',
      passwordHash: talentPassword,
      role: 'TALENT',
      firstName: 'Amara',
      lastName: 'Nwankwo',
      phoneNumber: '+234 802 654 9870',
      location: 'Abuja, Nigeria',
      timezone: 'Africa/Lagos',
      isActive: true,
      isVerified: true,
      lastLoginAt: new Date(),
    },
  });

  const amaraGitHubHash = generateGitHubHash();
  const amaraPassport = await prisma.vettedMEPassport.create({
    data: {
      userId: amara.id,
      passportId: `VETTED-NG-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      verificationStatus: 'BIOMETRIC_PASSED',
      trustScore: 91,
      smileIdUserId: `smile_ng_user_${crypto.randomBytes(8).toString('hex')}`,
      smileIdJobId: `smile_job_${crypto.randomBytes(8).toString('hex')}`,
      biometricHash: crypto.createHash('sha256').update(`amara_baseline_${Date.now()}`).digest('hex'),
      kycData: {
        nin: '98765432109',
        firstName: 'AMARA',
        lastName: 'NWANKWO',
        dateOfBirth: '1997-08-22',
        photoUrl: 'https://cdn.vettedme.com/profiles/amara_nwankwo.jpg',
        bankAccountNumber: '9876543210',
        bankName: 'GTBank Nigeria',
        bankCode: '058',
        githubTrackingHash: amaraGitHubHash,
      },
      governmentIdType: 'NIN',
      governmentIdNumber: '98765432109',
      governmentIdVerified: true,
      faceMatchScore: 0.95,
      livenessCheckPassed: true,
      lastBiometricScanAt: new Date('2026-07-10T09:15:00Z'),
      publicProfileUrl: `https://vettedme.com/passport/${amaraPassport.passportId}`,
      githubUrl: 'https://github.com/amaranwankwo',
      primarySkills: ['Python', 'Django', 'PostgreSQL', 'AWS', 'DevOps', 'Docker'],
      yearsOfExperience: 4,
      hourlyRateUSD: 40.00,
      contractsCompleted: 8,
      totalEarnedUSD: 52000.00,
      averageRating: 4.7,
      onTimeDeliveryRate: 92.0,
      verifiedAt: new Date('2026-06-20T11:30:00Z'),
    },
  });

  // Biometric Log for Amara
  await prisma.biometricVerification.create({
    data: {
      userId: amara.id,
      passportId: amaraPassport.id,
      verificationType: 'INITIAL_ONBOARDING',
      sessionId: generateSmileIdToken(),
      confidence: 0.95,
      livenessDetected: true,
      matchResult: 'PASS',
      verificationProvider: 'SMILE_ID',
      verificationTimestamp: new Date('2026-06-20T11:30:00Z'),
      deviceFingerprint: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      ipAddress: '197.211.48.200',
      geoLocation: 'Abuja, Nigeria',
      metadata: {
        passToken: generateSmileIdToken(),
        sessionDuration: 38,
        attemptNumber: 1,
      },
    },
  });

  console.log(`  ✓ Amara Nwankwo (Nigeria) - Backend Python Engineer`);
  console.log(`     Trust Score: 91% | GitHub Hash: ${amaraGitHubHash.substring(0, 12)}...`);
  console.log(`     Passport ID: ${amaraPassport.passportId}`);

  // ------------------------------------------------------------------------
  // CONTRACTOR 3: Wanjiku Kamau (Kenya) - Mobile Engineer
  // ------------------------------------------------------------------------
  const wanjiku = await prisma.user.create({
    data: {
      email: 'wanjiku.kamau@techke.co',
      passwordHash: talentPassword,
      role: 'TALENT',
      firstName: 'Wanjiku',
      lastName: 'Kamau',
      phoneNumber: '+254 712 345 678',
      location: 'Nairobi, Kenya',
      timezone: 'Africa/Nairobi',
      isActive: true,
      isVerified: true,
      lastLoginAt: new Date(),
    },
  });

  const wanjikuGitHubHash = generateGitHubHash();
  const wanjikuPassport = await prisma.vettedMEPassport.create({
    data: {
      userId: wanjiku.id,
      passportId: `VETTED-KE-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      verificationStatus: 'BIOMETRIC_PASSED',
      trustScore: 92,
      smileIdUserId: `smile_ke_user_${crypto.randomBytes(8).toString('hex')}`,
      smileIdJobId: `smile_job_${crypto.randomBytes(8).toString('hex')}`,
      biometricHash: crypto.createHash('sha256').update(`wanjiku_baseline_${Date.now()}`).digest('hex'),
      kycData: {
        nationalId: 'KE-33445566',
        firstName: 'WANJIKU',
        lastName: 'KAMAU',
        dateOfBirth: '1994-05-10',
        photoUrl: 'https://cdn.vettedme.com/profiles/wanjiku_kamau.jpg',
        bankAccountNumber: '1234567890123',
        bankName: 'Equity Bank Kenya',
        bankCode: '068',
        githubTrackingHash: wanjikuGitHubHash,
      },
      governmentIdType: 'NATIONAL_ID',
      governmentIdNumber: 'KE-33445566',
      governmentIdVerified: true,
      faceMatchScore: 0.96,
      livenessCheckPassed: true,
      lastBiometricScanAt: new Date('2026-07-05T13:20:00Z'),
      publicProfileUrl: `https://vettedme.com/passport/${wanjikuPassport.passportId}`,
      githubUrl: 'https://github.com/wanjikukamau',
      primarySkills: ['Kotlin', 'Android', 'Java', 'Firebase', 'RESTful APIs', 'Jetpack Compose'],
      yearsOfExperience: 6,
      hourlyRateUSD: 50.00,
      contractsCompleted: 15,
      totalEarnedUSD: 110000.00,
      averageRating: 4.9,
      onTimeDeliveryRate: 97.0,
      verifiedAt: new Date('2026-06-05T10:00:00Z'),
    },
  });

  // Biometric Log for Wanjiku
  await prisma.biometricVerification.create({
    data: {
      userId: wanjiku.id,
      passportId: wanjikuPassport.id,
      verificationType: 'INITIAL_ONBOARDING',
      sessionId: generateSmileIdToken(),
      confidence: 0.96,
      livenessDetected: true,
      matchResult: 'PASS',
      verificationProvider: 'SMILE_ID',
      verificationTimestamp: new Date('2026-06-05T10:00:00Z'),
      deviceFingerprint: 'Mozilla/5.0 (Linux; Android 12; Pixel 6)',
      ipAddress: '196.201.214.45',
      geoLocation: 'Nairobi, Kenya',
      metadata: {
        passToken: generateSmileIdToken(),
        sessionDuration: 42,
        attemptNumber: 1,
      },
    },
  });

  console.log(`  ✓ Wanjiku Kamau (Kenya) - Mobile Android Engineer`);
  console.log(`     Trust Score: 92% | GitHub Hash: ${wanjikuGitHubHash.substring(0, 12)}...`);
  console.log(`     Passport ID: ${wanjikuPassport.passportId}`);

  // ------------------------------------------------------------------------
  // CONTRACTOR 4: David Omondi (Kenya) - Frontend Engineer
  // ------------------------------------------------------------------------
  const david = await prisma.user.create({
    data: {
      email: 'david.omondi@webke.io',
      passwordHash: talentPassword,
      role: 'TALENT',
      firstName: 'David',
      lastName: 'Omondi',
      phoneNumber: '+254 720 987 654',
      location: 'Mombasa, Kenya',
      timezone: 'Africa/Nairobi',
      isActive: true,
      isVerified: true,
      lastLoginAt: new Date(),
    },
  });

  const davidGitHubHash = generateGitHubHash();
  const davidPassport = await prisma.vettedMEPassport.create({
    data: {
      userId: david.id,
      passportId: `VETTED-KE-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      verificationStatus: 'BIOMETRIC_PASSED',
      trustScore: 89,
      smileIdUserId: `smile_ke_user_${crypto.randomBytes(8).toString('hex')}`,
      smileIdJobId: `smile_job_${crypto.randomBytes(8).toString('hex')}`,
      biometricHash: crypto.createHash('sha256').update(`david_baseline_${Date.now()}`).digest('hex'),
      kycData: {
        nationalId: 'KE-77889900',
        firstName: 'DAVID',
        lastName: 'OMONDI',
        dateOfBirth: '1996-09-18',
        photoUrl: 'https://cdn.vettedme.com/profiles/david_omondi.jpg',
        bankAccountNumber: '9876543210987',
        bankName: 'KCB Bank Kenya',
        bankCode: '001',
        githubTrackingHash: davidGitHubHash,
      },
      governmentIdType: 'NATIONAL_ID',
      governmentIdNumber: 'KE-77889900',
      governmentIdVerified: true,
      faceMatchScore: 0.93,
      livenessCheckPassed: true,
      lastBiometricScanAt: new Date('2026-07-12T15:45:00Z'),
      publicProfileUrl: `https://vettedme.com/passport/${davidPassport.passportId}`,
      githubUrl: 'https://github.com/davidomondi',
      primarySkills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'GraphQL'],
      yearsOfExperience: 3,
      hourlyRateUSD: 38.00,
      contractsCompleted: 6,
      totalEarnedUSD: 34000.00,
      averageRating: 4.6,
      onTimeDeliveryRate: 90.0,
      verifiedAt: new Date('2026-07-01T12:00:00Z'),
    },
  });

  // Biometric Log for David
  await prisma.biometricVerification.create({
    data: {
      userId: david.id,
      passportId: davidPassport.id,
      verificationType: 'INITIAL_ONBOARDING',
      sessionId: generateSmileIdToken(),
      confidence: 0.93,
      livenessDetected: true,
      matchResult: 'PASS',
      verificationProvider: 'SMILE_ID',
      verificationTimestamp: new Date('2026-07-01T12:00:00Z'),
      deviceFingerprint: 'Mozilla/5.0 (X11; Linux x86_64)',
      ipAddress: '196.202.100.88',
      geoLocation: 'Mombasa, Kenya',
      metadata: {
        passToken: generateSmileIdToken(),
        sessionDuration: 50,
        attemptNumber: 1,
      },
    },
  });

  console.log(`  ✓ David Omondi (Kenya) - Frontend React Engineer`);
  console.log(`     Trust Score: 89% | GitHub Hash: ${davidGitHubHash.substring(0, 12)}...`);
  console.log(`     Passport ID: ${davidPassport.passportId}`);

  // ------------------------------------------------------------------------
  // CONTRACTOR 5: Rafael Silva (Brazil) - DevOps Engineer
  // ------------------------------------------------------------------------
  const rafael = await prisma.user.create({
    data: {
      email: 'rafael.silva@devops.br',
      passwordHash: talentPassword,
      role: 'TALENT',
      firstName: 'Rafael',
      lastName: 'Silva',
      phoneNumber: '+55 11 98765 4321',
      location: 'São Paulo, Brazil',
      timezone: 'America/Sao_Paulo',
      isActive: true,
      isVerified: true,
      lastLoginAt: new Date(),
    },
  });

  const rafaelGitHubHash = generateGitHubHash();
  const rafaelPassport = await prisma.vettedMEPassport.create({
    data: {
      userId: rafael.id,
      passportId: `VETTED-BR-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      verificationStatus: 'BIOMETRIC_PASSED',
      trustScore: 96,
      smileIdUserId: `smile_br_user_${crypto.randomBytes(8).toString('hex')}`,
      smileIdJobId: `smile_job_${crypto.randomBytes(8).toString('hex')}`,
      biometricHash: crypto.createHash('sha256').update(`rafael_baseline_${Date.now()}`).digest('hex'),
      kycData: {
        cpf: '123.456.789-00',
        firstName: 'RAFAEL',
        lastName: 'SILVA',
        dateOfBirth: '1992-11-20',
        photoUrl: 'https://cdn.vettedme.com/profiles/rafael_silva.jpg',
        bankAccountNumber: 'BR1234567890123456789012345',
        bankName: 'Banco do Brasil',
        bankCode: '001',
        githubTrackingHash: rafaelGitHubHash,
      },
      governmentIdType: 'CPF',
      governmentIdNumber: '123.456.789-00',
      governmentIdVerified: true,
      faceMatchScore: 0.98,
      livenessCheckPassed: true,
      lastBiometricScanAt: new Date('2026-07-18T16:00:00Z'),
      publicProfileUrl: `https://vettedme.com/passport/${rafaelPassport.passportId}`,
      githubUrl: 'https://github.com/rafaelsilva',
      primarySkills: ['Go', 'Kubernetes', 'Docker', 'Terraform', 'AWS', 'CI/CD'],
      yearsOfExperience: 8,
      hourlyRateUSD: 65.00,
      contractsCompleted: 22,
      totalEarnedUSD: 245000.00,
      averageRating: 4.9,
      onTimeDeliveryRate: 98.5,
      verifiedAt: new Date('2026-05-15T14:30:00Z'),
    },
  });

  // Biometric Log for Rafael
  await prisma.biometricVerification.create({
    data: {
      userId: rafael.id,
      passportId: rafaelPassport.id,
      verificationType: 'INITIAL_ONBOARDING',
      sessionId: generateSmileIdToken(),
      confidence: 0.98,
      livenessDetected: true,
      matchResult: 'PASS',
      verificationProvider: 'SMILE_ID',
      verificationTimestamp: new Date('2026-05-15T14:30:00Z'),
      deviceFingerprint: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      ipAddress: '189.45.201.100',
      geoLocation: 'São Paulo, Brazil',
      metadata: {
        passToken: generateSmileIdToken(),
        sessionDuration: 35,
        attemptNumber: 1,
      },
    },
  });

  console.log(`  ✓ Rafael Silva (Brazil) - DevOps / Cloud Engineer`);
  console.log(`     Trust Score: 96% | GitHub Hash: ${rafaelGitHubHash.substring(0, 12)}...`);
  console.log(`     Passport ID: ${rafaelPassport.passportId}`);

  // ========================================================================
  // 3. CREATE CONTRACTS WITH AIRWALLEX LEDGERS
  // ========================================================================
  console.log('\n💼 Creating Contracts with Airwallex Ledgers...\n');

  // ------------------------------------------------------------------------
  // CONTRACT 1: TechVentures + Chidi (COMPLETED - Historical Data)
  // ------------------------------------------------------------------------
  const contract1 = await prisma.contract.create({
    data: {
      contractNumber: 'CTR-2026-001',
      businessId: techVentures.id,
      talentId: chidi.id,
      projectName: 'E-commerce Platform Rebuild',
      projectDescription: 'Complete rebuild of legacy e-commerce platform using Next.js, TypeScript, PostgreSQL, Stripe',
      totalContractValueUSD: 15000.00,
      currency: 'USD',
      status: 'COMPLETED',
      startDate: new Date('2026-06-01'),
      expectedEndDate: new Date('2026-07-15'),
      actualEndDate: new Date('2026-07-15'),
      escrowFundedAt: new Date('2026-06-01'),
    },
  });

  const airwallex1 = generateAirwallexAccountId('us');
  const airwallex1Virtual = `aw_va_${crypto.randomBytes(12).toString('hex')}`;
  
  await prisma.airwallexSubAccount.create({
    data: {
      contractId: contract1.id,
      airwallexAccountId: airwallex1,
      airwallexVirtualAccountId: airwallex1Virtual,
      fundingAccountRoutingNumber: '121000248',
      fundingAccountAccountNumber: '4520789012345678',
      fundingAccountSwiftCode: 'AIRWUS33XXX',
      bankName: 'Airwallex US Inc.',
      bankAddress: '123 Market Street, San Francisco, CA 94103, USA',
      bankCountry: 'US',
      currency: 'USD',
      currentBalanceUSD: 0.00,
      availableBalanceUSD: 0.00,
      lockedBalanceUSD: 0.00,
      activatedAt: new Date('2026-06-01'),
    },
  });

  console.log(`  ✓ Contract 1: TechVentures → Chidi ($15,000 USD) [COMPLETED]`);
  console.log(`     Airwallex Account: ${airwallex1}`);
  console.log(`     Virtual Account: ${airwallex1Virtual}`);

  // ------------------------------------------------------------------------
  // CONTRACT 2: Dubai Ventures + Rafael (CAPITAL_ESCROWED - READY FOR DEMO)
  // ------------------------------------------------------------------------
  const contract2 = await prisma.contract.create({
    data: {
      contractNumber: 'CTR-2026-002',
      businessId: dubaiBiz.id,
      talentId: rafael.id,
      projectName: 'Cloud Infrastructure Migration',
      projectDescription: 'Migrate legacy on-premise infrastructure to AWS with Kubernetes orchestration, CI/CD pipelines, monitoring',
      totalContractValueUSD: 25000.00,
      currency: 'USD',
      status: 'CAPITAL_ESCROWED',
      startDate: new Date('2026-07-18'),
      expectedEndDate: new Date('2026-09-15'),
      escrowFundedAt: new Date('2026-07-18'),
    },
  });

  const airwallex2 = generateAirwallexAccountId('ae');
  const airwallex2Virtual = `aw_va_${crypto.randomBytes(12).toString('hex')}`;
  
  await prisma.airwallexSubAccount.create({
    data: {
      contractId: contract2.id,
      airwallexAccountId: airwallex2,
      airwallexVirtualAccountId: airwallex2Virtual,
      fundingAccountRoutingNumber: 'AE070331234567890123456',
      fundingAccountAccountNumber: '1234567890123456',
      fundingAccountSwiftCode: 'AIRWAE33XXX',
      bankName: 'Airwallex UAE Limited',
      bankAddress: 'Dubai International Financial Centre, UAE',
      bankCountry: 'AE',
      currency: 'USD',
      currentBalanceUSD: 25000.00,
      availableBalanceUSD: 25000.00,
      lockedBalanceUSD: 0.00,
      activatedAt: new Date('2026-07-18'),
    },
  });

  console.log(`  ✓ Contract 2: Dubai Ventures → Rafael ($25,000 USD) [CAPITAL_ESCROWED - READY FOR DEMO]`);
  console.log(`     Airwallex Account: ${airwallex2}`);
  console.log(`     Virtual Account: ${airwallex2Virtual}`);
  console.log(`     Status: ✅ Fully funded and ready for milestone release demonstration`);

  // ========================================================================
  // 4. CREATE 3 COMPLETED MILESTONE PAYMENTS (HISTORICAL DATA)
  // ========================================================================
  console.log('\n📊 Creating 3 Historical Milestone Payments (COMPLETED)...\n');

  const exchangeRate = 1650.50; // USD to NGN
  const platformFeeRate = 0.15;
  const fxSpreadRate = 0.005;

  // MILESTONE 1: Project Setup & Architecture (COMPLETED)
  const milestone1 = await prisma.milestone.create({
    data: {
      contractId: contract1.id,
      milestoneNumber: 1,
      title: 'Project Setup & Architecture',
      description: 'Initial project setup, architecture design, database schema, tech stack configuration',
      amountUSD: 5000.00,
      dueDate: new Date('2026-06-15'),
      status: 'PAID',
      complianceTaxFormSigned: true,
      submittedAt: new Date('2026-06-14T16:00:00Z'),
      approvedAt: new Date('2026-06-15T10:00:00Z'),
      handshakeCompletedAt: new Date('2026-06-15T10:05:00Z'),
      paidAt: new Date('2026-06-15T10:10:00Z'),
    },
  });

  const transaction1 = await prisma.paymentTransaction.create({
    data: {
      transactionNumber: `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      contractId: contract1.id,
      milestoneId: milestone1.id,
      transactionType: 'MILESTONE_PAYOUT',
      grossAmount: 5000.00,
      platformFee: 5000 * platformFeeRate,
      platformFeeRate: platformFeeRate,
      fxSpread: 5000 * fxSpreadRate,
      fxSpreadRate: fxSpreadRate,
      netAmount: 5000 - (5000 * platformFeeRate) - (5000 * fxSpreadRate),
      sourceCurrency: 'USD',
      targetCurrency: 'NGN',
      exchangeRate: exchangeRate,
      airwallexTransferId: `aw_transfer_${crypto.randomBytes(12).toString('hex')}`,
      airwallexReference: `AW-${contract1.contractNumber}-M1`,
      airwallexFee: 12.50,
      status: 'COMPLETED',
      paymentMethod: 'ACH',
      initiatedAt: new Date('2026-06-15T10:10:00Z'),
      processedAt: new Date('2026-06-15T10:12:00Z'),
      completedAt: new Date('2026-06-15T10:15:00Z'),
    },
  });

  // Add biometric log for milestone 1 handshake
  await prisma.biometricVerification.create({
    data: {
      userId: chidi.id,
      passportId: chidiPassport.id,
      verificationType: 'MILESTONE_HANDSHAKE',
      sessionId: generateSmileIdToken(),
      confidence: 0.97,
      livenessDetected: true,
      matchResult: 'PASS',
      verificationProvider: 'SMILE_ID',
      verificationTimestamp: new Date('2026-06-15T10:05:00Z'),
      deviceFingerprint: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '197.210.85.123',
      geoLocation: 'Lagos, Nigeria',
      metadata: {
        passToken: generateSmileIdToken(),
        milestoneId: milestone1.id,
        contractId: contract1.id,
        sessionDuration: 28,
      },
    },
  });

  console.log(`  ✓ Milestone 1: Project Setup ($5,000) [PAID]`);
  console.log(`     Transaction ID: ${transaction1.transactionNumber}`);
  console.log(`     Platform Revenue: $${(5000 * (platformFeeRate + fxSpreadRate)).toFixed(2)}`);

  // MILESTONE 2: Backend Development (COMPLETED)
  const milestone2 = await prisma.milestone.create({
    data: {
      contractId: contract1.id,
      milestoneNumber: 2,
      title: 'Backend Development & API Integration',
      description: 'Complete backend API development, authentication system, database integration',
      amountUSD: 5000.00,
      dueDate: new Date('2026-06-30'),
      status: 'PAID',
      complianceTaxFormSigned: true,
      submittedAt: new Date('2026-06-29T14:00:00Z'),
      approvedAt: new Date('2026-06-30T09:00:00Z'),
      handshakeCompletedAt: new Date('2026-06-30T09:05:00Z'),
      paidAt: new Date('2026-06-30T09:10:00Z'),
    },
  });

  const transaction2 = await prisma.paymentTransaction.create({
    data: {
      transactionNumber: `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      contractId: contract1.id,
      milestoneId: milestone2.id,
      transactionType: 'MILESTONE_PAYOUT',
      grossAmount: 5000.00,
      platformFee: 5000 * platformFeeRate,
      platformFeeRate: platformFeeRate,
      fxSpread: 5000 * fxSpreadRate,
      fxSpreadRate: fxSpreadRate,
      netAmount: 5000 - (5000 * platformFeeRate) - (5000 * fxSpreadRate),
      sourceCurrency: 'USD',
      targetCurrency: 'NGN',
      exchangeRate: exchangeRate,
      airwallexTransferId: `aw_transfer_${crypto.randomBytes(12).toString('hex')}`,
      airwallexReference: `AW-${contract1.contractNumber}-M2`,
      airwallexFee: 12.50,
      status: 'COMPLETED',
      paymentMethod: 'ACH',
      initiatedAt: new Date('2026-06-30T09:10:00Z'),
      processedAt: new Date('2026-06-30T09:12:00Z'),
      completedAt: new Date('2026-06-30T09:15:00Z'),
    },
  });

  // Add biometric log for milestone 2 handshake
  await prisma.biometricVerification.create({
    data: {
      userId: chidi.id,
      passportId: chidiPassport.id,
      verificationType: 'MILESTONE_HANDSHAKE',
      sessionId: generateSmileIdToken(),
      confidence: 0.96,
      livenessDetected: true,
      matchResult: 'PASS',
      verificationProvider: 'SMILE_ID',
      verificationTimestamp: new Date('2026-06-30T09:05:00Z'),
      deviceFingerprint: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '197.210.85.123',
      geoLocation: 'Lagos, Nigeria',
      metadata: {
        passToken: generateSmileIdToken(),
        milestoneId: milestone2.id,
        contractId: contract1.id,
        sessionDuration: 31,
      },
    },
  });

  console.log(`  ✓ Milestone 2: Backend Development ($5,000) [PAID]`);
  console.log(`     Transaction ID: ${transaction2.transactionNumber}`);
  console.log(`     Platform Revenue: $${(5000 * (platformFeeRate + fxSpreadRate)).toFixed(2)}`);

  // MILESTONE 3: Frontend & Final Delivery (COMPLETED)
  const milestone3 = await prisma.milestone.create({
    data: {
      contractId: contract1.id,
      milestoneNumber: 3,
      title: 'Frontend Development & Final Delivery',
      description: 'Complete frontend development, UI/UX implementation, testing, and deployment',
      amountUSD: 5000.00,
      dueDate: new Date('2026-07-15'),
      status: 'PAID',
      complianceTaxFormSigned: true,
      submittedAt: new Date('2026-07-14T18:00:00Z'),
      approvedAt: new Date('2026-07-15T10:00:00Z'),
      handshakeCompletedAt: new Date('2026-07-15T10:05:00Z'),
      paidAt: new Date('2026-07-15T10:10:00Z'),
    },
  });

  const transaction3 = await prisma.paymentTransaction.create({
    data: {
      transactionNumber: `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      contractId: contract1.id,
      milestoneId: milestone3.id,
      transactionType: 'MILESTONE_PAYOUT',
      grossAmount: 5000.00,
      platformFee: 5000 * platformFeeRate,
      platformFeeRate: platformFeeRate,
      fxSpread: 5000 * fxSpreadRate,
      fxSpreadRate: fxSpreadRate,
      netAmount: 5000 - (5000 * platformFeeRate) - (5000 * fxSpreadRate),
      sourceCurrency: 'USD',
      targetCurrency: 'NGN',
      exchangeRate: exchangeRate,
      airwallexTransferId: `aw_transfer_${crypto.randomBytes(12).toString('hex')}`,
      airwallexReference: `AW-${contract1.contractNumber}-M3`,
      airwallexFee: 12.50,
      status: 'COMPLETED',
      paymentMethod: 'ACH',
      initiatedAt: new Date('2026-07-15T10:10:00Z'),
      processedAt: new Date('2026-07-15T10:12:00Z'),
      completedAt: new Date('2026-07-15T10:15:00Z'),
    },
  });

  // Add biometric log for milestone 3 handshake
  await prisma.biometricVerification.create({
    data: {
      userId: chidi.id,
      passportId: chidiPassport.id,
      verificationType: 'MILESTONE_HANDSHAKE',
      sessionId: generateSmileIdToken(),
      confidence: 0.98,
      livenessDetected: true,
      matchResult: 'PASS',
      verificationProvider: 'SMILE_ID',
      verificationTimestamp: new Date('2026-07-15T10:05:00Z'),
      deviceFingerprint: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '197.210.85.123',
      geoLocation: 'Lagos, Nigeria',
      metadata: {
        passToken: generateSmileIdToken(),
        milestoneId: milestone3.id,
        contractId: contract1.id,
        sessionDuration: 25,
      },
    },
  });

  console.log(`  ✓ Milestone 3: Frontend & Delivery ($5,000) [PAID]`);
  console.log(`     Transaction ID: ${transaction3.transactionNumber}`);
  console.log(`     Platform Revenue: $${(5000 * (platformFeeRate + fxSpreadRate)).toFixed(2)}`);

  // ========================================================================
  // 5. CREATE W-8BEN TAX COMPLIANCE FORMS
  // ========================================================================
  console.log('\n📋 Creating W-8BEN Tax Compliance Forms...\n');

  await prisma.w8BENForm.createMany({
    data: [
      {
        userId: chidi.id,
        passportId: chidiPassport.id,
        fullLegalName: 'CHIDI OKAFOR',
        countryOfCitizenship: 'NG',
        permanentResidenceAddress: '15 Adeola Odeku Street, Victoria Island, Lagos, Nigeria',
        mailingAddress: '15 Adeola Odeku Street, Victoria Island, Lagos, Nigeria',
        taxIdentificationNumber: 'NG-TIN-12345678',
        dateOfBirth: new Date('1995-03-15'),
        claimTreatyBenefits: true,
        treatyCountry: 'NG',
        formData: {
          certifyUnderPenalties: true,
          beneficialOwner: true,
          usCitizenOrResident: false,
        },
        signedAt: new Date('2026-06-10T14:30:00Z'),
        signedBy: chidi.id,
        status: 'SIGNED',
        validUntil: new Date('2029-06-10'),
      },
      {
        userId: rafael.id,
        passportId: rafaelPassport.id,
        fullLegalName: 'RAFAEL SILVA',
        countryOfCitizenship: 'BR',
        permanentResidenceAddress: 'Rua Augusta, 1234, São Paulo, SP, Brazil',
        mailingAddress: 'Rua Augusta, 1234, São Paulo, SP, Brazil',
        taxIdentificationNumber: 'BR-CPF-123.456.789-00',
        dateOfBirth: new Date('1992-11-20'),
        claimTreatyBenefits: true,
        treatyCountry: 'BR',
        formData: {
          certifyUnderPenalties: true,
          beneficialOwner: true,
          usCitizenOrResident: false,
        },
        signedAt: new Date('2026-05-15T15:00:00Z'),
        signedBy: rafael.id,
        status: 'SIGNED',
        validUntil: new Date('2029-05-15'),
      },
    ],
  });

  console.log('  ✓ Created W-8BEN forms for Chidi and Rafael');

  // ========================================================================
  // 6. CREATE PLATFORM TREASURY WALLET
  // ========================================================================
  console.log('\n🏦 Creating Platform Treasury Wallet...\n');

  const totalPlatformRevenue = (5000 * (platformFeeRate + fxSpreadRate)) * 3; // 3 completed milestones

  await prisma.multiCurrencyWallet.create({
    data: {
      walletType: 'PLATFORM_TREASURY',
      ownerId: 'platform',
      balances: {
        USD: totalPlatformRevenue,
        NGN: 0,
        KES: 0,
        BRL: 0,
      },
    },
  });

  console.log(`  ✓ Platform treasury wallet created with $${totalPlatformRevenue.toFixed(2)} USD revenue`);

  // ========================================================================
  // COMPLETION SUMMARY
  // ========================================================================
  console.log('\n' + '═'.repeat(80));
  console.log('✅ PREMIUM INVESTOR DEMO DATA SEEDED SUCCESSFULLY!');
  console.log('═'.repeat(80) + '\n');

  console.log('📊 SUMMARY:\n');
  console.log('  👔 Business Clients:         2 (TechVentures, Dubai Ventures)');
  console.log('  🌍 Premium Contractors:      5 (Nigeria: 2, Kenya: 2, Brazil: 1)');
  console.log('  🛡️  VettedME Passports:       5 (with GitHub tracking hashes)');
  console.log('  🔐 Biometric Logs:           8 (with pass tokens & timestamps)');
  console.log('  💼 Contracts:                2 (1 COMPLETED, 1 CAPITAL_ESCROWED)');
  console.log('  💳 Airwallex Sub-Accounts:   2 (with ledger identifiers)');
  console.log('  ✅ Milestone Payments:       3 (COMPLETED - historical data)');
  console.log('  🔒 Escrow Ready for Demo:    1 ($25,000 USD - Rafael/Dubai)');
  console.log('  💵 Platform Revenue:         $' + totalPlatformRevenue.toFixed(2) + ' USD');
  console.log('  📋 W-8BEN Tax Forms:         2 (signed & valid)\n');

  console.log('🎯 INVESTOR DEMO READY:\n');
  console.log('  • Contract CTR-2026-002 is in CAPITAL_ESCROWED status');
  console.log('  • $25,000 USD fully funded and ready for milestone release');
  console.log('  • Rafael Silva (Brazil) awaiting first milestone approval');
  console.log('  • Live biometric handshake demonstration ready');
  console.log('  • All contractor profiles have realistic GitHub tracking hashes');
  console.log('  • Biometric logs include pass tokens and timestamp histories');
  console.log('  • Airwallex ledger identifiers look professional\n');

  console.log('🔐 TEST CREDENTIALS:\n');
  console.log('  Business (TechVentures):  sarah.chen@techventures.io / business123');
  console.log('  Business (Dubai):         omar.hassan@dubaiventures.ae / business123');
  console.log('  Talent (Chidi - Nigeria): chidi.okafor@techpro.ng / talent123');
  console.log('  Talent (Rafael - Brazil): rafael.silva@devops.br / talent123\n');

  console.log('═'.repeat(80));
  console.log('🚀 READY FOR INVESTOR PRESENTATION!');
  console.log('═'.repeat(80) + '\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
