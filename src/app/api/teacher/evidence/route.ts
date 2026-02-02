import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROV_PRE_DIVE_GO_NO_GO, UNIT_LABELS } from "@/lib/competence/config";
import { computeScoringSummary } from "@/lib/competence/scoring";
import { logEvidenceExport } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** EPIC 3.3 — Block export if unresolved CriticalFail flags. */
function isExportBlocked(
  summary: { criticalFailsCount: number },
  override: { overrideStatus: string } | null
): boolean {
  if (summary.criticalFailsCount === 0) return false;
  return override == null;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const studentId = searchParams.get("studentId");
  const format = searchParams.get("format") ?? "html"; // html | json

  if (!classId || !studentId) {
    return new Response("Missing classId or studentId", { status: 400 });
  }

  const classInfo = await prisma.class.findFirst({
    where: { id: classId, teacherId: session.user.id },
    select: { id: true, name: true },
  });
  if (!classInfo) {
    return new Response("Cohort not found", { status: 404 });
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, classId },
    select: {
      id: true,
      nickname: true,
      legalName: true,
      identityBoundAt: true,
    },
  });
  if (!student) {
    return new Response("Trainee not found", { status: 404 });
  }

  const attempts = await prisma.attempt.findMany({
    where: { studentId, classId, skillTag: ROV_PRE_DIVE_GO_NO_GO },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      questionHash: true,
      prompt: true,
      correctAnswer: true,
      studentAnswer: true,
      isCorrect: true,
      metadata: true,
      createdAt: true,
    },
  });

  const summary = computeScoringSummary(
    attempts.map((a) => ({
      skillTag: ROV_PRE_DIVE_GO_NO_GO,
      isCorrect: a.isCorrect,
      metadata: a.metadata as { tags?: string[]; criticalFail?: boolean } | null,
    })),
    ROV_PRE_DIVE_GO_NO_GO
  );

  const override = await prisma.assessmentOverride.findUnique({
    where: {
      studentId_unitId: { studentId, unitId: ROV_PRE_DIVE_GO_NO_GO },
    },
    select: { overrideStatus: true, assessorNote: true, assessorId: true },
  });

  if (isExportBlocked(summary, override)) {
    return new Response(
      JSON.stringify({
        error: "Export blocked",
        reason:
          "Unresolved CriticalFail flags. Complete assessor review and set an override before exporting.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const displayStatus = override?.overrideStatus ?? summary.status;
  const unitName = UNIT_LABELS[ROV_PRE_DIVE_GO_NO_GO] ?? ROV_PRE_DIVE_GO_NO_GO;
  const dateRange =
    attempts.length > 0
      ? `${new Date(attempts[0].createdAt).toLocaleDateString()} — ${new Date(attempts[attempts.length - 1].createdAt).toLocaleDateString()}`
      : new Date().toLocaleDateString();

  const assessorIdentity = session.user.email ?? session.user.name ?? session.user.id;
  const traineeLegalIdentity =
    student.legalName && student.identityBoundAt
      ? { legalName: student.legalName, boundAt: student.identityBoundAt.toISOString() }
      : null;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Evidence pack — ${escapeHtml(classInfo.name)} — ${escapeHtml(student.nickname)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #1e293b; line-height: 1.5; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.15rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
    .meta { color: #64748b; font-size: 0.9rem; margin-bottom: 1rem; }
    .summary { background: #f8fafc; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
    .status { font-weight: 600; }
    .status.pass { color: #059669; }
    .status.borderline { color: #d97706; }
    .status.fail { color: #dc2626; }
    .transcript-item { border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.75rem; margin-bottom: 0.75rem; font-size: 0.9rem; }
    .critical-fail { background: #fef2f2; color: #dc2626; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
    .tags { font-size: 0.8rem; color: #64748b; margin-top: 0.25rem; }
    .sign-off { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 0.9rem; }
    @media print { body { margin: 1rem; } }
  </style>
</head>
<body>
  <h1>Evidence pack — Coefficient Assess</h1>
  <div class="meta">
    <p><strong>Cohort:</strong> ${escapeHtml(classInfo.name)}</p>
    <p><strong>Unit:</strong> ${escapeHtml(unitName)}</p>
    <p><strong>Trainee (pseudonym):</strong> ${escapeHtml(student.nickname)}</p>
    ${traineeLegalIdentity ? `<p><strong>Trainee (legal identity):</strong> ${escapeHtml(traineeLegalIdentity.legalName)} (bound ${new Date(traineeLegalIdentity.boundAt).toLocaleDateString()})</p>` : ""}
    <p><strong>Assessor:</strong> ${escapeHtml(String(assessorIdentity))}</p>
    <p><strong>Date:</strong> ${escapeHtml(dateRange)}</p>
  </div>

  <div class="summary">
    <h2>Scoring summary</h2>
    <p>Total scenarios attempted: ${summary.totalAttempted}</p>
    <p>Accuracy: ${summary.accuracyPct}%</p>
    <p>Critical fails: ${summary.criticalFailsCount}</p>
    <p class="status ${displayStatus.toLowerCase()}">Final status: ${displayStatus}${override != null ? " (assessor override)" : ""}</p>
    ${summary.topFailureModeTags.length > 0 ? `<p class="tags">Top failure mode tags: ${summary.topFailureModeTags.map((t) => t.tag).join(", ")}</p>` : ""}
  </div>

  <h2>Scenario transcript</h2>
  ${attempts.length === 0 ? "<p>No attempts recorded.</p>" : attempts.map((a, i) => {
    const meta = a.metadata as { tags?: string[]; criticalFail?: boolean; justification?: string } | null;
    const criticalBadge = meta?.criticalFail && !a.isCorrect ? '<span class="critical-fail">Critical fail</span>' : "";
    const tags = meta?.tags?.length ? `<p class="tags">Tags: ${meta.tags.join(", ")}</p>` : "";
    const justification = meta?.justification ? `<p>Justification: ${escapeHtml(meta.justification)}</p>` : "";
    return `<div class="transcript-item">
      <p><strong>#${i + 1}</strong> ${escapeHtml(a.prompt)}</p>
      <p>Chosen: <strong>${escapeHtml(a.studentAnswer)}</strong> — Correct: <strong>${escapeHtml(a.correctAnswer)}</strong> ${a.isCorrect ? "(correct)" : "(wrong)"} ${criticalBadge}</p>
      ${tags}
      ${justification}
    </div>`;
  }).join("")}

  <div class="sign-off">
    <h2>Assessor sign-off</h2>
    ${override?.assessorNote ? `<p><strong>Note:</strong> ${escapeHtml(override.assessorNote)}</p>` : ""}
    <p>Status: <strong>${displayStatus}</strong></p>
    <p>Exported from Coefficient Assess. This document is for audit and evidence purposes.</p>
  </div>
</body>
</html>`;

  const exportFormat = format === "json" ? "json" : "html";
  await logEvidenceExport({
    assessorId: session.user.id,
    studentId,
    unitId: ROV_PRE_DIVE_GO_NO_GO,
    classId,
    format: exportFormat,
  });

  if (format === "json") {
    const jsonPack = {
      evidencePack: {
        cohort: { id: classInfo.id, name: classInfo.name },
        unit: { id: ROV_PRE_DIVE_GO_NO_GO, name: unitName },
        traineePseudonym: student.nickname,
        traineeLegalIdentity: traineeLegalIdentity,
        assessorIdentity,
        dateRange,
        exportedAt: new Date().toISOString(),
        criteriaMapping: summary.topFailureModeTags,
        scoringSummary: {
          totalAttempted: summary.totalAttempted,
          accuracyPct: summary.accuracyPct,
          criticalFailsCount: summary.criticalFailsCount,
          status: displayStatus,
          assessorOverride: override != null,
        },
        citedEvidence: attempts.map((a, i) => ({
          index: i + 1,
          attemptId: a.id,
          questionHash: a.questionHash,
          prompt: a.prompt,
          studentAnswer: a.studentAnswer,
          correctAnswer: a.correctAnswer,
          isCorrect: a.isCorrect,
          createdAt: a.createdAt.toISOString(),
          metadata: a.metadata,
        })),
        signOff: {
          status: displayStatus,
          assessorNote: override?.assessorNote ?? null,
        },
      },
    };
    return new Response(JSON.stringify(jsonPack, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="evidence-${slug(student.nickname)}-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="evidence-${slug(student.nickname)}-${new Date().toISOString().slice(0, 10)}.html"`,
    },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slug(s: string): string {
  return s.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 24);
}
