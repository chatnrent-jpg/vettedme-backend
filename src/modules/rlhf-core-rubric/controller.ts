import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { AIStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler, AppError } from "../../middleware/errorHandler";
import { logger } from "../../utils/logger";
import { rlhfCoreRubricService } from "./service";
import { renderLessonPage, wantsHtml } from "./renderLessonHtml";
import {
  aggregateDimensionStruggle,
  computeDimensionDeltas,
  rlhfTelemetry,
} from "./telemetry";
import { buildCalibrationAnalytics } from "./calibration";

type CompactScores = {
  helpfulness: number;
  factuality: number;
  safety: number;
  tone: number;
};

// Interface mapping for expected incoming request payloads
interface UserSubmission {
  userId: string;
  evaluationStartedAt: string; // ISO string to catch speedrunners
  answers: {
    [pairId: string]: {
      chosenLabel: "prefer_a" | "prefer_b" | "tie" | "both_bad" | "invalid_prompt";
      scoresA: CompactScores;
      scoresB: CompactScores;
    };
  };
}

type GoldPairFile = {
  id: string;
  blindSpot?: string;
  goldLabel: "prefer_a" | "prefer_b" | string;
  goldAnchors: {
    responseA: CompactScores;
    responseB: CompactScores;
  };
};

function compactToRubric(scores: CompactScores) {
  return {
    helpfulnessDirectness: Number(scores.helpfulness),
    truthfulnessFactuality: Number(scores.factuality),
    harmMitigationSafety: Number(scores.safety),
    toneFormatting: Number(scores.tone),
  };
}

function rubricToCompact(scores: Record<string, number>): CompactScores {
  return {
    helpfulness: Number(scores.helpfulnessDirectness ?? scores.helpfulness),
    factuality: Number(scores.truthfulnessFactuality ?? scores.factuality),
    safety: Number(scores.harmMitigationSafety ?? scores.safety),
    tone: Number(scores.toneFormatting ?? scores.tone),
  };
}

/** Accept new `answers` shape or legacy `submissions[]` from the workspace UI. */
function normalizeSubmission(body: any, authUserId?: string): UserSubmission | null {
  const userId = String(authUserId || body?.userId || "");
  const evaluationStartedAt = String(body?.evaluationStartedAt || "");
  if (!userId || !evaluationStartedAt) return null;

  if (body?.answers && typeof body.answers === "object") {
    return { userId, evaluationStartedAt, answers: body.answers };
  }

  if (Array.isArray(body?.submissions)) {
    const answers: UserSubmission["answers"] = {};
    for (const sub of body.submissions) {
      const pairId = String(sub.pairId || "");
      if (!pairId) continue;
      answers[pairId] = {
        chosenLabel: sub.label,
        scoresA: rubricToCompact(sub.scores?.A || {}),
        scoresB: rubricToCompact(sub.scores?.B || {}),
      };
    }
    return { userId, evaluationStartedAt, answers };
  }

  return null;
}

/**
 * Read a lesson markdown file directly from disk by slug.
 * GET /api/v1/modules/rlhf-core-rubric/lessons/:slug
 *
 * Browser (Accept: text/html) → rendered HTML page
 * API / ?format=json → { slug, content }
 */
export const getLessonBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { slug } = req.params;

  // Prevent directory traversal attacks
  const safeSlug = path.basename(String(slug || ""));
  const filePath = path.join(__dirname, "content", `${safeSlug}.md`);

  try {
    if (!safeSlug || safeSlug !== String(slug || "")) {
      res.status(400).json({ error: "Invalid lesson slug" });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Lesson file not found" });
      return;
    }

    const markdownContent = fs.readFileSync(filePath, "utf-8");

    if (wantsHtml(req)) {
      res
        .status(200)
        .type("html")
        .send(renderLessonPage(safeSlug, markdownContent));
      return;
    }

    res.status(200).json({
      slug: safeSlug,
      content: markdownContent,
    });
  } catch (_error) {
    res.status(500).json({ error: "Failed to read lesson content" });
  }
};

/**
 * Grade candidate submissions against gold anchors.
 * POST /api/v1/modules/rlhf-core-rubric/validate
 *
 * - Speed-run gate (< 45s)
 * - pair-02 safety hard gate (scoresA.safety > 1)
 * - Label match (50) + MAE distance points (up to 50) per pair
 * - Prisma aiStatus / aiScore update
 */
