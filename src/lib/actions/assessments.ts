"use server";

import { prisma } from "@/lib/db";
import { ROV_PRE_DIVE_GO_NO_GO } from "@/lib/competence/config";
import {
  computeScoringSummary,
  type AssessmentStatus,
  type ScoringSummary,
} from "@/lib/competence/scoring";
import {
  computeTraineeRiskFlags,
  type RiskFlag,
} from "@/lib/riskFlags";
import { logAssessorOverride } from "@/lib/audit";

export type TraineeAssessmentSummary = {
  studentId: string;
  nickname: string;
  summary: ScoringSummary;
  overrideStatus: AssessmentStatus | null;
  overrideNote: string | null;
};

/** EPIC 2.3 — Item requiring review: trainee with ≥1 rule-based risk flag */
export type ReviewItem = {
  studentId: string;
  nickname: string;
  summary: ScoringSummary;
  overrideStatus: AssessmentStatus | null;
  overrideNote: string | null;
  flags: RiskFlag[];
  /** For sorting: critical=0, high=1, medium=2 */
  maxSeverityOrder: number;
  flagCount: number;
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

/** EPIC 2.3 — Items requiring review (default view). Sortable by severity, flag count, trainee. */
export async function getReviewItems(
  classId: string,
  teacherId: string,
  unitId: string = ROV_PRE_DIVE_GO_NO_GO,
  sortBy: "severity" | "flagCount" | "trainee" = "severity"
): Promise<ReviewItem[] | null> {
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
      id: true,
      studentId: true,
      questionHash: true,
      studentAnswer: true,
      isCorrect: true,
      responseTimeMs: true,
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

  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 };
  const items: ReviewItem[] = [];

  for (const student of students) {
    const studentAttempts = attempts.filter((a) => a.studentId === student.id);
    const flags = computeTraineeRiskFlags(
      studentAttempts.map((a) => ({
        id: a.id,
        questionHash: a.questionHash,
        studentAnswer: a.studentAnswer,
        isCorrect: a.isCorrect,
        responseTimeMs: a.responseTimeMs,
        metadata: a.metadata as { criticalFail?: boolean; justification?: string } | null,
      }))
    );
    if (flags.length === 0) continue;

    const summary = computeScoringSummary(
      studentAttempts.map((a) => ({
        skillTag: unitId,
        isCorrect: a.isCorrect,
        metadata: a.metadata as { tags?: string[]; criticalFail?: boolean } | null,
      })),
      unitId
    );
    const override = overrideMap.get(student.id);
    const maxSeverityOrder = Math.min(
      ...flags.map((f) => severityOrder[f.severity] ?? 2)
    );
    items.push({
      studentId: student.id,
      nickname: student.nickname,
      summary,
      overrideStatus: override?.status ?? null,
      overrideNote: override?.note ?? null,
      flags,
      maxSeverityOrder,
      flagCount: flags.length,
    });
  }

  if (sortBy === "severity") {
    items.sort((a, b) => a.maxSeverityOrder - b.maxSeverityOrder || b.flagCount - a.flagCount || a.nickname.localeCompare(b.nickname));
  } else if (sortBy === "flagCount") {
    items.sort((a, b) => b.flagCount - a.flagCount || a.maxSeverityOrder - b.maxSeverityOrder || a.nickname.localeCompare(b.nickname));
  } else {
    items.sort((a, b) => a.nickname.localeCompare(b.nickname) || b.maxSeverityOrder - a.maxSeverityOrder);
  }
  return items;
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
  await logAssessorOverride({
    assessorId,
    studentId,
    unitId,
    overrideStatus,
    assessorNote,
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
