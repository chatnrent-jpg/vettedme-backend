import type { RubricDimensionKey, DimensionDelta } from "./telemetry";

export type MisalignmentFlagCode =
  | "CONFIDENCE_OVER_FACTUALITY"
  | "SAFETY_HARD_GATE_MISSED"
  | "LABEL_MISMATCH"
  | "INSUFFICIENT_EVALUATION_TIME"
  | "HIGH_DIMENSION_DRIFT";

export interface MisalignmentFlag {
  code: MisalignmentFlagCode;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  pairId?: string;
}

export interface DimensionErrorBar {
  dimension: RubricDimensionKey;
  label: string;
  /** Mean absolute delta across A/B and pairs */
  meanAbsDelta: number;
  /** Signed mean delta (user - gold); positive = overscored */
  meanSignedDelta: number;
  /** Max abs delta observed */
  maxAbsDelta: number;
  /** Normalized 0–1 for bar width (max scale = 4) */
  barRatio: number;
}

export interface PairCalibrationReveal {
  pairId: string;
  title: string;
  submittedLabel: string;
  goldLabel: string;
  labelMatch: boolean;
  calibrationTarget?: string;
  rationale: {
    summary: string;
    dimensionNotes: Record<string, string>;
    raterBlindSpot?: string;
  } | null;
  goldSuggestedScores: {
    A: Record<RubricDimensionKey, number>;
    B: Record<RubricDimensionKey, number>;
  } | null;
  dimensionDeltas: DimensionDelta[];
  meanAbsDelta: number;
}

export interface CalibrationAnalytics {
  available: boolean;
  outcome: "passed" | "failed" | "hard_fail";
  pass: boolean;
  hardFail: boolean;
  reason: string | null;
  percent: number;
  passThresholdPercent: number;
  timing?: {
    elapsedSeconds: number;
    insufficientTime: boolean;
    minRequiredSeconds: number;
  };
  /** Aggregate error delta chart rows (4 dimensions) */
  errorDeltaChart: DimensionErrorBar[];
  misalignmentFlags: MisalignmentFlag[];
  pairReveals: PairCalibrationReveal[];
  dimensionStruggle: Partial<Record<RubricDimensionKey, number>>;
}

const DIMENSION_LABELS: Record<RubricDimensionKey, string> = {
  helpfulnessDirectness: "Helpfulness & Directness",
  truthfulnessFactuality: "Truthfulness & Factuality",
  harmMitigationSafety: "Harm Mitigation & Safety",
  toneFormatting: "Tone & Formatting",
};

const FACTUALITY_PAIR_ID = "pair-01";
const SAFETY_PAIR_ID = "pair-02";
const MAX_SCORE_DELTA = 4;

type GoldPair = {
  pairId: string;
  title?: string;
  goldLabel: string;
  calibrationTarget?: string;
  rationale?: {
    summary?: string;
    dimensionNotes?: Record<string, string>;
    raterBlindSpot?: string;
  };
  suggestedScores: {
    A: Record<RubricDimensionKey, number>;
    B: Record<RubricDimensionKey, number>;
  };
};

type GradedPair = {
  pairId: string;
  submittedLabel: string;
  goldLabel: string;
  labelMatch: boolean;
  dimensionDeltas: DimensionDelta[];
  meanAbsDelta: number;
};

export function buildErrorDeltaChart(
  dimensionStruggle: Partial<Record<RubricDimensionKey, number>>,
  pairDeltas: Array<{ dimensionDeltas: DimensionDelta[] }>
): DimensionErrorBar[] {
  const keys: RubricDimensionKey[] = [
    "helpfulnessDirectness",
    "truthfulnessFactuality",
    "harmMitigationSafety",
    "toneFormatting",
  ];

  return keys.map((dimension) => {
    const samples = pairDeltas.flatMap((p) =>
      p.dimensionDeltas.filter((d) => d.dimension === dimension)
    );
    const meanAbsDelta =
      dimensionStruggle[dimension] ??
      (samples.length
        ? samples.reduce((a, d) => a + Math.abs(d.delta), 0) / samples.length
        : 0);
    const meanSignedDelta = samples.length
      ? samples.reduce((a, d) => a + d.delta, 0) / samples.length
      : 0;
    const maxAbsDelta = samples.length
      ? Math.max(...samples.map((d) => Math.abs(d.delta)))
      : 0;
    const meanAbs = Number(meanAbsDelta.toFixed(3));
    return {
      dimension,
      label: DIMENSION_LABELS[dimension],
      meanAbsDelta: meanAbs,
      meanSignedDelta: Number(meanSignedDelta.toFixed(3)),
      maxAbsDelta: Number(maxAbsDelta.toFixed(3)),
      barRatio: Number(Math.min(1, meanAbs / MAX_SCORE_DELTA).toFixed(4)),
    };
  });
}

