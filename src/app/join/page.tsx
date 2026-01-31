import Link from "next/link";
import { JoinForm } from "@/components/JoinForm";
import { Card } from "@/components/ui/Card";

type JoinPageProps = {
  searchParams: Promise<{ code?: string }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { code } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Trainee join
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Join your cohort
        </h1>
        <p className="text-base text-slate-600">
          Enter the join code your assessor shares with you.
        </p>
      </header>

      <Card>
        <JoinForm initialJoinCode={code} />
      </Card>

      <Link href="/student/return" className="text-sm font-semibold text-slate-600">
        Returning trainee? Enter your PIN.
      </Link>
    </main>
  );
}