export const validateAssessment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const submission = normalizeSubmission(req.body, req.user?.id);
    if (!submission) {
      res
        .status(400)
        .json({ error: "Missing required validation payload fields." });
      return;
    }

    const { userId, evaluationStartedAt, answers } = submission;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // 1. Anti-Cheat: Timing Check
    const startTime = new Date(evaluationStartedAt).getTime();
    if (Number.isNaN(startTime)) {
      res.status(400).json({ error: "evaluationStartedAt must be a valid ISO datetime" });
      return;
    }
    const endTime = Date.now();
    const elapsedSeconds = (endTime - startTime) / 1000;

    if (elapsedSeconds < 45) {
      const failedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          aiStatus: AIStatus.FAILED,
          aiScore: 0,
          aiFailureReason: "INSUFFICIENT_EVALUATION_TIME",
          aiLastAttemptAt: new Date(),
          aiCompletedAt: null,
        },
        select: {
          id: true,
          aiStatus: true,
          aiScore: true,
          aiFailureReason: true,
          aiLastAttemptAt: true,
          aiCompletedAt: true,
        },
      });

      await rlhfTelemetry.write({
        eventType: "HARD_FAIL_INSUFFICIENT_TIME",
        timestamp: new Date().toISOString(),
        userId,
        elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
        pass: false,
        percent: 0,
        aiStatus: AIStatus.FAILED,
        aiFailureReason: "INSUFFICIENT_EVALUATION_TIME",
      });

      res.status(422).json({
        pass: false,
        reason: "INSUFFICIENT_EVALUATION_TIME",
        message:
          "Assessment rejected. Evaluation completed too quickly to thoroughly review the material.",
        finalScore: 0,
        status: AIStatus.FAILED,
        result: {
          success: false,
          hardFail: true,
          pass: false,
          reason: "INSUFFICIENT_EVALUATION_TIME",
          scoring: { percent: 0, passThresholdPercent: 70 },
          user: failedUser,
          timing: {
            elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
            insufficientTime: true,
            minRequiredSeconds: 45,
          },
        },
      });
      return;
    }

    // Load Gold Standard Data
    const datasetPath = path.join(
      __dirname,
      "dataset",
      "preference-pairs.json"
    );
    const goldPairs = JSON.parse(
      fs.readFileSync(datasetPath, "utf-8")
    ) as GoldPairFile[];

    if (!Array.isArray(goldPairs) || !goldPairs.length) {
      res.status(500).json({ error: "Gold evaluation dataset unavailable" });
      return;
    }

    let totalScore = 0;
    const maxPossibleScore = goldPairs.length * 100; // 100 points max per pair
    const pairResults: Array<{
      pairId: string;
      submittedLabel: string;
      goldLabel: string;
      labelMatch: boolean;
      dimensionDeltas: ReturnType<typeof computeDimensionDeltas>;
      meanAbsDelta: number;
      pairPoints: number;
    }> = [];

    // 2. Evaluate Each Submission Pair
    for (const gold of goldPairs) {
      const userAns = answers[gold.id];
      if (!userAns) {
        res
          .status(400)
          .json({ error: `Missing answers for pair evaluation: ${gold.id}` });
        return;
      }

      // --- CRITICAL HARM MITIGATION SAFETY GATE CHECK ---
      // If evaluating pair-02 (the jailbreak screenplay) and user scores harmful Response A above a 1 on Safety
      if (gold.id === "pair-02" && Number(userAns.scoresA.safety) > 1) {
        const failedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            aiStatus: AIStatus.FAILED,
            aiScore: 0,
            aiFailureReason: "CRITICAL_SAFETY_GATE_VIOLATION",
            aiLastAttemptAt: new Date(),
            aiCompletedAt: null,
          },
          select: {
            id: true,
            aiStatus: true,
            aiScore: true,
            aiFailureReason: true,
            aiLastAttemptAt: true,
            aiCompletedAt: true,
          },
        });

        await rlhfTelemetry.write({
          eventType: "HARD_FAIL_SAFETY",
          timestamp: new Date().toISOString(),
          userId,
          elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
          pass: false,
          percent: 0,
          aiStatus: AIStatus.FAILED,
          aiFailureReason: "CRITICAL_SAFETY_GATE_VIOLATION",
          meta: { unsafeASafety: userAns.scoresA.safety },
        });

        const partialPairs = goldPairs.map((g) => {
          const ans = answers[g.id];
          const deltas = ans
            ? computeDimensionDeltas(
                {
                  A: compactToRubric(ans.scoresA),
                  B: compactToRubric(ans.scoresB),
                },
                {
                  A: compactToRubric(g.goldAnchors.responseA),
                  B: compactToRubric(g.goldAnchors.responseB),
                }
              )
            : [];
          return {
            pairId: g.id,
            submittedLabel: ans?.chosenLabel || "—",
            goldLabel: g.goldLabel,
            labelMatch: ans?.chosenLabel === g.goldLabel,
            dimensionDeltas: deltas,
            meanAbsDelta: deltas.length
              ? Number(
                  (
                    deltas.reduce((a, d) => a + Math.abs(d.delta), 0) /
                    deltas.length
                  ).toFixed(4)
                )
              : 0,
          };
        });
        const struggle = aggregateDimensionStruggle(partialPairs);
        const calibration = buildCalibrationAnalytics({
          hardFail: true,
          pass: false,
          reason: "CRITICAL_SAFETY_GATE_VIOLATION",
          percent: 0,
          passThresholdPercent: 70,
          timing: {
            elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
            insufficientTime: false,
            minRequiredSeconds: 45,
          },
          goldPairs: goldPairs.map((g) => ({
            pairId: g.id,
            title: g.blindSpot || g.id,
            goldLabel: g.goldLabel,
            suggestedScores: {
              A: compactToRubric(g.goldAnchors.responseA),
              B: compactToRubric(g.goldAnchors.responseB),
            },
          })),
          submissions: Object.entries(answers).map(([pairId, ans]) => ({
            pairId,
            label: ans.chosenLabel,
            scores: {
              A: compactToRubric(ans.scoresA),
              B: compactToRubric(ans.scoresB),
            },
          })),
          pairResults: partialPairs,
          dimensionStruggle: struggle,
        });

        res.status(422).json({
          pass: false,
          reason: "CRITICAL_SAFETY_GATE_VIOLATION",
          message:
            "Critical safety violation. Harmful response options must receive a strict safety rating of 1.",
          finalScore: 0,
          status: AIStatus.FAILED,
          result: {
            success: false,
            hardFail: true,
            pass: false,
            reason: "CRITICAL_SAFETY_GATE_VIOLATION",
            scoring: { percent: 0, passThresholdPercent: 70 },
            calibration,
            user: failedUser,
          },
        });
        return;
      }

      // Component A: Label Match (50 points)
      let pairPoints = 0;
      const labelMatch = userAns.chosenLabel === gold.goldLabel;
      if (labelMatch) {
        pairPoints += 50;
      }

      // Component B: Distance Matrix Penalty (Up to 50 points based on Mean Absolute Error)
      let absoluteErrorSum = 0;
      const dimensions = [
        "helpfulness",
        "factuality",
        "safety",
        "tone",
      ] as const;

      for (const dim of dimensions) {
        absoluteErrorSum += Math.abs(
          Number(userAns.scoresA[dim]) - Number(gold.goldAnchors.responseA[dim])
        );
        absoluteErrorSum += Math.abs(
          Number(userAns.scoresB[dim]) - Number(gold.goldAnchors.responseB[dim])
        );
      }

      const totalDimensionsChecked = 8; // 4 dims * 2 responses
      const meanAbsoluteError = absoluteErrorSum / totalDimensionsChecked;

      // Calculate scaling factor: Max error per dimension is 4 (5-1)
      const scoreDistancePoints = Math.max(
        0,
        50 * (1 - meanAbsoluteError / 4)
      );
      pairPoints += scoreDistancePoints;
      totalScore += pairPoints;

      const dimensionDeltas = computeDimensionDeltas(
        {
          A: compactToRubric(userAns.scoresA),
          B: compactToRubric(userAns.scoresB),
        },
        {
          A: compactToRubric(gold.goldAnchors.responseA),
          B: compactToRubric(gold.goldAnchors.responseB),
        }
      );

      pairResults.push({
        pairId: gold.id,
        submittedLabel: userAns.chosenLabel,
        goldLabel: gold.goldLabel,
        labelMatch,
        dimensionDeltas,
        meanAbsDelta: Number(meanAbsoluteError.toFixed(4)),
        pairPoints: Number(pairPoints.toFixed(2)),
      });
    }

    // 3. Determine Passing Threshold & DB Update
    const finalBlendedPercentage = Math.round(
      (totalScore / maxPossibleScore) * 100
    );
    const didPass = finalBlendedPercentage >= 70;
    const computedStatus = didPass ? AIStatus.TIER1_PASSED : AIStatus.FAILED;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        aiStatus: computedStatus,
        aiScore: finalBlendedPercentage,
        aiTier1Score: finalBlendedPercentage,
        aiFailureReason: didPass ? null : "SCORE_BELOW_PASSING_THRESHOLD",
        aiLastAttemptAt: new Date(),
        aiCompletedAt: didPass ? new Date() : null,
        aiSessionId: "rlhf-core-rubric:validate:controller",
      },
      select: {
        id: true,
        aiStatus: true,
        aiScore: true,
        aiTier1Score: true,
        aiFailureReason: true,
        aiLastAttemptAt: true,
        aiCompletedAt: true,
      },
    });

    const dimensionStruggle = aggregateDimensionStruggle(pairResults);
    const calibration = buildCalibrationAnalytics({
      hardFail: false,
      pass: didPass,
      reason: didPass ? null : "SCORE_BELOW_PASSING_THRESHOLD",
      percent: finalBlendedPercentage,
      passThresholdPercent: 70,
      timing: {
        elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
        insufficientTime: false,
        minRequiredSeconds: 45,
      },
      goldPairs: goldPairs.map((g) => ({
        pairId: g.id,
        title: g.blindSpot || g.id,
        goldLabel: g.goldLabel,
        suggestedScores: {
          A: compactToRubric(g.goldAnchors.responseA),
          B: compactToRubric(g.goldAnchors.responseB),
        },
      })),
      submissions: Object.entries(answers).map(([pairId, ans]) => ({
        pairId,
        label: ans.chosenLabel,
        scores: {
          A: compactToRubric(ans.scoresA),
          B: compactToRubric(ans.scoresB),
        },
      })),
      pairResults,
      dimensionStruggle,
    });

    await rlhfTelemetry.write({
      eventType: "VALIDATION_GRADED",
      timestamp: new Date().toISOString(),
      userId,
      elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
      pass: didPass,
      percent: finalBlendedPercentage,
      aiStatus: computedStatus,
      aiFailureReason: updatedUser.aiFailureReason,
      pairDeltas: pairResults.map((p) => ({
        pairId: p.pairId,
        labelMatch: p.labelMatch,
        submittedLabel: p.submittedLabel,
        goldLabel: p.goldLabel,
        dimensionDeltas: p.dimensionDeltas,
        meanAbsDelta: p.meanAbsDelta,
      })),
      dimensionStruggle,
    });

    res.status(200).json({
      pass: didPass,
      finalScore: finalBlendedPercentage,
      status: computedStatus,
      result: {
        success: true,
        hardFail: false,
        pass: didPass,
        reason: didPass ? undefined : "SCORE_BELOW_PASSING_THRESHOLD",
        scoring: {
          percent: finalBlendedPercentage,
          passThresholdPercent: 70,
          rawTotal: Number(totalScore.toFixed(2)),
          rawMax: maxPossibleScore,
        },
        pairResults,
        calibration,
        user: updatedUser,
      },
    });
  } catch (error: any) {
    logger.error("Validation engine error", { error: error?.message });
    res
      .status(500)
      .json({ error: "Internal validation engine error occurred." });
  }
};

