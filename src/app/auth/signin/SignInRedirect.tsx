"use client";

import { useEffect } from "react";

type SignInRedirectProps = {
  searchParams: Record<string, string>;
};

export function SignInRedirect({ searchParams }: SignInRedirectProps) {
  useEffect(() => {
    console.log("[Sign-in page]", searchParams);
    const qs = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v != null && v !== ""),
    ).toString();
    window.location.href = `/api/auth/signin${qs ? `?${qs}` : ""}`;
  }, []);

  return (
    <p className="p-6 text-slate-600">Redirecting to sign in...</p>
  );
}
