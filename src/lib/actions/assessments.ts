"use server";

import { prisma } from "@/lib/db";
import { ROV_PRE_DIVE_GO_NO_GO } from "@/lib/competence/config";
import {
  computeScoringSummary,
  type AssessmentStatus,
  type ScoringSummary,
} from "@/lib/competence/scoring";

export type TraineeAssessmentSummary = {
  studentId: string;
  nickname: string;
  summary: ScoringSummary;
  overrideStatus: AssessmentStatus | null;
  overrideNote: string | null;
};

export async function getTraineeAssessmentSummaries(
  classId: string,
  teacherId: string,
  unitId: string = ROV_PRE_DIVE_GO_NO_GO
) {
  const classInfo = await prisma.class.findFirst({
    where: { id: classId, teacherId },
  });
  if (!classInfo) return null;

  const students = await prisma.student.findMany({
    where: { classId },
    select: { id: true, nickname: true },
  });

  const attempts = await prisma.attempt.findMany({
    where: { classId, skillTag: unitId },
    orderBy: { createdAt: "asc" },
    select: {
      studentId: true,
      isCorrect: true,
      skillTag: true,
      metadata: true,
    },
  });

  const overrides = await prisma.assessmentOverride.findMany({
    where: { studentId: { in: students.map((s) => s.id) }, unitId },
    select: { studentId: true, overrideStatus: true, assessorNote: true },
  });
  const overrideMap = new Map(
    overrides.map((o) => [o.studentId, { status: o.overrideStatus as AssessmentStatus, note: o.assessorNote }])
  );

  const result: TraineeAssessmentSummary[] = students.map((student) => {
    const studentAttempts = attempts.filter((a) => a.studentId === student.id);
    const summary = computeScoringSummary(
      studentAttempts.map((a) => ({
        skillTag: a.skillTag,
        isCorrect: a.isCorrect,
        metadata: a.metadata as { tags?: string[]; criticalFail?: boolean } | null,
      })),
      unitId
    );
    const override = overrideMap.get(student.id);
    return {
      studentId: student.id,
      nickname: student.nickname,
      summary,
      overrideStatus: override?.status ?? null,
      overrideNote: override?.note ?? null,
    };
  });

  return result;
}

export async function saveAssessmentOverrideAction(
  studentId: string,
  unitId: string,
  overrideStatus: AssessmentStatus,
  assessorNote: string | null,
  assessorId: string
) {
  await prisma.assessmentOverride.upsert({
    where: {
      studentId_unitId: { studentId, unitId },
    },
    create: {
      studentId,
      unitId,
      overrideStatus,
      assessorNote: assessorNote ?? undefined,
      assessorId,
    },
    update: {
      overrideStatus,
      assessorNote: assessorNote ?? undefined,
      assessorId,
    },
  });
}

export type OverrideFormState = { ok: boolean; error?: string };

export async function saveOverrideFormAction(
  _prev: OverrideFormState,
  formData: FormData
): Promise<OverrideFormState> {
  const studentId = formData.get("studentId") as string | null;
  const unitId = formData.get("unitId") as string | null;
  const overrideStatus = formData.get("overrideStatus") as string | null;
  const assessorNote = (formData.get("assessorNote") as string | null) ?? null;
  const assessorId = formData.get("assessorId") as string | null;

  if (
    !studentId ||
    !unitId ||
    !assessorId ||
    (overrideStatus !== "PASS" && overrideStatus !== "BORDERLINE" && overrideStatus !== "FAIL")
  ) {
    return { ok: false, error: "Invalid form data." };
  }

  try {
    await saveAssessmentOverrideAction(
      studentId,
      unitId,
      overrideStatus as AssessmentStatus,
      assessorNote?.trim() || null,
      assessorId
    );
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save override.",
    };
  }
}
