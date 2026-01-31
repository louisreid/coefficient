"use client";

import { useActionState, useEffect, useState } from "react";
import {
  teacherResetStudentPinAction,
  type TeacherResetPinState,
} from "@/lib/actions/students";
import { Button } from "@/components/ui/Button";
import { PinInput } from "@/components/PinInput";

type StudentSummary = {
  id: string;
  nickname: string;
};

type TeacherPinResetListProps = {
  classId: string;
  students: StudentSummary[];
};

const initialState: TeacherResetPinState = { ok: false };

function TeacherPinResetRow({
  classId,
  student,
}: {
  classId: string;
  student: StudentSummary;
}) {
  const [pin, setPin] = useState("");
  const [state, formAction, pending] = useActionState(
    teacherResetStudentPinAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      setPin("");
    }
  }, [state.ok]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3"
    >
      <input type="hidden" name="studentId" value={student.id} />
      <input type="hidden" name="classId" value={classId} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{student.nickname}</p>
          {state.ok && state.newPin ? (
            <p className="text-xs text-emerald-600">
              New PIN: <span className="font-semibold">{state.newPin}</span>
            </p>
          ) : null}
          {state.error ? (
            <p className="text-xs text-rose-600">{state.error}</p>
          ) : null}
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <PinInput
            name="pin"
            value={pin}
            onChange={setPin}
            placeholder="Optional custom PIN"
            className="min-w-[140px]"
          />
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Resetting..." : "Reset PIN"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function TeacherPinResetList({
  classId,
  students,
}: TeacherPinResetListProps) {
  if (students.length === 0) {
    return (
      <p className="text-sm text-slate-500">No students have joined yet.</p>
    );
  }

  return (
    <div className="grid gap-3">
      {students.map((student) => (
        <TeacherPinResetRow
          key={student.id}
          classId={classId}
          student={student}
        />
      ))}
    </div>
  );
}
