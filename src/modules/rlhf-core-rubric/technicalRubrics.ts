import { NictmDepartment } from '@prisma/client';

interface TechnicalScenario {
  failureCaseTitle: string;
  modelOutputAnomaly: string;
  expectedRaterAction: string;
}

/**
 * Returns highly specific engineering and computational failure scenarios
 * based on the NICTM department to fuel the AI Auditor's pushback loop.
 */
export function getTechnicalScenario(department: NictmDepartment): TechnicalScenario {
  const rubrics: Record<NictmDepartment, TechnicalScenario> = {
    MECHATRONICS_ENGINEERING: {
      failureCaseTitle: 'Hysteresis Loop Feedback Lag in Robotic Actuators',
      modelOutputAnomaly:
        'The AI model ignored a 12ms signal propagation latency, falsely claiming the automated arm would achieve structural balance under variable stress.',
      expectedRaterAction:
        'The rater must reject the model output, identify the failure to calculate inverse kinematics damping coefficients, and penalize the lack of fallback logic thresholds.',
    },
    COMPUTER_SCIENCE: {
      failureCaseTitle: 'Thread Race Condition in Concurrent Ingestion Pipeline',
      modelOutputAnomaly:
        'The AI model generated an un-synchronized shared state block inside a multi-threaded web parser, creating a potential deadlock under peak loads.',
      expectedRaterAction:
        'The rater must flag the lack of mutex locks or atomic operations, rejecting the code snippet despite its clean superficial syntax appearance.',
    },
    CYBER_SECURITY_DATA_PROTECTION: {
      failureCaseTitle: 'Blind SQL Injection via Unsanitized GQL Fields',
      modelOutputAnomaly:
        'The AI model parsed GraphQL query arguments using raw string concatenation, exposing the underlying PostgreSQL data ledger to blind boolean manipulation.',
      expectedRaterAction:
        'The rater must flag the critical injection vector immediately, penalize the model\'s safety score, and demand parameterized abstractions.',
    },
    CIVIL_ENGINEERING: {
      failureCaseTitle: 'Shear Stress Allocation Failure in Cantilever Overhangs',
      modelOutputAnomaly:
        'The AI model calculated structural loads using pure static mass averages, failing to account for dynamic wind shear resonance stresses at high altitudes.',
      expectedRaterAction:
        'The rater must execute a hard reject, citing the violation of structural margin-of-safety principles and the catastrophic collapse threshold error.',
    },
    QUANTITY_SURVEYING: {
      failureCaseTitle: 'Compound Inflation Drift in Multi-Year Cost Estimates',
      modelOutputAnomaly:
        'The AI model utilized a static, flat 5% annual escalation buffer across a 60-month project layout, ignoring compounding variance risks on imported mechanical components.',
      expectedRaterAction:
        'The rater must isolate the numerical drift, calculate the compounding interest delta manually, and downgrade the model accuracy parameter scores.',
    },
    BUILDING_TECHNOLOGY: {
      failureCaseTitle: 'Out-of-Sequence Foundation Curing Dependencies',
      modelOutputAnomaly:
        'The AI model scheduled structural load-bearing brickwork assembly logs exactly 48 hours post-pour, disregarding standardized concrete hydration metrics.',
      expectedRaterAction:
        'The rater must intercept the scheduling logic matrix, enforce sequential building safety codes, and classify the output as critical process failure.',
    },
    EXTERNAL_TALENT: {
      failureCaseTitle: 'Logical Fallacy & Non-Sequitur Rationalization',
      modelOutputAnomaly:
        'The AI model asserted that because a software testing suite passed its unit checks, the entire integrated cloud architecture was inherently secure.',
      expectedRaterAction:
        'The rater must dissect the universal reasoning flaw, label the cognitive leap as invalid, and penalize the multi-step verification tree.',
    },
  };

  return rubrics[department] || rubrics.EXTERNAL_TALENT;
}
