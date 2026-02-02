export default function Home() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-16 px-6 py-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Coefficient Assess
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

      <section id="features" className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-900">Features</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-900">Join with a code</h3>
            <p className="mt-1 text-sm text-slate-600">
              Enter your cohort join code and set your pseudonym to get started.
            </p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-900">Return by PIN or email</h3>
            <p className="mt-1 text-sm text-slate-600">
              Log back in with your nickname and PIN, or use a magic link sent to your email.
            </p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-900">Scenario-based assessment</h3>
            <p className="mt-1 text-sm text-slate-600">
              Complete competence scenarios, justify your choices, and build evidence.
            </p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-900">Live view for assessors</h3>
            <p className="mt-1 text-sm text-slate-600">
              See who’s active in your cohort and track progress in real time.
            </p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-900">Evidence pack export</h3>
            <p className="mt-1 text-sm text-slate-600">
              Export assessment evidence for audits and review sessions.
            </p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-900">AI-powered feedback</h3>
            <p className="mt-1 text-sm text-slate-600">
              Get clear explanations and remediation when answers need improvement.
            </p>
          </li>
        </ul>
      </section>
    </main>
  );
}
