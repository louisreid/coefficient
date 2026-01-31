"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createStudentAction,
  type CreateStudentState,
} from "@/lib/actions/students";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PinInput } from "@/components/PinInput";
import { hashString, seededRandom } from "@/lib/questions/random";
import { upsertRecentClass } from "@/lib/storage/recentClasses";

const initialState: CreateStudentState = { ok: false };

const ADJECTIVES = [
  "Silver",
  "Neon",
  "Brave",
  "Quiet",
  "Rapid",
  "Solar",
  "Mighty",
  "Clever",
  "Cosmic",
  "Wild",
  "Fierce",
  "Golden",
];

const ANIMALS = [
  "Gorilla",
  "Lemur",
  "Panda",
  "Tiger",
  "Otter",
  "Falcon",
  "Python",
  "Koala",
  "Jaguar",
  "Orca",
  "Lynx",
  "Raven",
];

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
  const [selected, setSelected] = useState<string>("");
  const [custom, setCustom] = useState<string>("");
  const [pin, setPin] = useState("");

  const nicknameOptions = useMemo(() => {
    const rand = seededRandom(`${classId}:${hashString(classId)}`);
    const options = new Set<string>();
    while (options.size < 12) {
      const option = `${ADJECTIVES[Math.floor(rand() * ADJECTIVES.length)]} ${
        ANIMALS[Math.floor(rand() * ANIMALS.length)]
      }`;
      options.add(option);
    }
    return Array.from(options);
  }, [classId]);

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

  const nicknameToUse = custom.trim() || selected;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="nickname" value={nicknameToUse} />

      <div className="grid grid-cols-2 gap-3">
        {nicknameOptions.map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => {
              setSelected(option);
              setCustom("");
            }}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
              selected === option
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600">
          Or type your own
        </label>
        <Input
          value={custom}
          onChange={(event) => {
            setCustom(event.target.value);
            setSelected("");
          }}
          placeholder="Your nickname"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600">
          Set a 4-digit PIN
        </label>
        <PinInput
          name="pin"
          value={pin}
          onChange={setPin}
          placeholder="1234"
        />
        <p className="text-xs text-slate-500">
          You will use this PIN to return later.
        </p>
      </div>

      {state.error ? (
        <p className="text-sm text-rose-600">{state.error}</p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={pending || !nicknameToUse || pin.length !== 4}
      >
        {pending ? "Saving..." : "Start assessment"}
      </Button>
    </form>
  );
}
