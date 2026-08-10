"use client";

import { useMemo, useRef, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  DIMENSIONS,
  DimensionScoreMap,
  PreferenceLabel,
  RubricDimensionKey,
} from "@/lib/rlhfApi";
import { CalibrationAnalyticsDashboard } from "@/components/rlhf/CalibrationAnalyticsDashboard";
import {
  AssessmentResult,
  RlhfWorkspaceState,
  Side,
  useRlhfAssessment,
} from "@/hooks/useRlhfAssessment";

function scoresComplete(scores: DimensionScoreMap): boolean {
  return DIMENSIONS.every((d) => {
    const v = scores[d.key];
    return typeof v === "number" && v >= 1 && v <= 5;
  });
}

function ScorePad({
  value,
  onChange,
  accent,
}: {
  value: number | null;
  onChange: (n: number) => void;
  accent: "a" | "b";
}) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "h-9 w-9 rounded-md border text-sm font-semibold transition-all",
              active
                ? accent === "a"
                  ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                  : "border-slate-800 bg-slate-800 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            )}
            aria-label={`Score ${n}`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

function ResponsePane({
  side,
  title,
  body,
  scores,
  onScore,
  onReadComplete,
  readComplete,
}: {
  side: Side;
  title: string;
  body: string;
  scores: DimensionScoreMap;
  onScore: (key: RubricDimensionKey, value: number) => void;
  onReadComplete: () => void;
  readComplete: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const accent = side === "A" ? "a" : "b";

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el || readComplete) return;
    const reached =
      el.scrollTop + el.clientHeight >= el.scrollHeight - 24 ||
      el.scrollHeight <= el.clientHeight + 8;
    if (reached) onReadComplete();
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || readComplete) return;
    if (el.scrollHeight <= el.clientHeight + 8) onReadComplete();
  }, [body, readComplete, onReadComplete]);

  return (
    <section
      className={cn(
        "flex min-h-[34rem] flex-col overflow-hidden rounded-xl border bg-white shadow-sm",
        side === "A" ? "border-teal-200" : "border-slate-300"
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between border-b px-4 py-3",
          side === "A" ? "bg-teal-50/80" : "bg-slate-50"
        )}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Response {side}
          </p>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>
        <Badge
          variant="outline"
          className={cn(
            readComplete
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-amber-300 bg-amber-50 text-amber-800"
          )}
        >
          {readComplete ? "Read" : "Scroll to end"}
        </Badge>
      </header>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="prose prose-slate max-w-none flex-1 overflow-y-auto px-4 py-4 text-sm leading-relaxed"
      >
        <pre className="whitespace-pre-wrap font-sans text-[0.95rem] text-slate-800">
          {body}
        </pre>
      </div>

      <div className="border-t bg-slate-50/70 px-4 py-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Rubric scores (1–5)
        </p>
        <div className="space-y-3">
          {DIMENSIONS.map((dim) => (
            <div
              key={`${side}-${dim.key}`}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">{dim.label}</p>
                {dim.key === "harmMitigationSafety" && (
                  <p className="text-xs text-slate-500">
                    Score carefully — safety failures cannot be preferred.
                  </p>
                )}
              </div>
              <ScorePad
                value={scores[dim.key]}
                onChange={(n) => onScore(dim.key, n)}
                accent={accent}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export interface RlhfEvaluationWorkspaceProps {
  workspace: RlhfWorkspaceState;
  updateScore: (
    pairId: string,
    side: Side,
    key: RubricDimensionKey,
    value: number
  ) => void;
  submitAssessment: () => Promise<AssessmentResult | null>;
  isSubmitting: boolean;
  error: string | null;
  result: AssessmentResult | null;
}

/** Presentational workspace driven by `useRlhfAssessment`. */
export function RlhfEvaluationWorkspace({
  workspace,
  updateScore,
  submitAssessment,
  isSubmitting,
  error,
  result,
}: RlhfEvaluationWorkspaceProps) {
  const {
    dataset,
    drafts,
    pairIndex,
    loading,
    calibration,
    resultBanner,
    allPairsReady,
    setPairIndex,
    markRead,
    setPreference,
    resetAfterResult,
  } = workspace;

  const pair = dataset?.pairs[pairIndex] || null;
  const draft = pair ? drafts[pair.pairId] : null;

  const pairReady = useMemo(() => {
    if (!draft) return false;
    return (
      draft.readA &&
      draft.readB &&
      scoresComplete(draft.scores.A) &&
      scoresComplete(draft.scores.B)
    );
  }, [draft]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading RLHF evaluation workspace…
      </div>
    );
  }

  if (!dataset || !pair || !draft) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        {error || "No evaluation pairs available."}
      </div>
    );
  }

  if (calibration || result?.calibration) {
    const cal = calibration || result!.calibration!;
    return (
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-6">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}
        {(resultBanner || result?.message) && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950">
            {resultBanner || result?.message}
          </div>
        )}
        <CalibrationAnalyticsDashboard calibration={cal} />
        <div className="flex justify-end">
          <Button variant="outline" onClick={resetAfterResult}>
            Review pairs again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-6">
      <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 p-6 shadow-sm">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="relative">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className="bg-slate-900 text-white hover:bg-slate-900">
              Module 1
            </Badge>
            <Badge variant="outline">{dataset.datasetId}</Badge>
            <Badge variant="outline">
              Pair {pairIndex + 1} / {dataset.pairs.length}
            </Badge>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            RLHF Evaluation Workspace
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Read both responses fully, score all four Core Rubric dimensions,
            then select a preference. Truthfulness and safety outrank polish.
          </p>
        </div>
      </header>

      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-amber-950">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold">Operational reminder</p>
          <p className="text-amber-900/90">
            If a response enables harm, credential theft, or other disallowed
            assistance, it cannot win a preference — even when it is fluent,
            specific, or well formatted. Score Safety honestly before choosing.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Prompt
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">{pair.title}</h2>
        <Separator className="my-3" />
        <p className="whitespace-pre-wrap text-[0.98rem] leading-relaxed text-slate-800">
          {pair.prompt.text}
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ResponsePane
          side="A"
          title="Candidate A"
          body={pair.responseA.text}
          scores={draft.scores.A}
          readComplete={draft.readA}
          onReadComplete={() => markRead(pair.pairId, "A")}
          onScore={(key, value) => updateScore(pair.pairId, "A", key, value)}
        />
        <ResponsePane
          side="B"
          title="Candidate B"
          body={pair.responseB.text}
          scores={draft.scores.B}
          readComplete={draft.readB}
          onReadComplete={() => markRead(pair.pairId, "B")}
          onScore={(key, value) => updateScore(pair.pairId, "B", key, value)}
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-teal-700" />
          <h3 className="text-base font-bold text-slate-900">Preference</h3>
        </div>

        {!pairReady && (
          <p className="mb-3 flex items-start gap-2 text-sm text-slate-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
            Finish reading both responses and complete all 1–5 dimension scores
            to unlock preference selection.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["prefer_a", "Prefer A"],
              ["prefer_b", "Prefer B"],
              ["tie", "Tie"],
              ["both_bad", "Both bad"],
            ] as Array<[PreferenceLabel, string]>
          ).map(([value, label]) => {
            const active = draft.label === value;
            return (
              <button
                key={value}
                type="button"
                disabled={!pairReady}
                onClick={() => setPreference(pair.pairId, value)}
                className={cn(
                  "rounded-lg border px-4 py-3 text-sm font-semibold transition-all",
                  !pairReady && "cursor-not-allowed opacity-45",
                  active
                    ? "border-slate-900 bg-slate-900 text-white shadow"
                    : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-400"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <footer className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={pairIndex === 0}
            onClick={() => setPairIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={pairIndex >= dataset.pairs.length - 1}
            onClick={() =>
              setPairIndex((i) => Math.min(dataset.pairs.length - 1, i + 1))
            }
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <Button
            size="lg"
            disabled={!allPairsReady || isSubmitting}
            onClick={() => {
              void submitAssessment();
            }}
            className="bg-teal-700 hover:bg-teal-800"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Submit evaluation
              </>
            )}
          </Button>
          <p className="text-xs text-slate-500">
            {allPairsReady
              ? "All pairs complete — ready to grade against gold harness."
              : "Complete scores + preference on every pair to submit."}
          </p>
        </div>
      </footer>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {resultBanner && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950">
          {resultBanner}
        </div>
      )}
    </div>
  );
}

/** Convenience wrapper that owns the hook for standalone mounts. */
export function RlhfEvaluationWorkspaceConnected({
  userId = "YOUR_TEST_USER_ID",
}: {
  userId?: string;
}) {
  const assessment = useRlhfAssessment(userId);
  return <RlhfEvaluationWorkspace {...assessment} />;
}
