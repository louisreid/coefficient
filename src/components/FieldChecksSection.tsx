"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type CaptureRow = {
  id: string;
  studentId: string;
  nickname: string;
  unitId: string;
  stepId: string;
  type: string;
  createdAt: string;
  thumbnailUrl: string | null;
  notes: string | null;
  overallStatus: string | null;
  confidence: number | null;
  triageCount: number;
};

type FieldCaptureStats = {
  totalCaptures: number;
  criticalCount: number;
  topFailingCheckIds: Array<{ checkId: string; count: number }>;
};

type Props = {
  classId: string;
  stats?: FieldCaptureStats;
};

export function FieldChecksSection({ classId, stats }: Props) {
  const [captures, setCaptures] = useState<CaptureRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/teacher/field-captures?classId=${encodeURIComponent(classId)}`)
      .then((r) => r.json())
      .then((data: { captures?: CaptureRow[] }) => {
        setCaptures(data.captures ?? []);
      })
      .catch(() => setCaptures([]))
      .finally(() => setLoading(false));
  }, [classId]);

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">Field checks</h2>
      {stats && stats.totalCaptures > 0 ? (
        <p className="mt-1 text-sm text-slate-600">
          {stats.totalCaptures} capture{stats.totalCaptures !== 1 ? "s" : ""}
          {stats.criticalCount > 0 ? `, ${stats.criticalCount} with CRITICAL` : ""}
          {stats.topFailingCheckIds.length > 0
            ? `; top issues: ${stats.topFailingCheckIds.map((x) => x.checkId).join(", ")}`
            : ""}
        </p>
      ) : (
        <p className="mt-1 text-sm text-slate-600">
          Recent photo captures from trainees. Open to review checklist and add notes.
        </p>
      )}
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading…</p>
      ) : captures.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No field captures yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {captures.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2"
            >
              {c.thumbnailUrl ? (
                <img
                  src={c.thumbnailUrl}
                  alt=""
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-200 text-slate-500">
                  —
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-slate-900">{c.nickname}</span>
                <span className="ml-2 text-slate-500">
                  {c.stepId} · {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-xs font-semibold ${
                  c.overallStatus === "OK"
                    ? "bg-emerald-100 text-emerald-700"
                    : c.overallStatus === "CRIT"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {c.overallStatus ?? "—"}
              </span>
              {c.triageCount > 0 ? (
                <span className="rounded bg-slate-200 px-2 py-0.5 text-xs">
                  {c.triageCount} flag{c.triageCount !== 1 ? "s" : ""}
                </span>
              ) : null}
              <Link href={`/teacher/class/${classId}/field/${c.id}`}>
                <Button variant="secondary" size="sm">
                  Review
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
