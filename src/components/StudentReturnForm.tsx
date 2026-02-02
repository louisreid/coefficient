"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loginStudentAction,
  requestMagicLinkAction,
  requestStudentResetChallengeAction,
  resetStudentPinAction,
  type LoginStudentState,
  type RequestMagicLinkState,
  type ResetChallengeState,
  type ResetPinState,
} from "@/lib/actions/students";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { PinInput } from "@/components/PinInput";
import {
  readRecentClasses,
  upsertRecentClass,
  type RecentClass,
} from "@/lib/storage/recentClasses";

const loginInitial: LoginStudentState = { ok: false };
const magicLinkInitial: RequestMagicLinkState = { ok: false };
const resetChallengeInitial: ResetChallengeState = { ok: false };
const resetPinInitial: ResetPinState = { ok: false };

type AttemptSummary = { id: string; prompt: string; correctAnswer: string };

export function StudentReturnForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"magic" | "pin" | "reset">("magic");
  const [joinCode, setJoinCode] = useState("");
  const [recentClasses, setRecentClasses] = useState<RecentClass[]>([]);
  const [pin, setPin] = useState("");
  const [resetPin, setResetPin] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shuffledAttempts, setShuffledAttempts] = useState<AttemptSummary[]>(
    [],
  );

  const [magicState, magicAction, magicPending] = useActionState(
    requestMagicLinkAction,
    magicLinkInitial,
  );
  const [loginState, loginAction, loginPending] = useActionState(
    loginStudentAction,
    loginInitial,
  );
  const [challengeState, challengeAction, challengePending] = useActionState(
    requestStudentResetChallengeAction,
    resetChallengeInitial,
  );
  const [resetState, resetAction, resetPending] = useActionState(
    resetStudentPinAction,
    resetPinInitial,
  );

  useEffect(() => {
    if (loginState.ok && loginState.studentId && loginState.classId) {
      localStorage.setItem("gorillamaths.studentId", loginState.studentId);
      localStorage.setItem("gorillamaths.classId", loginState.classId);
      localStorage.setItem("gorillamaths.loginAt", Date.now().toString());
      if (loginState.className && joinCode) {
        upsertRecentClass({
          joinCode,
          className: loginState.className,
          lastUsedAt: Date.now(),
        });
      }
      setRecentClasses(readRecentClasses());
      router.push("/play");
    }
  }, [joinCode, loginState, router]);

  useEffect(() => {
    setRecentClasses(readRecentClasses());
  }, []);

  useEffect(() => {
    if (challengeState.ok && challengeState.attempts) {
      const shuffled = [...challengeState.attempts].sort(
        () => Math.random() - 0.5,
      );
      setShuffledAttempts(shuffled);
      setSelectedIds([]);
      setResetPin("");
    }
  }, [challengeState]);

  const canSubmitReset = useMemo(
    () => selectedIds.length === 3 && resetPin.length === 4,
    [selectedIds, resetPin],
  );

  return (
    <div className="flex flex-col gap-6">
      {recentClasses.length ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Your classes
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {recentClasses.map((entry) => (
              <Button
                key={entry.joinCode}
                type="button"
                variant="secondary"
                size="lg"
                className="flex h-auto flex-col items-start justify-start gap-1 px-4 py-3 text-left"
                onClick={() => setJoinCode(entry.joinCode)}
              >
                <span className="text-base font-semibold text-slate-900">
                  {entry.className}
                </span>
                <span className="text-xs text-slate-500">{entry.joinCode}</span>
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {mode === "magic" ? (
        <div className="flex flex-col gap-4">
          <form action={magicAction} className="flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">
                Email address
              </label>
              <Input
                type="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">
                Join code <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <Input
                name="joinCode"
                placeholder="COE-ABCD"
                autoComplete="off"
                className="text-lg"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
              />
            </div>
            {magicState.error ? (
              <p className="text-sm text-rose-600">{magicState.error}</p>
            ) : null}
            {magicState.ok ? (
              <p className="text-sm text-emerald-600">
                If that email is registered, we sent you a link. Check your inbox.
              </p>
            ) : null}
            <Button type="submit" size="lg" disabled={magicPending}>
              {magicPending ? "Sending..." : "Email me a magic link"}
            </Button>
          </form>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit px-0 text-xs text-slate-500"
            onClick={() => setMode("pin")}
          >
            I have a PIN
          </Button>
        </div>
      ) : mode === "pin" ? (
        <form action={loginAction} className="flex flex-col gap-4">
          <Input
            name="joinCode"
            placeholder="COE-ABCD"
            autoComplete="off"
            className="text-lg"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
          />
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">
              First name or nickname
            </label>
            <Input
              name="nickname"
              placeholder="Same as when you joined"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <PinInput
              name="pin"
              value={pin}
              onChange={setPin}
              placeholder="PIN"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-0 text-xs text-slate-500"
              onClick={() => setMode("reset")}
            >
              I forgot my PIN
            </Button>
          </div>
          {loginState.error ? (
            <p className="text-sm text-rose-600">{loginState.error}</p>
          ) : null}
          <Button type="submit" size="lg" disabled={loginPending || pin.length !== 4}>
            {loginPending ? "Checking..." : "Return to class"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit px-0 text-xs text-slate-500"
            onClick={() => setMode("magic")}
          >
            Email me a magic link instead
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit px-0 text-xs text-slate-500"
            onClick={() => setMode("pin")}
          >
            Back to login
          </Button>
          <Card>
            <form action={challengeAction} className="flex flex-col gap-3">
              <Input
                name="joinCode"
                placeholder="COE-ABCD"
                autoComplete="off"
                className="text-lg"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
              />
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">
                  First name or nickname
                </label>
                <Input
                  name="nickname"
                  placeholder="Same as when you joined"
                  autoComplete="off"
                />
              </div>
              {challengeState.error ? (
                <p className="text-sm text-rose-600">{challengeState.error}</p>
              ) : null}
              <Button type="submit" disabled={challengePending}>
                {challengePending ? "Checking..." : "Start reset challenge"}
              </Button>
            </form>
          </Card>

          {challengeState.ok && challengeState.attempts ? (
            <Card>
              <form action={resetAction} className="flex flex-col gap-4">
                <input
                  type="hidden"
                  name="joinCode"
                  value={challengeState.joinCode ?? ""}
                />
                <input
                  type="hidden"
                  name="nickname"
                  value={challengeState.nickname ?? ""}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Select the 3 most recent questions you answered.
                  </p>
                  <div className="mt-3 grid gap-2">
                    {shuffledAttempts.map((attempt) => {
                      const checked = selectedIds.includes(attempt.id);
                      return (
                        <label
                          key={attempt.id}
                          className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        >
                          <input
                            type="checkbox"
                            name="selectedAttemptIds"
                            value={attempt.id}
                            checked={checked}
                            onChange={() => {
                              setSelectedIds((prev) => {
                                if (checked) {
                                  return prev.filter((id) => id !== attempt.id);
                                }
                                if (prev.length >= 3) {
                                  return prev;
                                }
                                return [...prev, attempt.id];
                              });
                            }}
                            className="mt-1"
                          />
                          <span>
                            {attempt.prompt} ={" "}
                            <span className="font-semibold">
                              {attempt.correctAnswer}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    You must choose exactly three.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">
                    Set a new 4-digit PIN
                  </label>
                  <PinInput
                    name="pin"
                    value={resetPin}
                    onChange={setResetPin}
                    placeholder="1234"
                  />
                </div>

                {resetState.error ? (
                  <p className="text-sm text-rose-600">{resetState.error}</p>
                ) : null}
                {resetState.ok ? (
                  <p className="text-sm text-emerald-600">
                    PIN updated. Use it to log in now.
                  </p>
                ) : null}

                <Button type="submit" disabled={resetPending || !canSubmitReset}>
                  {resetPending ? "Resetting..." : "Reset PIN"}
                </Button>
              </form>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
