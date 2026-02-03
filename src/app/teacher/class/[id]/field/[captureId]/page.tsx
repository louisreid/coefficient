import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { CaptureReviewClient } from "./CaptureReviewClient";
import { TeacherAuth } from "@/components/TeacherAuth";
import { Button } from "@/components/ui/Button";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFieldVideoUnitConfig } from "@/lib/fieldVideo/config";

const DISCLAIMER =
  "This is for training feedback only. It is not a safety authority or substitute for local codes or supervisor sign-off.";

type Props = {
  params: Promise<{ id: string; captureId: string }>;
};

export default async function FieldCaptureReviewPage({ params }: Props) {
  const { id: classId, captureId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(
      `/api/auth/signin?callbackUrl=${encodeURIComponent(`/teacher/class/${classId}/field/${captureId}`)}`
    );
  }

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: session.user.id },
    select: { id: true, name: true },
  });
  if (!cls) notFound();

  const capture = await prisma.evidenceCapture.findFirst({
    where: { id: captureId, classId },
    include: {
      student: { select: { nickname: true } },
      captureAssessment: true,
    },
  });
  if (!capture) notFound();

  const unitConfig = getFieldVideoUnitConfig(capture.unitId);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/teacher/class/${classId}`}>
            <Button variant="ghost" size="sm">
              ← Class
            </Button>
          </Link>
          <TeacherAuth session={session} />
        </div>
      </div>

      <header className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Field check review
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {capture.student.nickname} — {capture.stepId}
        </h1>
        <p className="text-sm text-slate-600">
          {capture.createdAt.toLocaleString()} · {capture.unitId}
        </p>
      </header>

      <p className="text-xs text-slate-500">{DISCLAIMER}</p>

      <CaptureReviewClient
        classId={classId}
        captureId={captureId}
        capture={{
          id: capture.id,
          nickname: capture.student.nickname,
          stepId: capture.stepId,
          unitId: capture.unitId,
          createdAt: capture.createdAt.toISOString(),
          notes: capture.notes,
        }}
        assessment={
          capture.captureAssessment
            ? {
                id: capture.captureAssessment.id,
                aiOverallStatus: capture.captureAssessment.aiOverallStatus,
                aiConfidence: capture.captureAssessment.aiConfidence,
                aiChecks: capture.captureAssessment.aiChecks as Array<{
                  checkId: string;
                  status: string;
                  evidence?: string;
                  issue?: string;
                }> | null,
                aiSummary: capture.captureAssessment.aiSummary,
                aiQuestions: capture.captureAssessment.aiQuestions as string[] | null,
                triageFlags: capture.captureAssessment.triageFlags as {
                  redFlags?: string[];
                  criticalChecks?: string[];
                } | null,
                trainerFinalStatus: capture.captureAssessment.trainerFinalStatus,
                trainerNote: capture.captureAssessment.trainerNote,
              }
            : null
        }
        unitConfig={unitConfig ?? undefined}
      />
    </main>
  );
}
