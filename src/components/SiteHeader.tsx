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
    <header className="sticky top-0 z-10 border-b border-base-300 bg-base-100">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-semibold text-base-content hover:text-base-content/80"
          >
            Coefficient Assess
          </Link>
          <Link
            href="/#features"
            className="text-sm font-medium text-base-content/70 hover:text-base-content"
          >
            Features
          </Link>
        </div>

        <nav className="flex items-center gap-3">
          {status === "loading" ? (
            <span className="text-sm text-base-content/60">Loading...</span>
          ) : session?.user ? (
            <>
              <Link
                href="/teacher"
                className={`text-sm font-semibold ${
                  isTeacher ? "text-base-content" : "text-base-content/70 hover:text-base-content"
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
                className="text-sm font-semibold text-base-content/70 hover:text-base-content"
              >
              Assessor sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
