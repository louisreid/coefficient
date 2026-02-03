import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { JoinCodeQr } from "@/components/JoinCodeQr";
import { TeacherAuth } from "@/components/TeacherAuth";
import { TeacherPinResetList } from "@/components/TeacherPinResetList";
import { CohortSettingsForm } from "@/components/CohortSettingsForm";
import { FieldChecksSection } from "@/components/FieldChecksSection";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  getTraineeAssessmentSummaries,
  getReviewItems,
} from "@/lib/actions/assessments";
import { getTeacherDashboard } from "@/lib/analytics";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ReviewQueueSection } from "./ReviewQueueSection";

type TeacherClassPageProps = {
  params: Promise<{ id?: string }>;
};

export default async function TeacherClassPage({
  params,
}: TeacherClassPageProps) {
  const resolvedParams = await params;
  if (!resolvedParams?.id) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(
      `/api/auth/signin?callbackUrl=${encodeURIComponent(`/teacher/class/${resolvedParams.id}`)}`,
    );
  }

  const data = await getTeacherDashboard(resolvedParams.id, session.user.id);

  if (!data) {
    notFound();
  }

  const { classInfo, activeToday, active7Days, topMistakes, topFailureModes, atRisk, fieldCaptureStats } = data;
  const students = await prisma.student.findMany({
    where: { classId: classInfo.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nickname: true,
      createdAt: true,
      lastActiveAt: true,
      currentQuestionHash: true,
    },
  });
  const assessments = await getTraineeAssessmentSummaries(
    classInfo.id,
    session.user.id,
  );
  const assessmentByStudentId = new Map(
    (assessments ?? []).map((row) => [row.studentId, row]),
  );
  const reviewItems = await getReviewItems(
    classInfo.id,
    session.user.id,
    undefined,
    "severity",
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div />
        <TeacherAuth session={session} />
      </div>
      <header className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {classInfo.tier} cohort
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          {classInfo.name}
        </h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Join code</p>
              <p className="mt-2 text-2xl font-semibold tracking-wider text-slate-900">
                {classInfo.joinCode}
              </p>
            </div>
            <JoinCodeQr joinCode={classInfo.joinCode} />
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Card>
            <p className="text-sm font-semibold text-slate-500">Active today</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {activeToday}
            </p>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-slate-500">
              Active last 7 days
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {active7Days}
            </p>
          </Card>
        </div>
      </div>

      <ReviewQueueSection
        classId={classInfo.id}
        reviewItems={reviewItems ?? []}
      />

      <CohortSettingsForm
        classId={classInfo.id}
        allowMediaUploads={classInfo.allowMediaUploads}
        mediaRetentionDays={classInfo.mediaRetentionDays}
      />

      <FieldChecksSection classId={classInfo.id} stats={fieldCaptureStats} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Top failure modes</h2>
          {topFailureModes.length === 0 && topMistakes.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No incorrect attempts yet.
            </p>
          ) : topFailureModes.length > 0 ? (
            <div className="mt-3 space-y-3 text-sm text-slate-700">
              {topFailureModes.map((fm) => (
                <div
                  key={fm.tag}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="font-semibold">{fm.tag}</span>
                  <span className="text-slate-500">{fm.count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 space-y-3 text-sm text-slate-700">
              {topMistakes.map((mistake) => (
                <div
                  key={`${mistake.skillTag}-${mistake.wrongAnswer}`}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="font-semibold">{mistake.skillTag}</span>
                  <span>
                    Common wrong:{" "}
                    <span className="font-semibold">{mistake.wrongAnswer}</span>
                  </span>
                  <span className="text-slate-500">{mistake.count}x</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900">At risk</h2>
          {atRisk.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No trainees flagged yet.
            </p>
          ) : (
            <div className="mt-3 space-y-3 text-sm text-slate-700">
              {atRisk.map((student) => (
                <div
                  key={`${student.studentId}-${student.skillTag}`}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="font-semibold">{student.nickname}</span>
                  <span className="text-slate-500">{student.skillTag}</span>
                  <span className="font-semibold text-rose-600">
                    {student.count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Trainees</h2>
        <p className="mt-1 text-sm text-slate-600">
          Trainees who have joined this cohort. Review sessions and reset PINs as needed.
        </p>
        <div className="mt-4 space-y-4">
          {students.length === 0 ? (
            <p className="text-sm text-slate-500">No trainees have joined yet.</p>
          ) : (
            students.map((student) => {
              const row = assessmentByStudentId.get(student.id);
              const status = row?.overrideStatus ?? row?.summary.status ?? null;
              const statusClass =
                status === "PASS"
                  ? "text-emerald-600"
                  : status === "BORDERLINE"
                    ? "text-amber-600"
                    : status === "FAIL"
                      ? "text-rose-600"
                      : "text-slate-500";
              const isLive = !!student.currentQuestionHash;
              return (
                <div
                  key={student.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-semibold text-slate-900">
                        {student.nickname}
                      </span>
                      {isLive ? (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          Live
                        </span>
                      ) : null}
                      {status != null ? (
                        <span className={`text-sm font-semibold ${statusClass}`}>
                          {status}
                          {row?.overrideStatus != null ? " (override)" : ""}
                        </span>
                      ) : null}
                    </div>
                    <Link
                      href={`/teacher/class/${classInfo.id}/student/${student.id}/review`}
                    >
                      <Button variant="secondary" size="sm">
                        Review session
                      </Button>
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <span>
                      Joined{" "}
                      {student.createdAt.toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>
                      Last active{" "}
                      {student.lastActiveAt
                        ? student.lastActiveAt.toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                    {row ? (
                      <span>
                        {row.summary.totalAttempted} attempted,{" "}
                        {row.summary.accuracyPct}% accuracy
                        {row.summary.criticalFailsCount > 0
                          ? ` · ${row.summary.criticalFailsCount} critical fail(s)`
                          : ""}
                      </span>
                    ) : (
                      <span>No attempts yet</span>
                    )}
                  </div>
                  <div className="border-t border-slate-200 pt-2">
                    <TeacherPinResetList
                      classId={classInfo.id}
                      students={[{ id: student.id, nickname: student.nickname }]}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </main>
  );
}
