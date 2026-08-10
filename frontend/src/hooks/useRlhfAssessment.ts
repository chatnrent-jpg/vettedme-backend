"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalibrationAnalytics,
  CandidateDataset,
  DIMENSIONS,
  DimensionScoreMap,
  PreferenceLabel,
  RubricDimensionKey,
  ValidateResult,
  ensureAssessmentSession,
  fetchCandidateDataset,
  submitValidation,
} from "@/lib/rlhfApi";

export type Side = "A" | "B";

export interface PairDraft {
  scores: { A: DimensionScoreMap; B: DimensionScoreMap };
  label: PreferenceLabel | null;
  readA: boolean;
  readB: boolean;
}

export interface RlhfWorkspaceState {
  dataset: CandidateDataset | null;
  drafts: Record<string, PairDraft>;
  pairIndex: number;
  evaluationStartedAt: string;
  loading: boolean;
  userId: string | null;
  calibration: CalibrationAnalytics | null;
  resultBanner: string | null;
  allPairsReady: boolean;
  setPairIndex: (index: number | ((prev: number) => number)) => void;
  markRead: (pairId: string, side: Side) => void;
  setPreference: (pairId: string, label: PreferenceLabel) => void;
  resetAfterResult: () => void;
}

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

function emptyScores(): DimensionScoreMap {
  return {
    helpfulnessDirectness: null,
    truthfulnessFactuality: null,
    harmMitigationSafety: null,
    toneFormatting: null,
  };
}

function emptyDraft(): PairDraft {
  return {
    scores: { A: emptyScores(), B: emptyScores() },
    label: null,
    readA: false,
    readB: false,
  };
}

function scoresComplete(scores: DimensionScoreMap): boolean {
  return DIMENSIONS.every((d) => {
    const v = scores[d.key];
    return typeof v === "number" && v >= 1 && v <= 5;
  });
}

/**
 * RLHF evaluation workspace state + actions.
 *
 * @example
 * const { workspace, updateScore, submitAssessment, isSubmitting, error, result } =
 *   useRlhfAssessment("YOUR_TEST_USER_ID");
 */
export function useRlhfAssessment(userIdHint?: string) {
  const [dataset, setDataset] = useState<CandidateDataset | null>(null);
  const [drafts, setDrafts] = useState<Record<string, PairDraft>>({});
  const [pairIndex, setPairIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [resultBanner, setResultBanner] = useState<string | null>(null);
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
        const data = await fetchCandidateDataset();
        if (!alive) return;
        setEvaluationStartedAt(started);
        setDataset(data);
        const initial: Record<string, PairDraft> = {};
        data.pairs.forEach((p) => {
          initial[p.pairId] = emptyDraft();
        });
        setDrafts(initial);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load evaluation dataset");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const allPairsReady = useMemo(() => {
    if (!dataset) return false;
    return dataset.pairs.every((p) => {
      const d = drafts[p.pairId];
      return (
        d &&
        d.readA &&
        d.readB &&
        scoresComplete(d.scores.A) &&
        scoresComplete(d.scores.B) &&
        d.label
      );
    });
  }, [dataset, drafts]);

  const updateScore = useCallback(
    (
      pairId: string,
      side: Side,
      key: RubricDimensionKey,
      value: number
    ) => {
      setDrafts((prev) => {
        const current = prev[pairId] || emptyDraft();
        return {
          ...prev,
          [pairId]: {
            ...current,
            scores: {
              ...current.scores,
              [side]: { ...current.scores[side], [key]: value },
            },
          },
        };
      });
    },
    []
  );

  const markRead = useCallback((pairId: string, side: Side) => {
    setDrafts((prev) => {
      const current = prev[pairId] || emptyDraft();
      return {
        ...prev,
        [pairId]: {
          ...current,
          ...(side === "A" ? { readA: true } : { readB: true }),
        },
      };
    });
  }, []);

  const setPreference = useCallback(
    (pairId: string, label: PreferenceLabel) => {
      setDrafts((prev) => {
        const current = prev[pairId] || emptyDraft();
        return {
          ...prev,
          [pairId]: { ...current, label },
        };
      });
    },
    []
  );

  const resetAfterResult = useCallback(() => {
    setCalibration(null);
    setResult(null);
    setResultBanner(null);
    setEvaluationStartedAt(new Date().toISOString());
  }, []);

  const submitAssessment = useCallback(async () => {
    if (!dataset || !allPairsReady) {
      setError("Complete scores + preference on every pair before submitting.");
      return null;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setResultBanner(null);
      setCalibration(null);
      setResult(null);

      const session = await ensureAssessmentSession();
      const userId =
        (userIdHint && userIdHint !== "YOUR_TEST_USER_ID"
          ? userIdHint
          : null) || session.userId;
      setResolvedUserId(userId);

      const submissions = dataset.pairs.map((p) => {
        const d = drafts[p.pairId];
        const toNums = (s: DimensionScoreMap) =>
          Object.fromEntries(
            DIMENSIONS.map((dim) => [dim.key, Number(s[dim.key])])
          ) as Record<RubricDimensionKey, number>;
        if (!d.readA || !d.readB) {
          throw new Error(`Read receipts incomplete for ${p.pairId}`);
        }
        if (!d.label) {
          throw new Error(`Missing preference label for ${p.pairId}`);
        }
        return {
          pairId: p.pairId,
          label: d.label,
          scores: { A: toNums(d.scores.A), B: toNums(d.scores.B) },
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

      let banner = "";
      if (validate.hardFail) {
        const reason = validate.reason || json.reason || "";
        banner =
          reason === "INSUFFICIENT_EVALUATION_TIME"
            ? "Submission flagged: insufficient evaluation time (speed-runner anomaly). Status set to FAILED."
            : "Submission recorded. Critical policy alignment issue detected — status set to FAILED.";
      } else if (validate.pass || json.pass) {
        banner = `Calibration passed (${validate.scoring?.percent ?? json.finalScore ?? "—"}%). aiStatus advanced to ${json.status || "TIER1_PASSED"}.`;
      } else {
        banner = `Submission recorded (${validate.scoring?.percent ?? json.finalScore ?? "—"}%). Below pass threshold — keep calibrating.`;
      }
      setResultBanner(banner);

      const assessmentResult: AssessmentResult = {
        pass: Boolean(validate.pass || json.pass),
        hardFail: Boolean(validate.hardFail),
        finalScore: validate.scoring?.percent ?? json.finalScore,
        status: json.status,
        reason: validate.reason || json.reason,
        message: json.message || banner,
        validate,
        calibration: nextCalibration,
      };
      setResult(assessmentResult);
      return assessmentResult;
    } catch (e: any) {
      const message = e?.message || "Submit failed";
      setError(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    allPairsReady,
    dataset,
    drafts,
    evaluationStartedAt,
    userIdHint,
  ]);

  const workspace: RlhfWorkspaceState = {
    dataset,
    drafts,
    pairIndex,
    evaluationStartedAt,
    loading,
    userId: resolvedUserId,
    calibration,
    resultBanner,
    allPairsReady,
    setPairIndex,
    markRead,
    setPreference,
    resetAfterResult,
  };

  return {
    workspace,
    updateScore,
    submitAssessment,
    isSubmitting,
    error,
    result,
  };
}
