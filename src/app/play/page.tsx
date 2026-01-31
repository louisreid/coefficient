import { PlayClient } from "@/components/PlayClient";

export default function PlayPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Assessment
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Competence assessment
        </h1>
        <p className="text-base text-slate-600">
          Complete scenarios, justify your choices, and build evidence.
        </p>
      </header>

      <PlayClient />
    </main>
  );
}
