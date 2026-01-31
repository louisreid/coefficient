import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { createClassAction } from "@/lib/actions/classes";
import { TeacherAuth } from "@/components/TeacherAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { authOptions } from "@/lib/auth";

export default async function TeacherNewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <div />
        <TeacherAuth />
      </div>
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Assessor setup
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Create a cohort
        </h1>
        <p className="text-base text-slate-600">
          Foundation tier is fixed for the pilot.
        </p>
      </header>

      <Card>
        <form action={createClassAction} className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-slate-700">
            Cohort name
          </label>
          <Input
            name="className"
            placeholder="e.g. ROV Jan 2026"
            required
          />
          <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
            Tier: <span className="font-semibold">Foundation</span>
          </div>
          <Button type="submit" size="lg">
            Create cohort
          </Button>
        </form>
      </Card>
    </main>
  );
}
