"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalibrationAnalytics,
  PreferenceLabel,
  RubricDimensionKey,
  ValidateResult,
  ensureAssessmentSession,
  fetchCandidateDataset,
  submitValidation,
} from "@/lib/rlhfApi";

export type Side = "A" | "B";

export type CompactDimensionKey =
  | "helpfulness"
  | "factuality"
  | "safety"
  | "tone";

export type CompactScoreMap = Record<CompactDimensionKey, number | null>;

/** Per-pair UI state for the side-by-side Tailwind panel */
export interface PairState {
  readA: boolean;
  readB: boolean;
  scoresA: CompactScoreMap;
  scoresB: CompactScoreMap;
  preference: PreferenceLabel | null;
}

export type PairWorkspaceMap = Record<string, PairState>;

export interface AssessmentResult {
  pass: boolean;
  hardFail: boolean;
  finalScore?: number;
  status?: string;
  reason?: string;
  message?: string;
  validate: ValidateResult;
  calibration: CalibrationAnalytics | null;
}

const COMPACT_TO_RUBRIC: Record<CompactDimensionKey, RubricDimensionKey> = {
  helpfulness: "helpfulnessDirectness",
  factuality: "truthfulnessFactuality",
  safety: "harmMitigationSafety",
  tone: "toneFormatting",
};

function emptyCompactScores(): CompactScoreMap {
  return {
    helpfulness: null,
    factuality: null,
    safety: null,
    tone: null,
  };
}

function emptyPairState(): PairState {
  return {
    readA: false,
    readB: false,
    scoresA: emptyCompactScores(),
    scoresB: emptyCompactScores(),
    preference: null,
  };
}

function scoresComplete(scores: CompactScoreMap): boolean {
  return (Object.keys(COMPACT_TO_RUBRIC) as CompactDimensionKey[]).every(
    (k) => typeof scores[k] === "number" && scores[k]! >= 1 && scores[k]! <= 5
  );
}

function toRubricScores(scores: CompactScoreMap): Record<RubricDimensionKey, number> {
  return {
    helpfulnessDirectness: Number(scores.helpfulness),
    truthfulnessFactuality: Number(scores.factuality),
    harmMitigationSafety: Number(scores.safety),
    toneFormatting: Number(scores.tone),
  };
}

/**
 * RLHF evaluation workspace state + actions for the side-by-side panel.
 *
 * @example
 * const { workspace, updateScore, submitAssessment, isSubmitting, error, result } =
 *   useRlhfAssessment("YOUR_TEST_USER_ID");
 */
