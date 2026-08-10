"use client";

import { RlhfEvaluationWorkspace } from "@/components/rlhf/RlhfEvaluationWorkspace";
import { useRlhfAssessment } from "@/hooks/useRlhfAssessment";

export default function RlhfAssessmentPage() {
  const {
    workspace,
    updateScore,
    submitAssessment,
    isSubmitting,
    error,
    result,
  } = useRlhfAssessment("YOUR_TEST_USER_ID");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.08),_transparent_40%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
      <RlhfEvaluationWorkspace
        workspace={workspace}
        updateScore={updateScore}
        submitAssessment={submitAssessment}
        isSubmitting={isSubmitting}
        error={error}
        result={result}
      />
    </main>
  );
}