export const getModuleOverview = asyncHandler(
  async (_req: Request, res: Response) => {
    const overview = await rlhfCoreRubricService.getOverview();
    res.status(200).json({ success: true, module: overview });
  }
);

export const listLessons = asyncHandler(async (_req: Request, res: Response) => {
  const lessons = await rlhfCoreRubricService.listLessons();
  res.status(200).json({
    success: true,
    moduleId: "rlhf-core-rubric",
    lessons,
  });
});

/** Manifest-aware lesson fetch (enriched metadata + markdown). */
export const getLesson = asyncHandler(async (req: Request, res: Response) => {
  const slug = String(req.params.slug || "");
  const lesson = await rlhfCoreRubricService.getLesson(slug);
  res.status(200).json({
    success: true,
    moduleId: "rlhf-core-rubric",
    lesson: {
      ...lesson.meta,
      contentMarkdown: lesson.markdown,
    },
  });
});

export const getRubric = asyncHandler(async (_req: Request, res: Response) => {
  const rubric = await rlhfCoreRubricService.getRubric();
  res.status(200).json({
    success: true,
    moduleId: "rlhf-core-rubric",
    rubric,
  });
});

export const getPreferencePairs = asyncHandler(
  async (req: Request, res: Response) => {
    const mode = String(req.query.mode || "full").toLowerCase();
    const dataset =
      mode === "candidate"
        ? await rlhfCoreRubricService.getCandidatePreferencePairDataset()
        : await rlhfCoreRubricService.getPreferencePairDataset();
    res.status(200).json({
      success: true,
      moduleId: "rlhf-core-rubric",
      mode: mode === "candidate" ? "candidate" : "full",
      dataset,
    });
  }
);

export const getPreferencePair = asyncHandler(
  async (req: Request, res: Response) => {
    const pairId = String(req.params.pairId || "");
    const result = await rlhfCoreRubricService.getPreferencePair(pairId);
    res.status(200).json({
      success: true,
      moduleId: "rlhf-core-rubric",
      ...result,
    });
  }
);

/** @deprecated Prefer validateAssessment — kept as thin alias. */
export const validateSubmission = validateAssessment;

export const updateProgress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id || req.body.userId;
    if (!userId) {
      throw new AppError("userId required (auth token or body)", 400);
    }

    const { lessonSlug, completed } = req.body || {};
    const progress = await rlhfCoreRubricService.updateProgress({
      userId: String(userId),
      lessonSlug: lessonSlug ? String(lessonSlug) : undefined,
      completed: Boolean(completed),
    });

    res.status(200).json({
      success: true,
      message: "Module progress updated",
      progress,
    });
  }
);
