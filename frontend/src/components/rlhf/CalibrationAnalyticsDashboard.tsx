"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Flag,
  ShieldAlert,
  Target,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  CalibrationAnalytics,
  DIMENSIONS,
  DimensionDelta,
  RubricDimensionKey,
} from "@/lib/rlhfApi";

function dimensionLabel(key: RubricDimensionKey): string {
  return DIMENSIONS.find((d) => d.key === key)?.label || key;
}

function severityStyles(severity: "critical" | "warning" | "info") {
  if (severity === "critical") {
    return "border-rose-300 bg-rose-50 text-rose-950";
  }
  if (severity === "warning") {
    return "border-amber-300 bg-amber-50 text-amber-950";
  }
  return "border-slate-300 bg-slate-50 text-slate-800";
}

function DeltaBar({
  label,
  meanAbsDelta,
  meanSignedDelta,
  barRatio,
  animate,
}: {
  label: string;
  meanAbsDelta: number;
  meanSignedDelta: number;
  barRatio: number;
  animate: boolean;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, barRatio)) * 100);
  const driftTone =
    meanAbsDelta < 0.75
      ? "bg-emerald-500"
      : meanAbsDelta < 1.5
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="font-mono text-xs text-slate-600">
          |Δ| {meanAbsDelta.toFixed(2)}
          <span className="ml-2 text-slate-400">
            signed {meanSignedDelta >= 0 ? "+" : ""}
            {meanSignedDelta.toFixed(2)}
          </span>
        </p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            driftTone
          )}
          style={{ width: animate ? `${pct}%` : "0%" }}
        />
      </div>
    </div>
  );
}

