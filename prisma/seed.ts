/**
 * Uromi Trust Infrastructure — Hardware & Student Seed Engine
 *
 * Pillar 1 (Data Integrity): Wipes only Uromi pipeline tables, then provisions
 * 30 Ugboha Road workstations + Tier 2 anchor candidates that mirror physical layout.
 *
 * Pillar 2 (State Determinism): Fixed station assignments (no Math.random) so
 * mock POST /api/rlhf/viva/initialize and getAuditorPersona checks are reproducible.
 *
 * Usage: npm run db:seed
 * Investor demo seed remains at: npm run db:seed:investor
 */
import { NictmDepartment, EvaluationTier } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { getAuditorPersona } from '../src/modules/rlhf-core-rubric/auditorMatrix';

async function main() {
  console.log('🌅 Starting Uromi Trust Infrastructure database seeding...');

  // 1. Clean out existing evaluations and physical configurations safely
  // Order respects FKs: evaluations → telemetry → candidates → workstations
  await prisma.candidateEvaluation.deleteMany({});
  await prisma.raterTelemetry.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.workstation.deleteMany({});

  console.log('🧹 Database tables wiped cleanly.');

  // 2. Provision the physical workstations along Ugboha Road (30 Seats)
  const totalStations = 30;
  const workstations = [];

  for (let i = 1; i <= totalStations; i++) {
    const rowLocation = i <= 15 ? 'ROW_A' : 'ROW_B';
    const workstation = await prisma.workstation.create({
      data: {
        stationNumber: i,
        rowLocation: rowLocation,
        starlinkStreamId: `ugboha-starlink-pipe-${rowLocation.toLowerCase()}`,
        isActive: true,
      },
    });
    workstations.push(workstation);
  }
  console.log(
    `📡 Successfully provisioned ${totalStations} physical workstations across ROW_A and ROW_B.`
  );

  // 3. Seed anchor candidates representing NICTM academic talent profiles
  // Deterministic station binding: stationNumber === assignedStationIndex + 1
  const sampleCandidates = [
    {
      fullName: 'Osei Okojie',
      email: 'osei.okojie@nictm.edu.ng',
      phoneNumber: '+2348031111111',
      department: NictmDepartment.MECHATRONICS_ENGINEERING,
      matricNumber: 'NICTM/ME/2024/089',
      isNictmStudent: true,
      rollingMaeScore: 0.08,
      stationNumber: 1,
    },
    {
      fullName: 'Blessing Eidenojie',
      email: 'b.eidenojie@nictm.edu.ng',
      phoneNumber: '+2348032222222',
      department: NictmDepartment.COMPUTER_SCIENCE,
      matricNumber: 'NICTM/CS/2024/012',
      isNictmStudent: true,
      rollingMaeScore: 0.04, // Highly accurate rater
      stationNumber: 2,
    },
    {
      fullName: 'Akhere Anenih',
      email: 'a.anenih@nictm.edu.ng',
      phoneNumber: '+2348033333333',
      department: NictmDepartment.QUANTITY_SURVEYING,
      matricNumber: 'NICTM/QS/2023/045',
      isNictmStudent: true,
      rollingMaeScore: 0.15,
      stationNumber: 3,
    },
    {
      fullName: 'Efe Campbell',
      email: 'efe.campbell@vettedme.ai',
      phoneNumber: '+2348034444444',
      department: NictmDepartment.EXTERNAL_TALENT,
      matricNumber: null, // Returning tech diaspora talent
      isNictmStudent: false,
      rollingMaeScore: 0.11,
      stationNumber: 16, // ROW_B sample
    },
  ];

  for (const c of sampleCandidates) {
    const candidate = await prisma.candidate.create({
      data: {
        fullName: c.fullName,
        email: c.email,
        phoneNumber: c.phoneNumber,
        department: c.department,
        matricNumber: c.matricNumber,
        isNictmStudent: c.isNictmStudent,
        currentTier: EvaluationTier.TIER_2_INTERACTIVE_VIVA,
      },
    });

    const assignedStation = workstations.find((w) => w.stationNumber === c.stationNumber);
    if (!assignedStation) {
      throw new Error(
        `Station ${c.stationNumber} missing after provision — seed layout integrity failed.`
      );
    }

    // Create a mock active Tier 2 Evaluation payload
    await prisma.candidateEvaluation.create({
      data: {
        candidateId: candidate.id,
        workstationId: assignedStation.id,
        rollingMaeScore: c.rollingMaeScore,
        defenseScore: 0.0,
        logicalConsistency: 0.0,
        aiAuditorTranscript: {
          sessionState: 'SEED_INITIALIZED',
          systemCalibration: `AUDITOR_TARGET_${c.department}`,
          history: [
            {
              sender: 'SYSTEM',
              text: `Ready for terminal binding at workstation number ${assignedStation.stationNumber}.`,
            },
          ],
        },
      },
    });

    // Pillar 2 visual verify: persona matrix must match department + MAE
    const persona = getAuditorPersona(c.department, c.fullName, c.rollingMaeScore);
    console.log(
      `🧠 Auditor persona → ${c.fullName} @ station ${c.stationNumber}: ${persona.toneAnchor}`
    );
    console.log(`   critiqueFocus: ${persona.critiqueFocus}`);
    if (!persona.systemPromptTokens.includes(String(c.rollingMaeScore))) {
      throw new Error(
        `Auditor prompt missing MAE ${c.rollingMaeScore} for ${c.fullName} (Justice)`
      );
    }
  }

  const stationCount = await prisma.workstation.count();
  const candidateCount = await prisma.candidate.count();
  const evalCount = await prisma.candidateEvaluation.count();

  console.log('✅ Anchor candidates and mock evaluations seeded successfully.');
  console.log(
    `📊 Reality check: ${stationCount} stations, ${candidateCount} candidates, ${evalCount} evaluations.`
  );
  console.log(
    '🚀 Uromi Trust Infrastructure database is now identical to physical reality layout!'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
