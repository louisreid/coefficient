"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  updateClassCohortSettingsAction,
  type CohortSettingsState,
} from "@/lib/actions/classes";

type Props = {
  classId: string;
  allowMediaUploads: boolean;
  mediaRetentionDays: number | null;
};

export function CohortSettingsForm({
  classId,
  allowMediaUploads,
  mediaRetentionDays,
}: Props) {
  const [state, formAction] = useActionState<CohortSettingsState, FormData>(
    updateClassCohortSettingsAction,
    { ok: true }
  );

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">Cohort settings</h2>
      <p className="mt-1 text-sm text-slate-600">
        Allow trainees to upload photos for field checks and set retention.
      </p>
      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="classId" value={classId} />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="allowMediaUploads"
            value="true"
            defaultChecked={allowMediaUploads}
            className="rounded border-slate-300"
          />
          <span className="text-sm font-medium text-slate-700">
            Allow media uploads (field check)
          </span>
        </label>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Media retention (days)
          </label>
          <input
            type="number"
            name="mediaRetentionDays"
            min={1}
            max={365}
            placeholder="7"
            defaultValue={mediaRetentionDays ?? ""}
            className="mt-1 w-24 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <p className="mt-0.5 text-xs text-slate-500">
            Optional; default 7 in app if empty.
          </p>
        </div>
        {state?.error ? (
          <p className="text-sm text-rose-600">{state.error}</p>
        ) : null}
        <Button type="submit" size="sm">
          Save
        </Button>
      </form>
    </Card>
  );
}
