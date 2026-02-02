import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-base-300 bg-base-100">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-base-content/60">
        <Link href="/" className="font-semibold text-base-content/70 hover:text-base-content">
          Coefficient Assess
        </Link>
        <span>© {year} Coefficient Assess</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-base-content/80">
            Privacy
          </a>
          <a href="#" className="hover:text-base-content/80">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
