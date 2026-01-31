import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { JoinCodeQr } from "@/components/JoinCodeQr";
import { TeacherAuth } from "@/components/TeacherAuth";
import { TeacherPinResetList } from "@/components/TeacherPinResetList";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getTraineeAssessmentSummaries } from "@/lib/actions/assessments";
import { getTeacherDashboard } from "@/lib/analytics";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type TeacherClassPageProps = {
  params: Promise<{ id?: string }>;
};

export default async function TeacherClassPage({
  params,
}: TeacherClassPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const resolvedParams = await params;
  if (!resolvedParams?.id) {
    notFound();
  }

  const data = await getTeacherDashboard(resolvedParams.id, session.user.id);

  if (!data) {
    notFound();
  }

  const { classInfo, activeToday, active7Days, topMistakes, topFailureModes, atRisk } = data;
  const students = await prisma.student.findMany({
    where: { classId: classInfo.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true },
  });
  const assessments = await getTraineeAssessmentSummaries(
    classInfo.id,
    session.user.id,
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div />
        <TeacherAuth />
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

      {assessments != null ? (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Assessments</h2>
          <p className="mt-1 text-sm text-slate-600">
            Latest assessment summary per trainee (ROV Pre-Dive). Review and override if needed.
          </p>
          <div className="mt-4 space-y-3">
            {assessments.length === 0 ? (
              <p className="text-sm text-slate-500">No trainees in this cohort yet.</p>
            ) : (
              assessments.map((row) => {
                const status = row.overrideStatus ?? row.summary.status;
                const statusClass =
                  status === "PASS"
                    ? "text-emerald-600"
                    : status === "BORDERLINE"
                      ? "text-amber-600"
                      : "text-rose-600";
                return (
                  <div
                    key={row.studentId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-semibold text-slate-900">
                        {row.nickname}
                      </span>
                      <span className={`text-sm font-semibold ${statusClass}`}>
                        {status}
                        {row.overrideStatus != null ? " (override)" : ""}
                      </span>
                      <span className="text-sm text-slate-500">
                        {row.summary.totalAttempted} attempted,{" "}
                        {row.summary.accuracyPct}% accuracy
                      </span>
                      {row.summary.criticalFailsCount > 0 ? (
                        <span className="text-xs font-semibold text-rose-600">
                          {row.summary.criticalFailsCount} critical fail(s)
                        </span>
                      ) : null}
                    </div>
                    <Link
                      href={`/teacher/class/${classInfo.id}/student/${row.studentId}/review`}
                    >
                      <Button variant="secondary" size="sm">
                        Review session
                      </Button>
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      ) : null}

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">
          Reset trainee PINs
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Leave the PIN blank to generate a random one.
        </p>
        <div className="mt-4">
          <TeacherPinResetList classId={classInfo.id} students={students} />
        </div>
      </Card>
    </main>
  );
}
