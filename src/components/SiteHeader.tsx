"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function SiteHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isTeacher = pathname?.startsWith("/teacher") ?? false;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-semibold text-slate-900 hover:text-slate-700"
          >
            Coefficient Assess
          </Link>
          <Link
            href="/#features"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Features
          </Link>
        </div>

        <nav className="flex items-center gap-3">
          {status === "loading" ? (
            <span className="text-sm text-slate-500">Loading...</span>
          ) : session?.user ? (
            <>
              <Link
                href="/teacher"
                className={`text-sm font-semibold ${
                  isTeacher ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Dashboard
              </Link>
              <Button type="button" variant="ghost" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </>
          ) : (
            <Link
              href="/api/auth/signin?callbackUrl=%2Fteacher"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Assessor sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
