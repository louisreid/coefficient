"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function TeacherAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="text-sm font-semibold text-slate-500">Loading...</div>
    );
  }

  if (!session?.user) {
    return (
      <Button type="button" variant="secondary" onClick={() => signIn("google")}>
        Teacher sign in
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-semibold text-slate-600">
        {session.user.email ?? "Teacher"}
      </span>
      <Button type="button" variant="ghost" onClick={() => signOut()}>
        Sign out
      </Button>
    </div>
  );
}
