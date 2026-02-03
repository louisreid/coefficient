import { prisma } from "@/lib/db";
import { SCORING } from "@/lib/competence/config";

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export async function getTeacherDashboard(classId: string, teacherId: string) {
  if (!classId || !teacherId) {
    return null;
  }
  const classInfo = await prisma.class.findFirst({
    where: { id: classId, teacherId },
  });

  if (!classInfo) {
    return null;
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStart = startOfDay(now);

  const [
    activeToday,
    active7Days,
    topMistakesRaw,
    wrongAttemptsWithMeta,
    atRiskRaw,
    fieldCapturesCount,
    fieldCapturesWithAssessment,
  ] = await Promise.all([
      prisma.student.count({
        where: { classId, lastActiveAt: { gte: todayStart } },
      }),
      prisma.student.count({
        where: { classId, lastActiveAt: { gte: sevenDaysAgo } },
      }),
      prisma.attempt.groupBy({
        by: ["skillTag", "studentAnswer"],
        where: {
          classId,
          isCorrect: false,
          createdAt: { gte: sevenDaysAgo },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 30,
      }),
      prisma.attempt.findMany({
        where: {
          classId,
          isCorrect: false,
          createdAt: { gte: sevenDaysAgo },
        },
        select: {
          studentId: true,
          metadata: true,
        },
      }),
      prisma.attempt.groupBy({
        by: ["studentId", "skillTag"],
        where: {
          classId,
          isCorrect: false,
          createdAt: { gte: sevenDaysAgo },
        },
        _count: { id: true },
      }),
      prisma.evidenceCapture.count({ where: { classId } }),
      prisma.captureAssessment.findMany({
        where: { capture: { classId } },
        select: { aiOverallStatus: true, aiChecks: true },
      }),
    ]);

  const topMistakesMap = new Map<
    string,
    { skillTag: string; wrongAnswer: string; count: number }
  >();
  for (const row of topMistakesRaw) {
    if (!topMistakesMap.has(row.skillTag)) {
      topMistakesMap.set(row.skillTag, {
        skillTag: row.skillTag,
        wrongAnswer: row.studentAnswer,
        count: row._count.id,
      });
    }
  }
  const topMistakes = Array.from(topMistakesMap.values()).slice(0, 5);

  const tagCounts = new Map<string, number>();
  for (const a of wrongAttemptsWithMeta) {
    const meta = a.metadata as { tags?: string[] } | null;
    if (meta?.tags?.length) {
      for (const tag of meta.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
  }
  const topFailureModes = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const atRiskByWrong = atRiskRaw.filter(
    (row) => row._count.id >= SCORING.AT_RISK_WRONG_THRESHOLD
  );
  const criticalFailIds = new Set(
    wrongAttemptsWithMeta
      .filter((a) => (a.metadata as { criticalFail?: boolean } | null)?.criticalFail === true)
      .map((a) => a.studentId)
  );

  const atRiskStudentIds = new Set([
    ...atRiskByWrong.map((row) => row.studentId),
    ...criticalFailIds,
  ]);

  const students = await prisma.student.findMany({
    where: { id: { in: Array.from(atRiskStudentIds) } },
    select: { id: true, nickname: true },
  });
  const studentMap = new Map(
    students.map((s) => [s.id, s.nickname])
  );

  const atRisk = Array.from(atRiskStudentIds).flatMap((studentId) => {
    const fromWrong = atRiskByWrong.filter((r) => r.studentId === studentId);
    const hasCriticalFail = criticalFailIds.has(studentId);
    return fromWrong.length > 0
      ? fromWrong.map((row) => ({
          studentId: row.studentId,
          nickname: studentMap.get(row.studentId) ?? "Unknown",
          skillTag: row.skillTag,
          count: row._count.id,
        }))
      : hasCriticalFail
        ? [
            {
              studentId,
              nickname: studentMap.get(studentId) ?? "Unknown",
              skillTag: "critical_fail",
              count: 1,
            },
          ]
        : [];
  });

  const fieldCriticalCount = fieldCapturesWithAssessment.filter(
    (a) => a.aiOverallStatus === "CRIT"
  ).length;
  const checkIdCounts = new Map<string, number>();
  for (const a of fieldCapturesWithAssessment) {
    const checks = a.aiChecks as Array<{ checkId: string; status: string }> | null;
    if (checks) {
      for (const c of checks) {
        if (c.status === "CRIT" || c.status === "WARN") {
          checkIdCounts.set(c.checkId, (checkIdCounts.get(c.checkId) ?? 0) + 1);
        }
      }
    }
  }
  const topFailingFieldCheckIds = Array.from(checkIdCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([checkId, count]) => ({ checkId, count }));

  return {
    classInfo,
    activeToday,
    active7Days,
    topMistakes,
    topFailureModes,
    atRisk,
    fieldCaptureStats: {
      totalCaptures: fieldCapturesCount,
      criticalCount: fieldCriticalCount,
      topFailingCheckIds: topFailingFieldCheckIds,
    },
  };
}
