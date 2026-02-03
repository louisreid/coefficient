import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getFieldVideoUnitsForCohort } from "@/lib/fieldVideo/config";

export const dynamic = "force-dynamic";

/**
 * GET ?classId= & studentId=
 * Validate student in class; return allowMediaUploads and fieldVideoUnits for play page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const studentId = searchParams.get("studentId");

  if (!classId || !studentId) {
    return new Response(
      JSON.stringify({ error: "Missing classId or studentId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
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

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: { allowMediaUploads: true },
  });
  if (!cls) {
    return new Response(
      JSON.stringify({ error: "Class not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const fieldVideoUnits = cls.allowMediaUploads
    ? getFieldVideoUnitsForCohort().map((u) => ({
        unitId: u.unitId,
        description: u.description,
        steps: u.steps,
      }))
    : [];

  return Response.json({
    allowMediaUploads: cls.allowMediaUploads,
    fieldVideoUnits,
  });
}
