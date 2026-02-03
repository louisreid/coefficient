import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFieldVideoUnitConfig } from "@/lib/fieldVideo/config";
import { getSignedUrlForPath } from "@/lib/fieldVideo/storage";

export const dynamic = "force-dynamic";

const DISCLAIMER =
  "This is for training feedback only. It is not a safety authority or substitute for local codes or supervisor sign-off.";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * GET ?classId= & studentId= & sessionId= OR captureId=
 * HTML evidence pack for field capture(s): single capture or full session.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const studentId = searchParams.get("studentId");
  const sessionId = searchParams.get("sessionId");
  const captureId = searchParams.get("captureId");

  if (!classId) {
    return new Response(
      JSON.stringify({ error: "Missing classId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: session.user.id },
    select: { id: true, name: true },
  });
  if (!cls) {
    return new Response(
      JSON.stringify({ error: "Class not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  let captures: Awaited<ReturnType<typeof prisma.evidenceCapture.findMany>>;
  if (captureId) {
    const one = await prisma.evidenceCapture.findFirst({
      where: { id: captureId, classId },
      include: {
        student: { select: { nickname: true, legalName: true, identityBoundAt: true } },
        captureAssessment: true,
      },
    });
    captures = one ? [one] : [];
  } else if (sessionId) {
    captures = await prisma.evidenceCapture.findMany({
      where: { sessionId, classId },
      orderBy: { createdAt: "asc" },
      include: {
        student: { select: { nickname: true, legalName: true, identityBoundAt: true } },
        captureAssessment: true,
      },
    });
  } else if (studentId) {
    captures = await prisma.evidenceCapture.findMany({
      where: { studentId, classId },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: {
        student: { select: { nickname: true, legalName: true, identityBoundAt: true } },
        captureAssessment: true,
      },
    });
  } else {
    return new Response(
      JSON.stringify({ error: "Provide captureId, sessionId, or studentId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (captures.length === 0) {
    return new Response(
      "<!DOCTYPE html><html><body><p>No captures found.</p></body></html>",
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  const student = captures[0]!.student;
  const unitConfig = getFieldVideoUnitConfig(captures[0]!.unitId);
  const unitName = unitConfig?.description ?? captures[0]!.unitId;

  const captureBlocks = await Promise.all(
    captures.map(async (c) => {
      const mediaUrl = await getSignedUrlForPath(c.storagePath);
      const ass = c.captureAssessment;
      const checks = (ass?.aiChecks as Array<{ checkId: string; status: string; evidence?: string }>) ?? [];
      const checksRows = checks
        .map(
          (ch) =>
            `<tr><td>${escapeHtml(ch.checkId)}</td><td>${escapeHtml(ch.status)}</td><td>${escapeHtml(ch.evidence ?? "")}</td></tr>`
        )
        .join("");
      const status = ass?.trainerFinalStatus ?? ass?.aiOverallStatus ?? "—";
      const trainerNote = ass?.trainerNote ?? "";
      return `
        <div class="capture-block">
          <h3>Step: ${escapeHtml(c.stepId)} — ${c.createdAt.toLocaleString()}</h3>
          ${mediaUrl ? `<p><img src="${escapeHtml(mediaUrl)}" alt="Capture" style="max-width:100%; height:auto;" /></p>` : ""}
          <p><strong>Overall:</strong> ${escapeHtml(String(status))}</p>
          ${ass?.aiSummary ? `<p>${escapeHtml(ass.aiSummary)}</p>` : ""}
          <table class="checks"><thead><tr><th>Check</th><th>Status</th><th>Evidence</th></tr></thead><tbody>${checksRows}</tbody></table>
          ${trainerNote ? `<p><strong>Trainer note:</strong> ${escapeHtml(trainerNote)}</p>` : ""}
        </div>
      `;
    })
  );

  const traineeLegal =
    student.legalName && student.identityBoundAt
      ? `Trainee (legal): ${escapeHtml(student.legalName)} (bound ${student.identityBoundAt.toLocaleDateString()})`
      : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Field evidence pack — ${escapeHtml(cls.name)} — ${escapeHtml(student.nickname)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #1e293b; line-height: 1.5; }
    h1 { font-size: 1.5rem; }
    h3 { font-size: 1.1rem; margin-top: 1.5rem; }
    .meta { color: #64748b; font-size: 0.9rem; margin-bottom: 1rem; }
    .capture-block { border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; }
    .checks { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .checks th, .checks td { border: 1px solid #e2e8f0; padding: 0.5rem; text-align: left; }
    .disclaimer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 0.85rem; color: #64748b; }
  </style>
</head>
<body>
  <h1>Field evidence pack — Coefficient Assess</h1>
  <div class="meta">
    <p><strong>Cohort:</strong> ${escapeHtml(cls.name)}</p>
    <p><strong>Unit:</strong> ${escapeHtml(unitName)}</p>
    <p><strong>Trainee:</strong> ${escapeHtml(student.nickname)}</p>
    ${traineeLegal ? `<p>${traineeLegal}</p>` : ""}
    <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
  </div>
  ${captureBlocks.join("")}
  <div class="disclaimer">${escapeHtml(DISCLAIMER)}</div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="field-evidence-${captures.length}-captures.html"`,
    },
  });
}
