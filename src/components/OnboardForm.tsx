"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createStudentAction,
  type CreateStudentState,
} from "@/lib/actions/students";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { upsertRecentClass } from "@/lib/storage/recentClasses";

const initialState: CreateStudentState = { ok: false };

type OnboardFormProps = {
  classId: string;
  className: string;
  joinCode: string;
};

export function OnboardForm({ classId, className, joinCode }: OnboardFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createStudentAction,
    initialState,
  );
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (state.ok && state.studentId && state.classId) {
      localStorage.setItem("gorillamaths.studentId", state.studentId);
      localStorage.setItem("gorillamaths.classId", state.classId);
      localStorage.setItem("gorillamaths.loginAt", Date.now().toString());
      upsertRecentClass({
        joinCode,
        className,
        lastUsedAt: Date.now(),
      });
      router.push("/play");
    }
  }, [className, joinCode, state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="nickname" value={displayName.trim()} />

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600">
          First name or nickname
        </label>
        <Input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Your first name or nickname"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600">
          Email <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <Input
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <p className="text-xs text-slate-500">
          We can email you a magic link to return later.
        </p>
      </div>

      {state.error ? (
        <p className="text-sm text-rose-600">{state.error}</p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={pending || displayName.trim().length < 2}
      >
        {pending ? "Saving..." : "Start assessment"}
      </Button>
    </form>
  );
}
