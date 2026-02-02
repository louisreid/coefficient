import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-slate-500">
        <Link href="/" className="font-semibold text-slate-600 hover:text-slate-900">
          Coefficient Assess
        </Link>
        <span>© {year} Coefficient Assess</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-700">
            Privacy
          </a>
          <a href="#" className="hover:text-slate-700">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
