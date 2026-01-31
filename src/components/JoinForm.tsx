"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  joinClassAction,
  type JoinClassState,
} from "@/lib/actions/classes";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initialState: JoinClassState = { ok: false };

type JoinFormProps = {
  initialJoinCode?: string;
};

export function JoinForm({ initialJoinCode }: JoinFormProps = {}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    joinClassAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok && state.classId) {
      router.push(`/student/onboard?classId=${state.classId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        name="joinCode"
        placeholder="COE-ABCD"
        autoComplete="off"
        className="text-lg"
        defaultValue={initialJoinCode}
      />
      {state.error ? (
        <p className="text-sm text-rose-600">{state.error}</p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Checking..." : "Join cohort"}
      </Button>
    </form>
  );
}
