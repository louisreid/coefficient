import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSignedUrlForPath } from "@/lib/fieldVideo/storage";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ captureId: string }> };

/**
 * GET /api/teacher/field-captures/[captureId]
 * Full capture + assessment for Capture Review UI. Teacher must own class.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { captureId } = await params;
  if (!captureId) {
    return new Response(
      JSON.stringify({ error: "Missing captureId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const capture = await prisma.evidenceCapture.findFirst({
    where: { id: captureId },
    include: {
      student: { select: { id: true, nickname: true } },
      captureAssessment: true,
    },
  });

  if (!capture) {
    return new Response(
      JSON.stringify({ error: "Capture not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const cls = await prisma.class.findFirst({
    where: { id: capture.classId, teacherId: session.user.id },
    select: { id: true },
  });
  if (!cls) {
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const mediaUrl = await getSignedUrlForPath(capture.storagePath);
  const thumbnailUrl = capture.thumbnailPath
    ? await getSignedUrlForPath(capture.thumbnailPath)
    : mediaUrl;

  return Response.json({
    capture: {
      id: capture.id,
      sessionId: capture.sessionId,
      studentId: capture.studentId,
      nickname: capture.student.nickname,
      classId: capture.classId,
      unitId: capture.unitId,
      stepId: capture.stepId,
      type: capture.type,
      createdAt: capture.createdAt.toISOString(),
      durationSeconds: capture.durationSeconds,
      notes: capture.notes,
      mediaUrl,
      thumbnailUrl,
    },
    assessment: capture.captureAssessment
      ? {
          id: capture.captureAssessment.id,
          aiOverallStatus: capture.captureAssessment.aiOverallStatus,
          aiConfidence: capture.captureAssessment.aiConfidence,
          aiChecks: capture.captureAssessment.aiChecks,
          aiSummary: capture.captureAssessment.aiSummary,
          aiQuestions: capture.captureAssessment.aiQuestions,
          triageFlags: capture.captureAssessment.triageFlags,
          trainerFinalStatus: capture.captureAssessment.trainerFinalStatus,
          trainerNote: capture.captureAssessment.trainerNote,
        }
      : null,
  });
}

/**
 * PATCH body: { trainerFinalStatus?, trainerNote? }
 * Update trainer override for this capture's assessment.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { captureId } = await params;
  if (!captureId) {
    return new Response(
      JSON.stringify({ error: "Missing captureId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const capture = await prisma.evidenceCapture.findFirst({
    where: { id: captureId },
    select: { classId: true, captureAssessment: { select: { id: true } } },
  });

  if (!capture) {
    return new Response(
      JSON.stringify({ error: "Capture not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const cls = await prisma.class.findFirst({
    where: { id: capture.classId, teacherId: session.user.id },
    select: { id: true },
  });
  if (!cls) {
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { trainerFinalStatus?: string; trainerNote?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const assessmentId = capture.captureAssessment?.id;
  if (!assessmentId) {
    return new Response(
      JSON.stringify({ error: "No assessment to update" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  await prisma.captureAssessment.update({
    where: { id: assessmentId },
    data: {
      ...(body.trainerFinalStatus != null && { trainerFinalStatus: body.trainerFinalStatus }),
      ...(body.trainerNote != null && { trainerNote: body.trainerNote }),
    },
  });

  return Response.json({ ok: true });
}
