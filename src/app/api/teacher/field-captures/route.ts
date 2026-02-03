import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSignedUrlForPath } from "@/lib/fieldVideo/storage";

export const dynamic = "force-dynamic";

/**
 * GET ?classId=
 * List recent EvidenceCaptures for the class with thumbnails, overall status, triage counts.
 * Teacher must own the class.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  if (!classId) {
    return new Response(
      JSON.stringify({ error: "Missing classId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: session.user.id },
    select: { id: true },
  });
  if (!cls) {
    return new Response(
      JSON.stringify({ error: "Class not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const captures = await prisma.evidenceCapture.findMany({
    where: { classId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      studentId: true,
      unitId: true,
      stepId: true,
      type: true,
      createdAt: true,
      storagePath: true,
      thumbnailPath: true,
      notes: true,
      captureAssessment: {
        select: {
          aiOverallStatus: true,
          aiConfidence: true,
          triageFlags: true,
        },
      },
      student: { select: { nickname: true } },
    },
  });

  const withThumbnailUrls = await Promise.all(
    captures.map(async (c) => {
      let thumbnailUrl: string | null = null;
      if (c.thumbnailPath) {
        thumbnailUrl = await getSignedUrlForPath(c.thumbnailPath);
      } else if (c.storagePath && c.type === "PHOTO") {
        thumbnailUrl = await getSignedUrlForPath(c.storagePath);
      }
      const triage = (c.captureAssessment?.triageFlags as { redFlags?: string[]; criticalChecks?: string[] }) ?? {};
      const triageCount = (triage.redFlags?.length ?? 0) + (triage.criticalChecks?.length ?? 0);
      return {
        id: c.id,
        studentId: c.studentId,
        nickname: c.student.nickname,
        unitId: c.unitId,
        stepId: c.stepId,
        type: c.type,
        createdAt: c.createdAt.toISOString(),
        thumbnailUrl,
        notes: c.notes,
        overallStatus: c.captureAssessment?.aiOverallStatus ?? null,
        confidence: c.captureAssessment?.aiConfidence ?? null,
        triageCount,
      };
    })
  );

  return Response.json({ captures: withThumbnailUrls });
}
