"use client";

import { RlhfEvaluationWorkspace } from "@/components/rlhf/RlhfEvaluationWorkspace";

export default function RlhfAssessmentPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.08),_transparent_40%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
      <RlhfEvaluationWorkspace />
    </main>
  );
}
