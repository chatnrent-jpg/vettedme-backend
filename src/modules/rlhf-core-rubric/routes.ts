import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import {
  getLessonBySlug,
  getModuleOverview,
  getPreferencePair,
  getPreferencePairs,
  getRubric,
  listLessons,
  updateProgress,
  validateAssessment,
} from "./controller";

const router = Router();

router.get("/", getModuleOverview);
router.get("/lessons", listLessons);

// Endpoint: GET /api/v1/modules/rlhf-core-rubric/lessons/:slug
router.get("/lessons/:slug", getLessonBySlug);

router.get("/rubric", getRubric);
router.get("/dataset/preference-pairs", getPreferencePairs);
router.get("/dataset/preference-pairs/:pairId", getPreferencePair);

// Browser GET helper — validate itself is POST-only
router.get("/validate", (_req, res) => {
  const accept = String(_req.headers.accept || "");
  const payload = {
    ok: true,
    method: "POST",
    path: "/api/v1/modules/rlhf-core-rubric/validate",
    auth: "Bearer <token> required",
    note: "Open this URL in a browser sends GET, which cannot submit an assessment. Use Postman, curl, or the evaluation workspace UI.",
    bodyExample: {
      userId: "<uuid>",
      evaluationStartedAt: "2026-08-10T20:00:00.000Z",
      answers: {
        "pair-01": {
          chosenLabel: "prefer_b",
          scoresA: { helpfulness: 2, factuality: 1, safety: 5, tone: 4 },
          scoresB: { helpfulness: 5, factuality: 5, safety: 5, tone: 4 },
        },
        "pair-02": {
          chosenLabel: "prefer_b",
          scoresA: { helpfulness: 5, factuality: 5, safety: 1, tone: 4 },
          scoresB: { helpfulness: 4, factuality: 5, safety: 5, tone: 5 },
        },
      },
    },
  };

  if (accept.includes("text/html")) {
    res.status(200).type("html").send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>RLHF Validate · POST only</title>
<style>
  body{font-family:ui-sans-serif,system-ui,sans-serif;margin:0;background:#f4f7f8;color:#14212b}
  main{max-width:42rem;margin:2rem auto;padding:1.5rem;background:#fff;border:1px solid #d7e0e6;border-radius:1rem}
  code,pre{background:#eef4f3;border-radius:.4rem}
  pre{padding:1rem;overflow:auto}
  h1{font-family:Georgia,serif}
  .badge{display:inline-block;background:#0f766e;color:#fff;padding:.2rem .55rem;border-radius:.35rem;font-size:.8rem}
</style></head>
<body><main>
  <p class="badge">POST ONLY</p>
  <h1>Validation endpoint</h1>
  <p>Browsers always use <strong>GET</strong> when you paste a URL. This route only accepts <strong>POST</strong> with a JSON body and Bearer token.</p>
  <p>Use <strong>Postman</strong>, <strong>curl</strong>, or the workspace at <code>/talent/assessment/rlhf</code>.</p>
  <pre>${JSON.stringify(payload.bodyExample, null, 2)}</pre>
</main></body></html>`);
    return;
  }

  res.status(200).json(payload);
});

// Endpoint: POST /api/v1/modules/rlhf-core-rubric/validate
router.post("/validate", authenticate, validateAssessment);

router.post("/progress", authenticate, updateProgress);

export default router;
