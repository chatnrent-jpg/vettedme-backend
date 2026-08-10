import fs from "fs/promises";
import path from "path";
import { EventEmitter } from "events";
import { logger } from "../../utils/logger";

export type RubricDimensionKey =
  | "helpfulnessDirectness"
  | "truthfulnessFactuality"
  | "harmMitigationSafety"
  | "toneFormatting";

export interface DimensionDelta {
  side: "A" | "B";
  dimension: RubricDimensionKey;
  userScore: number;
  goldScore: number;
  /** user_score - gold_score */
  delta: number;
}

export interface RlhfTelemetryEvent {
  eventType:
    | "VALIDATION_GRADED"
    | "HARD_FAIL_SAFETY"
    | "HARD_FAIL_INSUFFICIENT_TIME"
    | "PAYLOAD_REJECTED";
  timestamp: string;
  userId: string;
  datasetId?: string;
  elapsedSeconds?: number;
  pass?: boolean;
  percent?: number;
  aiStatus?: string;
  aiFailureReason?: string | null;
  pairDeltas?: Array<{
    pairId: string;
    labelMatch: boolean;
    submittedLabel?: string;
    goldLabel?: string;
    dimensionDeltas: DimensionDelta[];
    /** Mean abs delta across dimensions for this pair */
    meanAbsDelta?: number;
  }>;
  /** Aggregate struggle signal by dimension (mean abs delta) */
  dimensionStruggle?: Partial<Record<RubricDimensionKey, number>>;
  meta?: Record<string, unknown>;
}

const TELEMETRY_DIR = path.join(
  process.cwd(),
  "logs",
  "rlhf-telemetry"
);
const TELEMETRY_FILE = path.join(TELEMETRY_DIR, "rlhf-rater-telemetry.jsonl");

class RlhfTelemetryBus extends EventEmitter {
  async write(event: RlhfTelemetryEvent): Promise<void> {
    this.emit("telemetry", event);
    try {
      await fs.mkdir(TELEMETRY_DIR, { recursive: true });
      await fs.appendFile(TELEMETRY_FILE, `${JSON.stringify(event)}\n`, "utf8");
      logger.info("RLHF telemetry persisted", {
        eventType: event.eventType,
        userId: event.userId,
        file: TELEMETRY_FILE,
      });
    } catch (err: any) {
      // Justice: never invent success — log persistence failure explicitly
      logger.error("RLHF telemetry write failed", {
        error: err?.message,
        userId: event.userId,
        eventType: event.eventType,
      });
    }
  }
}

export const rlhfTelemetry = new RlhfTelemetryBus();

export function computeDimensionDeltas(
  submitted: {
    A: Record<RubricDimensionKey, number>;
    B: Record<RubricDimensionKey, number>;
  },
  gold: {
    A: Record<RubricDimensionKey, number>;
    B: Record<RubricDimensionKey, number>;
  }
): DimensionDelta[] {
  const keys: RubricDimensionKey[] = [
    "helpfulnessDirectness",
    "truthfulnessFactuality",
    "harmMitigationSafety",
    "toneFormatting",
  ];
  const out: DimensionDelta[] = [];
  for (const side of ["A", "B"] as const) {
    for (const dimension of keys) {
      const userScore = Number(submitted[side][dimension]);
      const goldScore = Number(gold[side][dimension]);
      out.push({
        side,
        dimension,
        userScore,
        goldScore,
        delta: userScore - goldScore,
      });
    }
  }
  return out;
}

export function aggregateDimensionStruggle(
  pairDeltas: Array<{ dimensionDeltas: DimensionDelta[] }>
): Partial<Record<RubricDimensionKey, number>> {
  const buckets: Record<RubricDimensionKey, number[]> = {
    helpfulnessDirectness: [],
    truthfulnessFactuality: [],
    harmMitigationSafety: [],
    toneFormatting: [],
  };
  for (const pair of pairDeltas) {
    for (const d of pair.dimensionDeltas) {
      buckets[d.dimension].push(Math.abs(d.delta));
    }
  }
  const struggle: Partial<Record<RubricDimensionKey, number>> = {};
  (Object.keys(buckets) as RubricDimensionKey[]).forEach((k) => {
    const arr = buckets[k];
    if (!arr.length) return;
    struggle[k] = Number(
      (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(3)
    );
  });
  return struggle;
}

export function telemetryFilePath() {
  return TELEMETRY_FILE;
}
