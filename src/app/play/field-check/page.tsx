import { FieldCheckClient } from "./FieldCheckClient";

export default function FieldCheckPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Field Check
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Capture &amp; assess
        </h1>
        <p className="text-base text-slate-600">
          Take a photo of your work for each step. AI will compare it against the checklist.
        </p>
      </header>
      <FieldCheckClient />
    </main>
  );
}
