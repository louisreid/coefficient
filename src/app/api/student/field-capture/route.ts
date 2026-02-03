import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { AssessmentSessionMode, EvidenceCaptureType } from "@prisma/client";
import { getFieldVideoUnitConfig } from "@/lib/fieldVideo/config";
import {
  buildStoragePath,
  uploadFieldCapture,
} from "@/lib/fieldVideo/storage";
import { runFieldAssess } from "@/lib/fieldVideo/assess";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST multipart: classId, studentId, unitId, stepId, optional sessionId; file: photo (required) or video + optional thumbnail.
 * Validates class allows uploads and student in class; uploads to Supabase; creates EvidenceCapture (+ AssessmentSession if needed); runs Gemini assess; returns capture + assessment.
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return new Response(
      JSON.stringify({ error: "Expected multipart/form-data" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let classId: string | null = null;
  let studentId: string | null = null;
  let unitId: string | null = null;
  let stepId: string | null = null;
  let sessionId: string | null = null;
  let notes: string | null = null;
  let photoBuffer: Buffer | null = null;
  let photoMime: string = "image/jpeg";

  const formData = await request.formData();
  classId = formData.get("classId") as string | null;
  studentId = formData.get("studentId") as string | null;
  unitId = formData.get("unitId") as string | null;
  stepId = formData.get("stepId") as string | null;
  sessionId = formData.get("sessionId") as string | null;
  notes = formData.get("notes") as string | null;

  if (!classId || !studentId || !unitId || !stepId) {
    return new Response(
      JSON.stringify({ error: "Missing classId, studentId, unitId, or stepId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: { allowMediaUploads: true },
  });
  if (!cls?.allowMediaUploads) {
    return new Response(
      JSON.stringify({ error: "Class does not allow media uploads" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, classId },
    select: { id: true },
  });
  if (!student) {
    return new Response(
      JSON.stringify({ error: "Student not in class" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const unitConfig = getFieldVideoUnitConfig(unitId);
  if (!unitConfig) {
    return new Response(
      JSON.stringify({ error: "Unknown unitId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const photoFile = formData.get("photo") as Blob | null;
  if (!photoFile || !(photoFile instanceof Blob)) {
    return new Response(
      JSON.stringify({ error: "Missing photo file" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const photoArrayBuffer = await photoFile.arrayBuffer();
  photoBuffer = Buffer.from(photoArrayBuffer);
  const photoType = photoFile.type;
  if (photoType && photoType.startsWith("image/")) {
    photoMime = photoType;
  }

  // Create capture record first to get captureId for path
  const captureId = crypto.randomUUID ? crypto.randomUUID() : `cap_${Date.now()}`;
  const ext = photoMime === "image/png" ? "png" : "jpg";
  const storagePath = buildStoragePath(classId, captureId, "photo", ext);

  const uploadResult = await uploadFieldCapture(
    storagePath,
    photoBuffer,
    photoMime
  );
  if (uploadResult.error) {
    return new Response(
      JSON.stringify({ error: "Upload failed: " + uploadResult.error }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let resolvedSessionId = sessionId;
  if (!resolvedSessionId) {
    const session = await prisma.assessmentSession.create({
      data: {
        classId,
        studentId,
        unitId,
        mode: AssessmentSessionMode.FIELD_VIDEO,
      },
    });
    resolvedSessionId = session.id;
  }

  const capture = await prisma.evidenceCapture.create({
    data: {
      id: captureId,
      sessionId: resolvedSessionId,
      studentId,
      classId,
      unitId,
      stepId,
      type: EvidenceCaptureType.PHOTO,
      storagePath: uploadResult.path,
      notes: notes ?? undefined,
    },
  });

  // Run Gemini assess and save CaptureAssessment
  const assessResult = await runFieldAssess({
    stepId,
    unitConfig,
    imageBuffer: photoBuffer,
    mimeType: photoMime,
  });

  let assessmentPayload: {
    aiOverallStatus: string | null;
    aiConfidence: number | null;
    aiChecks: unknown;
    aiSummary: string | null;
    aiQuestions: unknown;
    triageFlags: unknown;
  } = {
    aiOverallStatus: null,
    aiConfidence: null,
    aiChecks: null,
    aiSummary: null,
    aiQuestions: null,
    triageFlags: null,
  };

  if (assessResult.success) {
    const d = assessResult.data;
    const triageFlags = {
      redFlags: d.redFlags,
      criticalChecks: d.checks
        .filter((c) => c.status === "CRIT")
        .map((c) => c.checkId),
    };
    await prisma.captureAssessment.create({
      data: {
        captureId: capture.id,
        aiOverallStatus: d.overall.status,
        aiConfidence: d.overall.confidence,
        aiChecks: d.checks as unknown as object,
        aiSummary: d.summary,
        aiQuestions: d.askNext as unknown as object,
        triageFlags,
      },
    });
    assessmentPayload = {
      aiOverallStatus: d.overall.status,
      aiConfidence: d.overall.confidence,
      aiChecks: d.checks,
      aiSummary: d.summary,
      aiQuestions: d.askNext,
      triageFlags,
    };
  }

  return Response.json({
    captureId: capture.id,
    sessionId: resolvedSessionId,
    assessment: assessmentPayload,
    error: assessResult.success ? undefined : assessResult.error,
  });
}
