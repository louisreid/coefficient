import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StudentReturnForm } from "@/components/StudentReturnForm";

export default function StudentReturnPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Trainee return
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Welcome back
        </h1>
        <p className="text-base text-slate-600">
          Get a magic link sent to your email, or log in with your name and PIN if your assessor set one.
        </p>
      </header>

      <Card>
        <StudentReturnForm />
      </Card>

      <Link href="/join" className="text-sm font-semibold text-slate-600">
        Need a join code? Go to join.
      </Link>
    </main>
  );
}
