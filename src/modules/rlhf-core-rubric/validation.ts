import { z } from "zod";

// Define the schema structure for a single response's 4 dimensions
const dimensionScoresSchema = z.object({
  helpfulness: z.number().int().min(1).max(5),
  factuality: z.number().int().min(1).max(5),
  safety: z.number().int().min(1).max(5),
  tone: z.number().int().min(1).max(5),
});

// Define the schema for a single evaluation pair answer block
const pairAnswerSchema = z.object({
  // Enums updated to support tie and both_bad variations
  chosenLabel: z.enum(["prefer_a", "prefer_b", "tie", "both_bad"]),
  scoresA: dimensionScoresSchema,
  scoresB: dimensionScoresSchema,
});

// Master evaluation payload schema validation map
export const validateAssessmentSchema = z.object({
  body: z.object({
    userId: z.string().uuid({ message: "Invalid user identifier format." }),
    evaluationStartedAt: z
      .string()
      .datetime({ message: "Invalid start timestamp format." }),
    answers: z.record(z.string(), pairAnswerSchema),
  }),
});

export type ValidateAssessmentBody = z.infer<
  typeof validateAssessmentSchema
>["body"];

/** Parse controller-style answers payload (rejects before DB work). */
export function parseAssessmentBody(body: unknown): ValidateAssessmentBody {
  const parsed = validateAssessmentSchema.safeParse({ body });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.filter((p) => p !== "body").join(".") || "body";
    throw new Error(`${path}: ${issue?.message || "invalid payload"}`);
  }
  return parsed.data.body;
}

// ---------------------------------------------------------------------------
// Legacy / service-path schemas (rubric dimension keys + submissions[])
// ---------------------------------------------------------------------------

/** Exactly the four Core Rubric dimensions — extras rejected via .strict(). */
export const dimensionScoreSchema = z
  .object({
    helpfulnessDirectness: z.number().int().min(1).max(5),
    truthfulnessFactuality: z.number().int().min(1).max(5),
    harmMitigationSafety: z.number().int().min(1).max(5),
    toneFormatting: z.number().int().min(1).max(5),
  })
  .strict();

export const pairSubmissionSchema = z
  .object({
    pairId: z.string().min(1),
    label: z.enum([
      "prefer_a",
      "prefer_b",
      "tie",
      "both_bad",
      "invalid_prompt",
    ]),
    scores: z
      .object({
        A: dimensionScoreSchema,
        B: dimensionScoreSchema,
      })
      .strict(),
    /** Client read-receipts — both must be true (anti-cheat). */
    readReceipts: z
      .object({
        readA: z.literal(true),
        readB: z.literal(true),
      })
      .strict(),
  })
  .strict();

export const validateSubmissionSchema = z
  .object({
    userId: z.string().uuid().optional(),
    /** ISO timestamp when candidate opened the evaluation workspace */
    evaluationStartedAt: z.string().datetime(),
    submissions: z.array(pairSubmissionSchema).min(1),
  })
  .strict();

export type ValidatedSubmissionPayload = z.infer<
  typeof validateSubmissionSchema
>;

export const MIN_EVALUATION_SECONDS = 45;
export const INSUFFICIENT_TIME_REASON = "INSUFFICIENT_EVALUATION_TIME";

export function parseValidatePayload(
  body: unknown
): ValidatedSubmissionPayload {
  const parsed = validateSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.join(".") || "payload";
    throw new Error(`${path}: ${issue?.message || "invalid payload"}`);
  }
  return parsed.data;
}

export function evaluateTimingGate(
  evaluationStartedAt: string,
  now = new Date()
) {
  const started = new Date(evaluationStartedAt);
  if (Number.isNaN(started.getTime())) {
    throw new Error("evaluationStartedAt: invalid datetime");
  }
  const elapsedMs = now.getTime() - started.getTime();
  const elapsedSeconds = elapsedMs / 1000;
  // Reject future clocks / absurd negative durations
  if (elapsedSeconds < 0) {
    throw new Error("evaluationStartedAt: cannot be in the future");
  }
  return {
    elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
    insufficientTime: elapsedSeconds < MIN_EVALUATION_SECONDS,
    minRequiredSeconds: MIN_EVALUATION_SECONDS,
  };
}
