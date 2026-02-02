import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { TeacherAuth } from "@/components/TeacherAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getTeacherDashboard } from "@/lib/analytics";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ROV_PRE_DIVE_GO_NO_GO,
  getRubricExcerptByTemplateId,
} from "@/lib/competence/config";
import {
  computeScoringSummary,
  type AssessmentStatus,
} from "@/lib/competence/scoring";
import { computeAttemptRiskFlags } from "@/lib/riskFlags";
import { ReviewOverrideForm } from "./ReviewOverrideForm";

type ReviewPageProps = {
  params: Promise<{ id?: string; studentId?: string }>;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const resolved = await params;
  const classId = resolved?.id;
  const studentId = resolved?.studentId;
  if (!classId || !studentId) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(
      `/api/auth/signin?callbackUrl=${encodeURIComponent(`/teacher/class/${classId}/student/${studentId}/review`)}`,
    );
  }

  const data = await getTeacherDashboard(classId, session.user.id);
  if (!data) notFound();

  const student = await prisma.student.findFirst({
    where: { id: studentId, classId },
    select: { id: true, nickname: true },
  });
  if (!student) notFound();

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
      responseTimeMs: true,
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
    select: { overrideStatus: true, assessorNote: true },
  });

  const displayStatus = override?.overrideStatus ?? summary.status;
  const statusClass =
    displayStatus === "PASS"
      ? "text-emerald-600"
      : displayStatus === "BORDERLINE"
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <Link
          href={`/teacher/class/${classId}`}
          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          ← Back to cohort
        </Link>
        <TeacherAuth session={session} />
      </div>

      <header className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Review session
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {data.classInfo.name} — {student.nickname}
        </h1>
        <p className="text-base text-slate-600">
          Unit: ROV Pre-Dive Go/No-Go. {summary.totalAttempted} scenarios attempted,{" "}
          {summary.accuracyPct}% accuracy, {summary.criticalFailsCount} critical fail(s).
        </p>
        <p className={`text-lg font-semibold ${statusClass}`}>
          Status: {displayStatus}
          {override != null ? " (override)" : ""}
        </p>
      </header>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Scenario transcript</h2>
        {attempts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No attempts yet.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {attempts.map((a, i) => {
              const meta = a.metadata as {
                scenarioId?: string;
                tags?: string[];
                criticalFail?: boolean;
                justification?: string;
              } | null;
              const rubricExcerpt = meta?.scenarioId
                ? getRubricExcerptByTemplateId(meta.scenarioId)
                : null;
              const flags = computeAttemptRiskFlags({
                id: a.id,
                questionHash: a.questionHash,
                studentAnswer: a.studentAnswer,
                isCorrect: a.isCorrect,
                responseTimeMs: a.responseTimeMs,
                metadata: meta,
              });
              return (
                <div
                  key={a.id}
                  className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
                >
                  <p className="font-semibold text-slate-700">
                    #{i + 1} — {a.prompt}
                  </p>
                  <p className="mt-2 text-slate-600">
                    Chosen: <span className="font-semibold">{a.studentAnswer}</span>{" "}
                    {a.isCorrect ? (
                      <span className="text-emerald-600">(correct)</span>
                    ) : (
                      <>
                        <span className="text-rose-600">(wrong)</span> — Correct:{" "}
                        <span className="font-semibold">{a.correctAnswer}</span>
                      </>
                    )}
                  </p>
                  {rubricExcerpt ? (
                    <div className="mt-2 rounded bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">
                        Rubric excerpt:
                      </span>{" "}
                      {rubricExcerpt}
                    </div>
                  ) : null}
                  {flags.length > 0 ? (
                    <div className="mt-2 space-y-1 rounded border border-amber-200 bg-amber-50/50 px-2 py-1.5 text-xs">
                      <span className="font-semibold text-amber-800">
                        Risk flags:
                      </span>
                      {flags.map((f, fi) => (
                        <p key={fi} className="text-amber-800">
                          {f.reason}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {meta?.tags?.length ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Tags: {meta.tags.join(", ")}
                    </p>
                  ) : null}
                  {meta?.criticalFail && !a.isCorrect ? (
                    <span className="mt-1 inline-block rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                      Critical fail
                    </span>
                  ) : null}
                  {meta?.justification ? (
                    <p className="mt-2 text-slate-600">
                      Justification: {meta.justification}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Assessor override</h2>
        <p className="mt-1 text-sm text-slate-600">
          Override final status and add a note. Saved as sign-off for evidence.
        </p>
        <div className="mt-4">
          <ReviewOverrideForm
            classId={classId}
            studentId={studentId}
            unitId={ROV_PRE_DIVE_GO_NO_GO}
            currentStatus={(override?.overrideStatus ?? summary.status) as AssessmentStatus}
            currentNote={override?.assessorNote ?? undefined}
            assessorId={session.user.id}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Export evidence pack</h2>
        <p className="mt-1 text-sm text-slate-600">
          Download evidence pack (HTML for print/PDF, JSON for audit). Export is blocked if
          there are unresolved critical fail flags.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`/api/teacher/evidence?classId=${classId}&studentId=${studentId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg">Export HTML</Button>
          </a>
          <a
            href={`/api/teacher/evidence?classId=${classId}&studentId=${studentId}&format=json`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" size="lg">
              Export JSON
            </Button>
          </a>
        </div>
      </Card>
    </main>
  );
}