export function detectMisalignmentFlags(input: {
  hardFail: boolean;
  reason: string | null;
  pairResults: GradedPair[];
  submissions: Array<{
    pairId: string;
    label: string;
    scores: {
      A: Record<RubricDimensionKey, number>;
      B: Record<RubricDimensionKey, number>;
    };
  }>;
  dimensionStruggle: Partial<Record<RubricDimensionKey, number>>;
}): MisalignmentFlag[] {
  const flags: MisalignmentFlag[] = [];

  if (input.reason === "INSUFFICIENT_EVALUATION_TIME") {
    flags.push({
      code: "INSUFFICIENT_EVALUATION_TIME",
      severity: "critical",
      title: "Speed-runner anomaly",
      detail:
        "The full evaluation completed in under 45 seconds. This is flagged as a statistical anomaly and cannot count as a valid calibration attempt.",
    });
  }

  if (
    input.hardFail &&
    input.reason === "CRITICAL_SAFETY_GATE_VIOLATION"
  ) {
    flags.push({
      code: "SAFETY_HARD_GATE_MISSED",
      severity: "critical",
      title: "Safety hard gate missed",
      detail:
        "Response A on the adversarial pair was scored above the safety floor (harmMitigationSafety > 1). Unsafe assistance cannot be treated as acceptable — even under a fictional wrapper.",
      pairId: SAFETY_PAIR_ID,
    });
  }

  const factualitySub = input.submissions.find(
    (s) => s.pairId === FACTUALITY_PAIR_ID
  );

  if (factualitySub) {
    const preferredPolishedHallucination =
      factualitySub.label === "prefer_a";
    const overscoredToneVsTruth =
      Number(factualitySub.scores.A.toneFormatting) >= 4 &&
      Number(factualitySub.scores.A.truthfulnessFactuality) >= 3;

    if (preferredPolishedHallucination || overscoredToneVsTruth) {
      flags.push({
        code: "CONFIDENCE_OVER_FACTUALITY",
        severity: preferredPolishedHallucination ? "critical" : "warning",
        title: "Confidence over Factuality trap",
        detail: preferredPolishedHallucination
          ? "You preferred the fluent, polished Response A that fabricates CAP theorem attribution. Truthfulness must outrank confident tone."
          : "You scored Response A’s tone highly while also grading its factuality too generously. Polished hallucination is still a factual failure.",
        pairId: FACTUALITY_PAIR_ID,
      });
    }
  }

  const safetySub = input.submissions.find((s) => s.pairId === SAFETY_PAIR_ID);
  if (
    safetySub &&
    !flags.some((f) => f.code === "SAFETY_HARD_GATE_MISSED")
  ) {
    const preferredUnsafe = safetySub.label === "prefer_a";
    const softSafety =
      Number(safetySub.scores.A.harmMitigationSafety) > 1;
    if (preferredUnsafe || softSafety) {
      flags.push({
        code: "SAFETY_HARD_GATE_MISSED",
        severity: preferredUnsafe ? "critical" : "warning",
        title: preferredUnsafe
          ? "Preferred an unsafe response"
          : "Safety score too lenient",
        detail: preferredUnsafe
          ? "Response A provides an actionable social-engineering playbook. Preferring it is a hard policy failure under Harm Mitigation & Safety."
          : "Response A enables credential theft / remote-access social engineering and should score at the safety floor (1).",
        pairId: SAFETY_PAIR_ID,
      });
    }
  }

  for (const pair of input.pairResults) {
    if (!pair.labelMatch) {
      flags.push({
        code: "LABEL_MISMATCH",
        severity: "warning",
        title: "Preference label mismatch",
        detail: `Submitted ${pair.submittedLabel}; gold anchor is ${pair.goldLabel}.`,
        pairId: pair.pairId,
      });
    }
  }

  const highDrift = (
    Object.entries(input.dimensionStruggle) as Array<
      [RubricDimensionKey, number]
    >
  ).filter(([, v]) => v >= 1.5);
  for (const [dimension, meanAbs] of highDrift) {
    flags.push({
      code: "HIGH_DIMENSION_DRIFT",
      severity: "info",
      title: `High drift: ${DIMENSION_LABELS[dimension]}`,
      detail: `Mean absolute score delta of ${meanAbs} on ${DIMENSION_LABELS[dimension]} — review gold anchors for this axis.`,
    });
  }

  // Prefer critical flags first, de-dupe by code+pairId
  const seen = new Set<string>();
  const unique = flags.filter((f) => {
    const key = `${f.code}:${f.pairId || "*"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const rank = { critical: 0, warning: 1, info: 2 };
  unique.sort((a, b) => rank[a.severity] - rank[b.severity]);

  return unique;
}

export function buildPairReveals(
  goldPairs: GoldPair[],
  pairResults: GradedPair[]
): PairCalibrationReveal[] {
  const gradedById = new Map(pairResults.map((p) => [p.pairId, p]));
  return goldPairs.map((gold) => {
    const graded = gradedById.get(gold.pairId);
    const rationale = gold.rationale
      ? {
          summary: String(gold.rationale.summary || ""),
          dimensionNotes: gold.rationale.dimensionNotes || {},
          raterBlindSpot: gold.rationale.raterBlindSpot,
        }
      : null;

    return {
      pairId: gold.pairId,
      title: String(gold.title || gold.pairId),
      submittedLabel: graded?.submittedLabel || "—",
      goldLabel: gold.goldLabel,
      labelMatch: Boolean(graded?.labelMatch),
      calibrationTarget: gold.calibrationTarget,
      rationale,
      goldSuggestedScores: gold.suggestedScores || null,
      dimensionDeltas: graded?.dimensionDeltas || [],
      meanAbsDelta: graded?.meanAbsDelta ?? 0,
    };
  });
}

export function buildCalibrationAnalytics(input: {
  hardFail: boolean;
  pass: boolean;
  reason: string | null;
  percent: number;
  passThresholdPercent: number;
  timing?: {
    elapsedSeconds: number;
    insufficientTime: boolean;
    minRequiredSeconds: number;
  };
  goldPairs: GoldPair[];
  submissions: Array<{
    pairId: string;
    label: string;
    scores: {
      A: Record<RubricDimensionKey, number>;
      B: Record<RubricDimensionKey, number>;
    };
  }>;
  pairResults: GradedPair[];
  dimensionStruggle: Partial<Record<RubricDimensionKey, number>>;
}): CalibrationAnalytics {
  const pairDeltas = input.pairResults.map((p) => ({
    dimensionDeltas: p.dimensionDeltas,
  }));
  const errorDeltaChart = buildErrorDeltaChart(
    input.dimensionStruggle,
    pairDeltas
  );
  const misalignmentFlags = detectMisalignmentFlags({
    hardFail: input.hardFail,
    reason: input.reason,
    pairResults: input.pairResults,
    submissions: input.submissions,
    dimensionStruggle: input.dimensionStruggle,
  });
  const pairReveals = buildPairReveals(input.goldPairs, input.pairResults);

  let outcome: CalibrationAnalytics["outcome"] = "failed";
  if (input.hardFail) outcome = "hard_fail";
  else if (input.pass) outcome = "passed";

  return {
    available: true,
    outcome,
    pass: input.pass,
    hardFail: input.hardFail,
    reason: input.reason,
    percent: input.percent,
    passThresholdPercent: input.passThresholdPercent,
    timing: input.timing,
    errorDeltaChart,
    misalignmentFlags,
    pairReveals,
    dimensionStruggle: input.dimensionStruggle,
  };
}
