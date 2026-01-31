import { prisma } from "@/lib/db";
import { OnboardForm } from "@/components/OnboardForm";
import { Card } from "@/components/ui/Card";

type OnboardPageProps = {
  searchParams: Promise<{ classId?: string }>;
};

export default async function OnboardPage({ searchParams }: OnboardPageProps) {
  const { classId } = await searchParams;

  if (!classId) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-12">
        <Card>
          <h1 className="text-xl font-semibold text-slate-900">
            Missing cohort.
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Go back and enter your join code again.
          </p>
        </Card>
      </main>
    );
  }

  const classInfo = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!classInfo) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-12">
        <Card>
          <h1 className="text-xl font-semibold text-slate-900">
            Cohort not found.
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Check your join code and try again.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {classInfo.name}
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Pick your pseudonym
        </h1>
        <p className="text-base text-slate-600">
          Choose a pseudonym to stay anonymous in this cohort.
        </p>
      </header>

      <Card>
        <OnboardForm
          classId={classId}
          className={classInfo.name}
          joinCode={classInfo.joinCode}
        />
      </Card>
    </main>
  );
}
