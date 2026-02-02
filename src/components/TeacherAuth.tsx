"use client";

import type { Session } from "next-auth";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

function TeacherAuthContent({
  session,
  status,
}: {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
}) {
  if (status === "loading") {
    return (
      <div className="text-sm font-semibold text-slate-500">Loading...</div>
    );
  }

  if (!session?.user) {
    return (
      <Button type="button" variant="secondary" onClick={() => signIn("google", { callbackUrl: "/teacher" })}>
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

function TeacherAuthWithHook() {
  const { data: session, status } = useSession();
  return <TeacherAuthContent session={session ?? null} status={status} />;
}

type TeacherAuthProps = {
  session?: Session | null;
};

export function TeacherAuth({ session: sessionProp }: TeacherAuthProps) {
  if (sessionProp !== undefined) {
    const status = sessionProp ? "authenticated" : "unauthenticated";
    return <TeacherAuthContent session={sessionProp} status={status} />;
  }
  return <TeacherAuthWithHook />;
}
