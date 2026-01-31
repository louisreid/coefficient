export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-10 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Coefficient Assess MVP
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Trainee assessment starts here.
        </h1>
        <p className="text-base text-slate-600">
          Pick your path and jump back into your cohort.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <a
          href="/join"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            I’m new here
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Enter a join code and set your pseudonym.
          </p>
        </a>
        <a
          href="/student/return"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            I’m returning
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Log back in with your nickname and PIN.
          </p>
        </a>
      </section>

      <a
        href="/teacher"
        className="absolute bottom-6 right-6 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600"
      >
        Assessor sign in
      </a>
    </main>
  );
}
