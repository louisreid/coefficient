"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  saveOverrideFormAction,
  type OverrideFormState,
} from "@/lib/actions/assessments";
import type { AssessmentStatus } from "@/lib/competence/scoring";

type ReviewOverrideFormProps = {
  classId: string;
  studentId: string;
  unitId: string;
  currentStatus: AssessmentStatus;
  currentNote: string | undefined;
  assessorId: string;
};

const initialState: OverrideFormState = { ok: false };

export function ReviewOverrideForm({
  studentId,
  unitId,
  currentStatus,
  currentNote,
  assessorId,
}: ReviewOverrideFormProps) {
  const [state, formAction, pending] = useActionState(
    saveOverrideFormAction,
    initialState
  );

  useEffect(() => {
    if (state.ok) {
      window.location.reload();
    }
  }, [state.ok]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="unitId" value={unitId} />
      <input type="hidden" name="assessorId" value={assessorId} />

      <div>
        <label className="block text-sm font-semibold text-slate-700">
          Override status
        </label>
        <select
          name="overrideStatus"
          defaultValue={currentStatus}
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
        >
          <option value="PASS">PASS</option>
          <option value="BORDERLINE">BORDERLINE</option>
          <option value="FAIL">FAIL</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700">
          Assessor note (optional)
        </label>
        <Input
          name="assessorNote"
          defaultValue={currentNote}
          placeholder="e.g. Sign-off after verbal clarification."
          className="mt-1"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-rose-600">{state.error}</p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving..." : "Save override"}
      </Button>
    </form>
  );
}
