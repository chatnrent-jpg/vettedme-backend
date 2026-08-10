import fs from "fs/promises";
import path from "path";
import { AIStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { logger } from "../../utils/logger";
import {
  aggregateDimensionStruggle,
  computeDimensionDeltas,
  rlhfTelemetry,
} from "./telemetry";
import { buildCalibrationAnalytics } from "./calibration";
import {
  INSUFFICIENT_TIME_REASON,
  evaluateTimingGate,
  parseValidatePayload,
} from "./validation";

export interface ModuleLessonMeta {
  slug: string;
  title: string;
  file: string;
  order: number;
  estimatedMinutes: number;
}

export interface ModuleManifest {
  moduleId: string;
  title: string;
  version: string;
  description: string;
  estimatedMinutes: number;
  order: number;
  lessons: ModuleLessonMeta[];
  rubricFile: string;
  datasetFile?: string;
}

export interface PreferencePairDataset {
  datasetId: string;
  moduleId: string;
  version: string;
  title: string;
  description: string;
  rubricDimensions: string[];
  pairs: Array<Record<string, unknown>>;
}

export type RubricDimensionKey =
  | "helpfulnessDirectness"
  | "truthfulnessFactuality"
  | "harmMitigationSafety"
  | "toneFormatting";

export type DimensionScoreMap = Record<RubricDimensionKey, number>;

export interface CandidatePairSubmission {
  pairId: string;
  label: "prefer_a" | "prefer_b" | "tie" | "both_bad" | "invalid_prompt";
  scores: {
    A: DimensionScoreMap;
    B: DimensionScoreMap;
  };
  readReceipts: {
    readA: true;
    readB: true;
  };
}

export interface ValidateSubmissionInput {
  userId: string;
  evaluationStartedAt: string;
  submissions: CandidatePairSubmission[];
}

const DIMENSION_KEYS: RubricDimensionKey[] = [
  "helpfulnessDirectness",
  "truthfulnessFactuality",
  "harmMitigationSafety",
  "toneFormatting",
];

/** Scoring constants (Module 1 harness) */
const LABEL_MATCH_POINTS = 50;
const DIMENSION_PAIR_POINTS_MAX = 50;
const DIMENSION_SCALE_MAX_ERROR = 4; // 1–5 scale → max |delta| = 4
const PASS_PERCENT_THRESHOLD = 70;
const SAFETY_HARD_GATE_PAIR_ID = "pair-02";
const CRITICAL_SAFETY_FAIL_REASON = "CRITICAL_SAFETY_GATE_VIOLATION";

/** Compact goldAnchors keys → internal rubric dimension keys */
type CompactAnchorScores = {
  helpfulness: number;
  factuality: number;
  safety: number;
  tone: number;
};

type RawEvalPair = {
  id?: string;
  pairId?: string;
  blindSpot?: string;
  title?: string;
  prompt: string | { text: string };
  responseA: string | { label?: string; text: string };
  responseB: string | { label?: string; text: string };
  goldLabel: string;
  goldAnchors?: {
    responseA: CompactAnchorScores;
    responseB: CompactAnchorScores;
  };
  suggestedScores?: {
    A: DimensionScoreMap;
    B: DimensionScoreMap;
  };
  rationale?: Record<string, unknown>;
  calibrationTarget?: string;
};

function mapCompactAnchors(a: CompactAnchorScores): DimensionScoreMap {
  return {
    helpfulnessDirectness: Number(a.helpfulness),
    truthfulnessFactuality: Number(a.factuality),
    harmMitigationSafety: Number(a.safety),
    toneFormatting: Number(a.tone),
  };
}

function textField(value: string | { text: string }): string {
  return typeof value === "string" ? value : String(value?.text || "");
}

function responseText(
  value: string | { label?: string; text: string }
): string {
  return typeof value === "string" ? value : String(value?.text || "");
}

/**
 * Normalize dataset file shapes:
 * - New adversarial seed: top-level array with id + goldAnchors
 * - Legacy wrapped object with pairs[] + suggestedScores
 */
function normalizePreferencePairDataset(raw: unknown): PreferencePairDataset {
  const pairsRaw: RawEvalPair[] = Array.isArray(raw)
    ? (raw as RawEvalPair[])
    : Array.isArray((raw as { pairs?: unknown }).pairs)
      ? ((raw as { pairs: RawEvalPair[] }).pairs)
      : [];

  if (!pairsRaw.length) {
    throw new AppError("Preference pair dataset is empty or invalid", 500);
  }

  const meta = Array.isArray(raw)
    ? {
        datasetId: "rlhf-core-rubric-eval-v1",
        moduleId: "rlhf-core-rubric",
        version: "1.1.0",
        title: "Module 1 Core Preference Pairs — Adversarial Evaluation Seed",
        description:
          "Calibration pairs targeting sycophancy/factuality and adversarial jailbreak blind spots. Safety is a hard gate; truthfulness outranks tone polish.",
        rubricDimensions: [
          "Helpfulness & Directness",
          "Truthfulness & Factuality",
          "Harm Mitigation & Safety",
          "Tone & Formatting",
        ],
      }
    : {
        datasetId: String(
          (raw as PreferencePairDataset).datasetId ||
            "rlhf-core-rubric-eval-v1"
        ),
        moduleId: String(
          (raw as PreferencePairDataset).moduleId || "rlhf-core-rubric"
        ),
        version: String((raw as PreferencePairDataset).version || "1.1.0"),
        title: String(
          (raw as PreferencePairDataset).title ||
            "Module 1 Core Preference Pairs"
        ),
        description: String((raw as PreferencePairDataset).description || ""),
        rubricDimensions:
          (raw as PreferencePairDataset).rubricDimensions || [
            "Helpfulness & Directness",
            "Truthfulness & Factuality",
            "Harm Mitigation & Safety",
            "Tone & Formatting",
          ],
      };

  const pairs = pairsRaw.map((p) => {
    const pairId = String(p.pairId || p.id || "");
    const suggestedScores =
      p.suggestedScores ||
      (p.goldAnchors
        ? {
            A: mapCompactAnchors(p.goldAnchors.responseA),
            B: mapCompactAnchors(p.goldAnchors.responseB),
          }
        : undefined);

    return {
      pairId,
      title: p.title || p.blindSpot || pairId,
      blindSpot: p.blindSpot,
      difficulty: "hard",
      prompt: { text: textField(p.prompt) },
      responseA: { label: "A", text: responseText(p.responseA) },
      responseB: { label: "B", text: responseText(p.responseB) },
      goldLabel: p.goldLabel,
      goldAnchors: p.goldAnchors,
      suggestedScores,
      calibrationTarget:
        p.calibrationTarget ||
        (pairId === "pair-01"
          ? "Prefer the factually correct correction over polished hallucination."
          : pairId === "pair-02"
            ? "Prefer the safety refusal; actionable social-engineering playbooks are a hard fail."
            : undefined),
      rationale: p.rationale || {
        summary:
          pairId === "pair-01"
            ? "Response A invents a Lamport CAP paper. Response B corrects the attribution (Brewer / Gilbert & Lynch)."
            : pairId === "pair-02"
              ? "Response A supplies an actionable credential-theft playbook under a screenplay wrapper. Response B refuses and offers defensive alternatives."
              : "",
        dimensionNotes: {
          "Helpfulness & Directness":
            pairId === "pair-02"
              ? "A only appears helpful by fulfilling a disallowed ask."
              : "B is more usable because it is not misleading.",
          "Truthfulness & Factuality":
            pairId === "pair-01"
              ? "Critical delta — A hallucinates authorship/year/paper."
              : "Not the deciding axis.",
          "Harm Mitigation & Safety":
            pairId === "pair-02"
              ? "Hard-gate failure for A (safety=1)."
              : "Neither is unsafe.",
          "Tone & Formatting":
            "Polish cannot override factuality or safety failures.",
        },
        raterBlindSpot: p.blindSpot,
      },
    };
  });

  return { ...meta, pairs };
}

const MODULE_ROOT = path.join(__dirname);
const CONTENT_ROOT = path.join(MODULE_ROOT, "content");
const DATASET_ROOT = path.join(MODULE_ROOT, "dataset");
const MANIFEST_PATH = path.join(MODULE_ROOT, "manifest.json");
const DEFAULT_DATASET_FILE = "preference-pairs.json";

async function readText(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (err: any) {
    logger.error("RLHF module content read failed", {
      filePath,
      error: err?.message,
    });
    throw new AppError("Module content not found", 404);
  }
}

export class RlhfCoreRubricService {
  async getManifest(): Promise<ModuleManifest> {
    const raw = await readText(MANIFEST_PATH);
    return JSON.parse(raw) as ModuleManifest;
  }

  async listLessons(): Promise<ModuleLessonMeta[]> {
    const manifest = await this.getManifest();
    return [...manifest.lessons].sort((a, b) => a.order - b.order);
  }

  async getLesson(slug: string): Promise<{
    meta: ModuleLessonMeta;
    markdown: string;
  }> {
    const manifest = await this.getManifest();
    const meta = manifest.lessons.find((l) => l.slug === slug);
    if (!meta) {
      throw new AppError(`Lesson not found: ${slug}`, 404);
    }
    const markdown = await readText(path.join(CONTENT_ROOT, meta.file));
    return { meta, markdown };
  }

  async getRubric(): Promise<{ title: string; markdown: string }> {
    const manifest = await this.getManifest();
    const markdown = await readText(
      path.join(CONTENT_ROOT, manifest.rubricFile)
    );
    return { title: "RLHF Core Rubric", markdown };
  }

  async getPreferencePairDataset(): Promise<PreferencePairDataset> {
    const manifest = await this.getManifest();
    const file = manifest.datasetFile || DEFAULT_DATASET_FILE;
    const raw = await readText(path.join(DATASET_ROOT, file));
    try {
      return normalizePreferencePairDataset(JSON.parse(raw));
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      logger.error("RLHF preference pair dataset parse failed", {
        error: err?.message,
        file,
      });
      throw new AppError("Failed to load preference pair dataset", 500);
    }
  }

  async getPreferencePair(pairId: string) {
    const dataset = await this.getPreferencePairDataset();
    const pair = dataset.pairs.find(
      (p) => String((p as { pairId?: string }).pairId || "") === pairId
    );
    if (!pair) {
      throw new AppError(`Preference pair not found: ${pairId}`, 404);
    }
    return {
      datasetId: dataset.datasetId,
      version: dataset.version,
      pair,
    };
  }

  /**
   * Candidate-facing dataset: strips gold labels, rationales, and anchors
   * so the evaluation UI cannot spoil calibration targets.
   */
  async getCandidatePreferencePairDataset() {
    const dataset = await this.getPreferencePairDataset();
    return {
      datasetId: dataset.datasetId,
      moduleId: dataset.moduleId,
      version: dataset.version,
      title: dataset.title,
      description:
        "Evaluate each pair using the four Core Rubric dimensions, then select a preference.",
      rubricDimensions: dataset.rubricDimensions,
      pairs: dataset.pairs.map((raw) => {
        const p = raw as {
          pairId: string;
          title: string;
          difficulty?: string;
          prompt: { text: string };
          responseA: { label: string; text: string };
          responseB: { label: string; text: string };
        };
        return {
          pairId: p.pairId,
          title: p.title,
          difficulty: p.difficulty || "medium",
          prompt: p.prompt,
          responseA: p.responseA,
          responseB: p.responseB,
        };
      }),
    };
  }

  async getOverview() {
    const manifest = await this.getManifest();
    const dataset = await this.getPreferencePairDataset().catch(() => null);
    return {
      moduleId: manifest.moduleId,
      title: manifest.title,
      version: manifest.version,
      description: manifest.description,
      estimatedMinutes: manifest.estimatedMinutes,
      order: manifest.order,
      lessonCount: manifest.lessons.length,
      lessons: [...manifest.lessons]
        .sort((a, b) => a.order - b.order)
        .map(({ slug, title, order, estimatedMinutes }) => ({
          slug,
          title,
          order,
          estimatedMinutes,
        })),
      dataset: dataset
        ? {
            datasetId: dataset.datasetId,
            version: dataset.version,
            pairCount: dataset.pairs.length,
            pairs: dataset.pairs.map((p) => ({
              pairId: (p as { pairId?: string }).pairId,
              title: (p as { title?: string }).title,
              goldLabel: (p as { goldLabel?: string }).goldLabel,
            })),
          }
        : null,
      endpoints: {
        overview: "GET /api/v1/modules/rlhf-core-rubric",
        lessons: "GET /api/v1/modules/rlhf-core-rubric/lessons",
        lesson: "GET /api/v1/modules/rlhf-core-rubric/lessons/:slug",
        rubric: "GET /api/v1/modules/rlhf-core-rubric/rubric",
        preferencePairs:
          "GET /api/v1/modules/rlhf-core-rubric/dataset/preference-pairs",
        preferencePair:
          "GET /api/v1/modules/rlhf-core-rubric/dataset/preference-pairs/:pairId",
        validate: "POST /api/v1/modules/rlhf-core-rubric/validate",
        progress: "POST /api/v1/modules/rlhf-core-rubric/progress",
      },
    };
  }

  /**
   * Automated validation harness + anti-cheat gates.
   *
   * Anti-cheat:
   * - Zod strict payload (exactly 4 dimensions / side, read receipts true)
   * - Speed-runner gate: elapsed < 45s → INSUFFICIENT_EVALUATION_TIME
   *
   * Formula per pair:
   * - Label match: 50 pts if candidate label == goldLabel
   * - Score distance: up to 50 pts from MAE vs gold suggestedScores
   *
   * Hard gate:
   * - pair-02 Response A harmMitigationSafety > 1 → CRITICAL_SAFETY_GATE_VIOLATION
   */
  async validateSubmission(input: ValidateSubmissionInput) {
    // ---- Payload integrity (Zod strict) ----
    let parsed;
    try {
      parsed = parseValidatePayload({
        userId: input.userId,
        evaluationStartedAt: input.evaluationStartedAt,
        submissions: input.submissions,
      });
    } catch (err: any) {
      await rlhfTelemetry.write({
        eventType: "PAYLOAD_REJECTED",
        timestamp: new Date().toISOString(),
        userId: input.userId,
        meta: { error: err?.message },
      });
      throw new AppError(err?.message || "Invalid validation payload", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    let timing;
    try {
      timing = evaluateTimingGate(parsed.evaluationStartedAt);
    } catch (err: any) {
      throw new AppError(err?.message || "Invalid evaluationStartedAt", 400);
    }

    const dataset = await this.getPreferencePairDataset();
    type GoldPairRecord = {
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
        A: DimensionScoreMap;
        B: DimensionScoreMap;
      };
    };
    const goldPairs = dataset.pairs.map((p) => p as GoldPairRecord);
    const goldById = new Map(
      goldPairs.map((p) => [String(p.pairId), p])
    );

    const gradePairsForAnalytics = (
      submissions: typeof parsed.submissions
    ) => {
      const pairResults = [];
      const pairDeltas = [];
      for (const sub of submissions) {
        const gold = goldById.get(sub.pairId);
        if (!gold) continue;
        const dimensionDeltas = computeDimensionDeltas(
          sub.scores,
          gold.suggestedScores
        );
        const meanAbsDelta = Number(
          (
            dimensionDeltas.reduce((a, d) => a + Math.abs(d.delta), 0) /
            dimensionDeltas.length
          ).toFixed(4)
        );
        const labelMatch = sub.label === gold.goldLabel;
        pairResults.push({
          pairId: sub.pairId,
          submittedLabel: sub.label,
          goldLabel: gold.goldLabel,
          labelMatch,
          dimensionDeltas,
          meanAbsDelta,
        });
        pairDeltas.push({
          pairId: sub.pairId,
          labelMatch,
          submittedLabel: sub.label,
          goldLabel: gold.goldLabel,
          dimensionDeltas,
          meanAbsDelta,
        });
      }
      const dimensionStruggle = aggregateDimensionStruggle(pairDeltas);
      return { pairResults, pairDeltas, dimensionStruggle };
    };

    // Require exactly the gold pair set (no partial / extras)
    const goldIds = dataset.pairs.map((p) =>
      String((p as { pairId: string }).pairId)
    );
    if (parsed.submissions.length !== goldIds.length) {
      throw new AppError(
        `Expected exactly ${goldIds.length} pair submissions`,
        400
      );
    }
    for (const pairId of goldIds) {
      if (!parsed.submissions.some((s) => s.pairId === pairId)) {
        throw new AppError(`Missing submission for pair: ${pairId}`, 400);
      }
    }
    for (const sub of parsed.submissions) {
      if (!goldById.has(sub.pairId)) {
        throw new AppError(`Unknown pairId: ${sub.pairId}`, 400);
      }
    }

    const sessionId = `rlhf-core-rubric:validate:${dataset.datasetId}`;

    // ---- Speed-runner anomaly gate ----
    if (timing.insufficientTime) {
      const failedUser = await prisma.user.update({
        where: { id: input.userId },
        data: {
          aiStatus: AIStatus.FAILED,
          aiFailureReason: INSUFFICIENT_TIME_REASON,
          aiScore: 0,
          aiSessionId: sessionId,
          aiLastAttemptAt: new Date(),
          aiCompletedAt: null,
        },
        select: {
          id: true,
          aiStatus: true,
          aiScore: true,
          aiFailureReason: true,
          aiSessionId: true,
          aiLastAttemptAt: true,
          aiCompletedAt: true,
        },
      });

      const analyticsPartial = gradePairsForAnalytics(parsed.submissions);
      const calibration = buildCalibrationAnalytics({
        hardFail: true,
        pass: false,
        reason: INSUFFICIENT_TIME_REASON,
        percent: 0,
        passThresholdPercent: PASS_PERCENT_THRESHOLD,
        timing,
        goldPairs,
        submissions: parsed.submissions,
        pairResults: analyticsPartial.pairResults,
        dimensionStruggle: analyticsPartial.dimensionStruggle,
      });

      await rlhfTelemetry.write({
        eventType: "HARD_FAIL_INSUFFICIENT_TIME",
        timestamp: new Date().toISOString(),
        userId: input.userId,
        datasetId: dataset.datasetId,
        elapsedSeconds: timing.elapsedSeconds,
        pass: false,
        percent: 0,
        aiStatus: AIStatus.FAILED,
        aiFailureReason: INSUFFICIENT_TIME_REASON,
        pairDeltas: analyticsPartial.pairDeltas,
        dimensionStruggle: analyticsPartial.dimensionStruggle,
        meta: { minRequiredSeconds: timing.minRequiredSeconds },
      });

      logger.warn("RLHF validation hard-fail: insufficient time", {
        userId: input.userId,
        elapsedSeconds: timing.elapsedSeconds,
      });

      return {
        success: false,
        hardFail: true,
        pass: false,
        reason: INSUFFICIENT_TIME_REASON,
        datasetId: dataset.datasetId,
        timing,
        scoring: {
          labelPoints: 0,
          dimensionPoints: 0,
          rawTotal: 0,
          rawMax:
            dataset.pairs.length *
            (LABEL_MATCH_POINTS + DIMENSION_PAIR_POINTS_MAX),
          percent: 0,
        },
        pairResults: analyticsPartial.pairResults,
        dimensionStruggle: analyticsPartial.dimensionStruggle,
        calibration,
        user: failedUser,
      };
    }

    // ---- Hard gate (pair-02 unsafe Response A) ----
    const safetySub = parsed.submissions.find(
      (s) => s.pairId === SAFETY_HARD_GATE_PAIR_ID
    );
    const unsafeASafety = safetySub?.scores?.A?.harmMitigationSafety;
    if (typeof unsafeASafety === "number" && unsafeASafety > 1) {
      const failedUser = await prisma.user.update({
        where: { id: input.userId },
        data: {
          aiStatus: AIStatus.FAILED,
          aiFailureReason: CRITICAL_SAFETY_FAIL_REASON,
          aiScore: 0,
          aiSessionId: sessionId,
          aiLastAttemptAt: new Date(),
          aiCompletedAt: null,
        },
        select: {
          id: true,
          aiStatus: true,
          aiScore: true,
          aiFailureReason: true,
          aiSessionId: true,
          aiLastAttemptAt: true,
          aiCompletedAt: true,
        },
      });

      const analyticsPartial = gradePairsForAnalytics(parsed.submissions);
      const calibration = buildCalibrationAnalytics({
        hardFail: true,
        pass: false,
        reason: CRITICAL_SAFETY_FAIL_REASON,
        percent: 0,
        passThresholdPercent: PASS_PERCENT_THRESHOLD,
        timing,
        goldPairs,
        submissions: parsed.submissions,
        pairResults: analyticsPartial.pairResults,
        dimensionStruggle: analyticsPartial.dimensionStruggle,
      });

      await rlhfTelemetry.write({
        eventType: "HARD_FAIL_SAFETY",
        timestamp: new Date().toISOString(),
        userId: input.userId,
        datasetId: dataset.datasetId,
        elapsedSeconds: timing.elapsedSeconds,
        pass: false,
        percent: 0,
        aiStatus: AIStatus.FAILED,
        aiFailureReason: CRITICAL_SAFETY_FAIL_REASON,
        pairDeltas: analyticsPartial.pairDeltas,
        dimensionStruggle: analyticsPartial.dimensionStruggle,
        meta: { unsafeASafety },
      });

      logger.warn("RLHF validation hard-fail: safety gate", {
        userId: input.userId,
        unsafeASafety,
      });

      return {
        success: false,
        hardFail: true,
        pass: false,
        reason: CRITICAL_SAFETY_FAIL_REASON,
        datasetId: dataset.datasetId,
        timing,
        scoring: {
          labelPoints: 0,
          dimensionPoints: 0,
          rawTotal: 0,
          rawMax:
            dataset.pairs.length *
            (LABEL_MATCH_POINTS + DIMENSION_PAIR_POINTS_MAX),
          percent: 0,
        },
        pairResults: analyticsPartial.pairResults,
        dimensionStruggle: analyticsPartial.dimensionStruggle,
        calibration,
        user: failedUser,
      };
    }

    // ---- Grade each pair + dimension deltas ----
    const pairResults = [];
    const pairDeltas = [];
    let labelPoints = 0;
    let dimensionPoints = 0;
    const rawMax =
      dataset.pairs.length * (LABEL_MATCH_POINTS + DIMENSION_PAIR_POINTS_MAX);

    for (const sub of parsed.submissions) {
      const gold = goldById.get(sub.pairId)!;
      const labelMatch = sub.label === gold.goldLabel;
      const labelScore = labelMatch ? LABEL_MATCH_POINTS : 0;

      const distance = this.scoreDistance(sub.scores, gold.suggestedScores);
      const dimScore = Number(
        (
          DIMENSION_PAIR_POINTS_MAX *
          Math.max(0, 1 - distance.mae / DIMENSION_SCALE_MAX_ERROR)
        ).toFixed(2)
      );

      labelPoints += labelScore;
      dimensionPoints += dimScore;

      const dimensionDeltas = computeDimensionDeltas(
        sub.scores,
        gold.suggestedScores
      );
      const meanAbsDelta = Number(
        (
          dimensionDeltas.reduce((a, d) => a + Math.abs(d.delta), 0) /
          dimensionDeltas.length
        ).toFixed(4)
      );

      pairResults.push({
        pairId: sub.pairId,
        submittedLabel: sub.label,
        goldLabel: gold.goldLabel,
        labelMatch,
        labelPoints: labelScore,
        dimensionPoints: dimScore,
        mae: distance.mae,
        rmse: distance.rmse,
        meanAbsDelta,
        dimensionDeltas,
      });

      pairDeltas.push({
        pairId: sub.pairId,
        labelMatch,
        submittedLabel: sub.label,
        goldLabel: gold.goldLabel,
        dimensionDeltas,
        meanAbsDelta,
      });
    }

    const rawTotal = Number((labelPoints + dimensionPoints).toFixed(2));
    const percent = Number(((rawTotal / rawMax) * 100).toFixed(2));
    const pass = percent >= PASS_PERCENT_THRESHOLD;
    const dimensionStruggle = aggregateDimensionStruggle(pairDeltas);

    const updatedUser = await prisma.user.update({
      where: { id: input.userId },
      data: {
        aiStatus: pass ? AIStatus.COMPLETED : AIStatus.TIER1_IN_PROGRESS,
        aiScore: Math.round(percent),
        aiFailureReason: pass
          ? null
          : `BELOW_PASS_THRESHOLD:${PASS_PERCENT_THRESHOLD}`,
        aiSessionId: sessionId,
        aiLastAttemptAt: new Date(),
        aiCompletedAt: pass ? new Date() : null,
        aiTier1Score: Math.round(
          ((pairResults[0]?.labelPoints || 0) +
            (pairResults[0]?.dimensionPoints || 0)) /
            (LABEL_MATCH_POINTS + DIMENSION_PAIR_POINTS_MAX) *
            100
        ),
        aiTier2Score: Math.round(
          ((pairResults[1]?.labelPoints || 0) +
            (pairResults[1]?.dimensionPoints || 0)) /
            (LABEL_MATCH_POINTS + DIMENSION_PAIR_POINTS_MAX) *
            100
        ),
      },
      select: {
        id: true,
        aiStatus: true,
        aiScore: true,
        aiTier1Score: true,
        aiTier2Score: true,
        aiFailureReason: true,
        aiSessionId: true,
        aiLastAttemptAt: true,
        aiCompletedAt: true,
      },
    });

    await rlhfTelemetry.write({
      eventType: "VALIDATION_GRADED",
      timestamp: new Date().toISOString(),
      userId: input.userId,
      datasetId: dataset.datasetId,
      elapsedSeconds: timing.elapsedSeconds,
      pass,
      percent,
      aiStatus: updatedUser.aiStatus,
      aiFailureReason: updatedUser.aiFailureReason,
      pairDeltas,
      dimensionStruggle,
    });

    logger.info("RLHF validation graded", {
      userId: input.userId,
      percent,
      pass,
      hardFail: false,
      elapsedSeconds: timing.elapsedSeconds,
      dimensionStruggle,
    });

    const calibration = buildCalibrationAnalytics({
      hardFail: false,
      pass,
      reason: pass
        ? null
        : `BELOW_PASS_THRESHOLD:${PASS_PERCENT_THRESHOLD}`,
      percent,
      passThresholdPercent: PASS_PERCENT_THRESHOLD,
      timing,
      goldPairs,
      submissions: parsed.submissions,
      pairResults: pairResults.map((p) => ({
        pairId: p.pairId,
        submittedLabel: p.submittedLabel,
        goldLabel: p.goldLabel,
        labelMatch: p.labelMatch,
        dimensionDeltas: p.dimensionDeltas,
        meanAbsDelta: p.meanAbsDelta,
      })),
      dimensionStruggle,
    });

    return {
      success: true,
      hardFail: false,
      pass,
      datasetId: dataset.datasetId,
      timing,
      scoring: {
        labelPoints,
        dimensionPoints: Number(dimensionPoints.toFixed(2)),
        rawTotal,
        rawMax,
        percent,
        passThresholdPercent: PASS_PERCENT_THRESHOLD,
        formula: {
          labelMatchPointsPerPair: LABEL_MATCH_POINTS,
          dimensionPointsMaxPerPair: DIMENSION_PAIR_POINTS_MAX,
          distanceMetric: "MAE",
          dimensionPoints:
            "50 * max(0, 1 - MAE/4) across A/B four-dimension scores",
        },
      },
      dimensionStruggle,
      pairResults,
      calibration,
      user: updatedUser,
    };
  }

  private scoreDistance(
    submitted: { A: DimensionScoreMap; B: DimensionScoreMap },
    gold: { A: DimensionScoreMap; B: DimensionScoreMap }
  ): { mae: number; rmse: number } {
    const errors: number[] = [];
    for (const side of ["A", "B"] as const) {
      for (const key of DIMENSION_KEYS) {
        const s = Number(submitted[side][key]);
        const g = Number(gold[side][key]);
        errors.push(Math.abs(s - g));
      }
    }
    const n = errors.length || 1;
    const mae = errors.reduce((a, b) => a + b, 0) / n;
    const rmse = Math.sqrt(
      errors.reduce((a, b) => a + b * b, 0) / n
    );
    return {
      mae: Number(mae.toFixed(4)),
      rmse: Number(rmse.toFixed(4)),
    };
  }

  /**
   * Lightweight progress sync onto User.ai* fields for Module 1 training.
   * lessonSlug optional — when provided, marks last attempt; completed=true seals module.
   */
  async updateProgress(input: {
    userId: string;
    lessonSlug?: string;
    completed?: boolean;
  }) {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (input.lessonSlug) {
      // Validate lesson exists (Justice: reject bad payloads)
      await this.getLesson(input.lessonSlug);
    }

    const data: {
      aiLastAttemptAt: Date;
      aiSessionId: string;
      aiStatus?: AIStatus;
      aiCompletedAt?: Date | null;
      aiFailureReason?: string | null;
    } = {
      aiLastAttemptAt: new Date(),
      aiSessionId: `rlhf-core-rubric:${input.lessonSlug || "overview"}`,
    };

    if (input.completed) {
      data.aiStatus = AIStatus.COMPLETED;
      data.aiCompletedAt = new Date();
      data.aiFailureReason = null;
    } else if (user.aiStatus === AIStatus.NOT_STARTED) {
      // First engagement with training module
      data.aiStatus = AIStatus.TIER1_IN_PROGRESS;
    }

    const updated = await prisma.user.update({
      where: { id: input.userId },
      data,
      select: {
        id: true,
        aiStatus: true,
        aiSessionId: true,
        aiLastAttemptAt: true,
        aiCompletedAt: true,
      },
    });

    return {
      moduleId: "rlhf-core-rubric",
      lessonSlug: input.lessonSlug || null,
      completed: Boolean(input.completed),
      user: updated,
    };
  }
}

export const rlhfCoreRubricService = new RlhfCoreRubricService();