function SideDeltaMatrix({
  deltas,
  side,
}: {
  deltas: DimensionDelta[];
  side: "A" | "B";
}) {
  const rows = deltas.filter((d) => d.side === side);
  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        Response {side}
      </p>
      <div className="space-y-2">
        {rows.map((d) => {
          const abs = Math.abs(d.delta);
          const tone =
            abs === 0
              ? "text-emerald-700"
              : abs <= 1
                ? "text-amber-700"
                : "text-rose-700";
          return (
            <div
              key={`${side}-${d.dimension}`}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 text-xs"
            >
              <span className="truncate text-slate-700">
                {dimensionLabel(d.dimension)}
              </span>
              <span className="font-mono text-slate-500">
                you {d.userScore}
              </span>
              <span className="font-mono text-slate-400">
                gold {d.goldScore}
              </span>
              <span className={cn("font-mono font-semibold", tone)}>
                {d.delta >= 0 ? "+" : ""}
                {d.delta}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalibrationAnalyticsDashboard({
  calibration,
}: {
  calibration: CalibrationAnalytics;
}) {
  const [animateBars, setAnimateBars] = useState(false);
  const [openPairId, setOpenPairId] = useState<string | null>(
    calibration.pairReveals[0]?.pairId ?? null
  );

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimateBars(true));
    return () => cancelAnimationFrame(t);
  }, [calibration]);

  const outcome = useMemo(() => {
    if (calibration.outcome === "passed") {
      return {
        icon: CheckCircle2,
        title: "Calibration passed",
        className: "border-emerald-300 bg-emerald-50/90 text-emerald-950",
        badge: "COMPLETED",
      };
    }
    if (calibration.outcome === "hard_fail") {
      return {
        icon: XCircle,
        title: "Hard fail — attempt rejected",
        className: "border-rose-300 bg-rose-50/90 text-rose-950",
        badge: "FAILED",
      };
    }
    return {
      icon: AlertTriangle,
      title: "Below pass threshold",
      className: "border-amber-300 bg-amber-50/90 text-amber-950",
      badge: "RETRY",
    };
  }, [calibration.outcome]);

  const OutcomeIcon = outcome.icon;

  return (
    <section
      className="animate-in fade-in slide-in-from-bottom-2 space-y-5 duration-500"
      aria-label="Calibration analytics dashboard"
    >
      <header
        className={cn(
          "relative overflow-hidden rounded-2xl border p-6 shadow-sm",
          outcome.className
        )}
      >
        <div className="absolute -right-8 top-0 h-32 w-32 rounded-full bg-white/40 blur-2xl" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <OutcomeIcon className="mt-0.5 h-6 w-6 shrink-0" />
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge className="bg-slate-900 text-white hover:bg-slate-900">
                  Step 9 · Calibration Analytics
                </Badge>
                <Badge variant="outline">{outcome.badge}</Badge>
              </div>
              <h2 className="font-serif text-2xl font-bold tracking-tight md:text-3xl">
                {outcome.title}
              </h2>
              <p className="mt-1 text-sm opacity-90">
                Score {calibration.percent}%
                {calibration.passThresholdPercent
                  ? ` · pass threshold ${calibration.passThresholdPercent}%`
                  : ""}
                {calibration.timing
                  ? ` · ${calibration.timing.elapsedSeconds}s on page`
                  : ""}
              </p>
              {calibration.reason && (
                <p className="mt-2 font-mono text-xs opacity-80">
                  reason: {calibration.reason}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4" />
            Gold anchors revealed for learning
          </div>
        </div>
      </header>

      {/* Error Delta Chart */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-teal-50/30 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Flag className="h-4 w-4 text-teal-700" />
          <h3 className="text-base font-bold text-slate-900">
            Error Delta Chart
          </h3>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Mean absolute distance between your scores and gold anchors across
          all four Core Rubric dimensions (scale max |Δ| = 4).
        </p>
        <div className="space-y-4">
          {calibration.errorDeltaChart.map((row) => (
            <DeltaBar
              key={row.dimension}
              label={row.label}
              meanAbsDelta={row.meanAbsDelta}
              meanSignedDelta={row.meanSignedDelta}
              barRatio={row.barRatio}
              animate={animateBars}
            />
          ))}
        </div>
      </div>

      {/* Misalignment Flags */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-700" />
          <h3 className="text-base font-bold text-slate-900">
            Misalignment Flags
          </h3>
        </div>
        {calibration.misalignmentFlags.length === 0 ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            No major misalignment traps detected. Preference labels and safety
            scoring stayed aligned with gold.
          </p>
        ) : (
          <ul className="space-y-2">
            {calibration.misalignmentFlags.map((flag, idx) => (
              <li
                key={`${flag.code}-${flag.pairId || "x"}-${idx}`}
                className={cn(
                  "rounded-lg border px-3 py-2.5 transition-opacity duration-500",
                  animateBars ? "opacity-100" : "opacity-0",
                  severityStyles(flag.severity)
                )}
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-white/70">
                    {flag.severity}
                  </Badge>
                  <span className="font-mono text-[11px] opacity-70">
                    {flag.code}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold">{flag.title}</p>
                <p className="mt-0.5 text-sm opacity-90">{flag.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Rationale Reveal */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-slate-700" />
          <h3 className="text-base font-bold text-slate-900">
            Rationale Reveal
          </h3>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Hidden gold labels, calibration targets, and dimension notes are now
          unlocked so you can see exactly where scoring drifted.
        </p>

        <div className="space-y-3">
          {calibration.pairReveals.map((pair) => {
            const open = openPairId === pair.pairId;
            return (
              <div
                key={pair.pairId}
                className="overflow-hidden rounded-xl border border-slate-200"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenPairId(open ? null : pair.pairId)
                  }
                  className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {pair.title}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">
                      you: {pair.submittedLabel} · gold: {pair.goldLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        pair.labelMatch
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : "border-rose-300 bg-rose-50 text-rose-800"
                      }
                    >
                      {pair.labelMatch ? "Label match" : "Label miss"}
                    </Badge>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-slate-500 transition-transform duration-300",
                        open && "rotate-180"
                      )}
                    />
                  </div>
                </button>

                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out",
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-4 px-4 py-4">
                      {pair.calibrationTarget && (
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold">Target: </span>
                          {pair.calibrationTarget}
                        </p>
                      )}

                      {pair.rationale && (
                        <>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Gold rationale
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-slate-800">
                              {pair.rationale.summary}
                            </p>
                          </div>

                          {pair.rationale.raterBlindSpot && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                              <span className="font-semibold">
                                Blind spot:{" "}
                              </span>
                              {pair.rationale.raterBlindSpot}
                            </div>
                          )}

                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Dimension notes
                            </p>
                            <dl className="space-y-2">
                              {Object.entries(
                                pair.rationale.dimensionNotes || {}
                              ).map(([dim, note]) => (
                                <div key={dim}>
                                  <dt className="text-sm font-semibold text-slate-800">
                                    {dim}
                                  </dt>
                                  <dd className="text-sm text-slate-600">
                                    {note}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        </>
                      )}

                      <Separator />

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Per-dimension delta matrix
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          <SideDeltaMatrix
                            deltas={pair.dimensionDeltas}
                            side="A"
                          />
                          <SideDeltaMatrix
                            deltas={pair.dimensionDeltas}
                            side="B"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
