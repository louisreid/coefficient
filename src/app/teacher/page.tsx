import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TeacherAuth } from "@/components/TeacherAuth";
import { TeacherLiveStudents } from "@/components/TeacherLiveStudents";

export default async function TeacherHomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const classes = await prisma.class.findMany({
    where: { teacherId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Assessor
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Your cohorts
          </h1>
        </div>
        <TeacherAuth />
      </div>

      <div className="flex justify-end">
        <Link href="/teacher/new">
          <Button size="lg">Create a cohort</Button>
        </Link>
      </div>

      <TeacherLiveStudents />

      {classes.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">
            No cohorts yet. Create your first cohort to get a join code.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((klass) => (
            <Link key={klass.id} href={`/teacher/class/${klass.id}`}>
              <Card className="transition hover:border-slate-300">
                <h2 className="text-lg font-semibold text-slate-900">
                  {klass.name}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Join code:{" "}
                  <span className="font-semibold">{klass.joinCode}</span>
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Created {klass.createdAt.toLocaleDateString()}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