export function useRlhfAssessment(userIdHint?: string) {
  const [workspace, setWorkspace] = useState<PairWorkspaceMap>({});
  const [pairIds, setPairIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [calibration, setCalibration] =
    useState<CalibrationAnalytics | null>(null);
  const [evaluationStartedAt, setEvaluationStartedAt] = useState("");
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(
    userIdHint && userIdHint !== "YOUR_TEST_USER_ID" ? userIdHint : null
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const started = new Date().toISOString();
        // Warm session + confirm API reachability; UI may still use local mocks
        await fetchCandidateDataset().catch(() => null);
        if (!alive) return;
        setEvaluationStartedAt(started);
        const ids = ["pair-01", "pair-02"];
        setPairIds(ids);
        const initial: PairWorkspaceMap = {};
        ids.forEach((id) => {
          initial[id] = emptyPairState();
        });
        setWorkspace(initial);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to initialize assessment");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const isWorkspaceComplete = useMemo(() => {
    if (!pairIds.length) return false;
    return pairIds.every((id) => {
      const p = workspace[id];
      return (
        p &&
        p.readA &&
        p.readB &&
        scoresComplete(p.scoresA) &&
        scoresComplete(p.scoresB) &&
        p.preference
      );
    });
  }, [pairIds, workspace]);

  const updateScore = useCallback(
    (
      pairId: string,
      side: Side,
      dimension: CompactDimensionKey,
      value: number
    ) => {
      setWorkspace((prev) => {
        const current = prev[pairId] || emptyPairState();
        const key = side === "A" ? "scoresA" : "scoresB";
        return {
          ...prev,
          [pairId]: {
            ...current,
            [key]: { ...current[key], [dimension]: value },
          },
        };
      });
    },
    []
  );

  const markAsRead = useCallback((pairId: string, side: Side) => {
    setWorkspace((prev) => {
      const current = prev[pairId] || emptyPairState();
      return {
        ...prev,
        [pairId]: {
          ...current,
          ...(side === "A" ? { readA: true } : { readB: true }),
        },
      };
    });
  }, []);

  /** Alias used by older workspace UI */
  const markRead = markAsRead;

  const updatePreference = useCallback(
    (pairId: string, preference: PreferenceLabel) => {
      setWorkspace((prev) => {
        const current = prev[pairId] || emptyPairState();
        return {
          ...prev,
          [pairId]: { ...current, preference },
        };
      });
    },
    []
  );

  const resetAfterResult = useCallback(() => {
    setResult(null);
    setCalibration(null);
    setEvaluationStartedAt(new Date().toISOString());
    setWorkspace((prev) => {
      const next: PairWorkspaceMap = {};
      Object.keys(prev).forEach((id) => {
        next[id] = emptyPairState();
      });
      return next;
    });
  }, []);

  const submitAssessment = useCallback(async () => {
    if (!isWorkspaceComplete) {
      setError("Complete scores + preference on every pair before submitting.");
      return null;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setResult(null);
      setCalibration(null);

      const session = await ensureAssessmentSession();
      const userId =
        (userIdHint && userIdHint !== "YOUR_TEST_USER_ID"
          ? userIdHint
          : null) || session.userId;
      setResolvedUserId(userId);

      const submissions = pairIds.map((pairId) => {
        const p = workspace[pairId];
        if (!p?.preference) {
          throw new Error(`Missing preference for ${pairId}`);
        }
        if (!p.readA || !p.readB) {
          throw new Error(`Read receipts incomplete for ${pairId}`);
        }
        return {
          pairId,
          label: p.preference,
          scores: {
            A: toRubricScores(p.scoresA),
            B: toRubricScores(p.scoresB),
          },
          readReceipts: { readA: true as const, readB: true as const },
        };
      });

      const json = await submitValidation({
        token: session.token,
        userId,
        evaluationStartedAt:
          evaluationStartedAt || new Date().toISOString(),
        submissions,
      });

      const validate: ValidateResult = json.result || {
        success: Boolean(json.pass),
        hardFail: Boolean(
          json.reason === "INSUFFICIENT_EVALUATION_TIME" ||
            json.reason === "CRITICAL_SAFETY_GATE_VIOLATION"
        ),
        pass: Boolean(json.pass),
        reason: json.reason,
        scoring: { percent: json.finalScore },
      };

      const nextCalibration = validate.calibration?.available
        ? validate.calibration
        : null;
      if (nextCalibration) setCalibration(nextCalibration);

      const assessmentResult: AssessmentResult = {
        pass: Boolean(validate.pass || json.pass),
        hardFail: Boolean(validate.hardFail),
        finalScore: validate.scoring?.percent ?? json.finalScore,
        status: json.status,
        reason: validate.reason || json.reason,
        message: json.message,
        validate,
        calibration: nextCalibration,
      };
      setResult(assessmentResult);
      return assessmentResult;
    } catch (e: any) {
      setError(e?.message || "Submit failed");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    evaluationStartedAt,
    isWorkspaceComplete,
    pairIds,
    userIdHint,
    workspace,
  ]);

  return {
    workspace,
    pairIds,
    loading,
    userId: resolvedUserId,
    calibration,
    updateScore,
    updatePreference,
    markAsRead,
    markRead,
    isWorkspaceComplete,
    submitAssessment,
    isSubmitting,
    result,
    error,
    resetAfterResult,
  };
}
