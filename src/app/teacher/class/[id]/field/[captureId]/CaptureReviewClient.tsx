"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { FieldVideoUnitConfig } from "@/lib/fieldVideo/config";

type Capture = {
  id: string;
  nickname: string;
  stepId: string;
  unitId: string;
  createdAt: string;
  notes: string | null;
};

type Assessment = {
  id: string;
  aiOverallStatus: string | null;
  aiConfidence: number | null;
  aiChecks: Array<{ checkId: string; status: string; evidence?: string; issue?: string }> | null;
  aiSummary: string | null;
  aiQuestions: string[] | null;
  triageFlags: { redFlags?: string[]; criticalChecks?: string[] } | null;
  trainerFinalStatus: string | null;
  trainerNote: string | null;
};

type Props = {
  classId: string;
  captureId: string;
  capture: Capture;
  assessment: Assessment | null;
  unitConfig?: FieldVideoUnitConfig;
};

export function CaptureReviewClient({
  classId,
  captureId,
  capture,
  assessment,
  unitConfig,
}: Props) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [trainerNote, setTrainerNote] = useState(assessment?.trainerNote ?? "");
  const [trainerFinalStatus, setTrainerFinalStatus] = useState(
    assessment?.trainerFinalStatus ?? ""
  );
  const [generatedNote, setGeneratedNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingNote, setLoadingNote] = useState(false);

  useEffect(() => {
    fetch(`/api/teacher/field-captures/${captureId}/url`)
      .then((r) => (r.redirected ? r.url : r.ok ? r.url : null))
      .then((url) => url && setMediaUrl(url));
  }, [captureId]);

  const handleGenerateNote = async () => {
    setLoadingNote(true);
    try {
      const res = await fetch("/api/teacher/generate-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captureId }),
      });
      const data = await res.json();
      setGeneratedNote(data.note ?? null);
      if (data.note) setTrainerNote(data.note);
    } finally {
      setLoadingNote(false);
    }
  };

  const handleSaveOverride = async () => {
    setSaving(true);
    try {
      await fetch(`/api/teacher/field-captures/${captureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerFinalStatus: trainerFinalStatus || undefined,
          trainerNote: trainerNote || undefined,
        }),
      });
    } finally {
      setSaving(false);
    }
  };

  const evidencePackUrl = `/api/teacher/evidence/field?classId=${encodeURIComponent(classId)}&captureId=${encodeURIComponent(captureId)}`;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Media</h2>
        {!mediaUrl ? (
          <p className="mt-2 text-sm text-slate-500">Loading photo…</p>
        ) : (
          <div className="relative mt-2 aspect-video max-h-96 w-full overflow-hidden rounded-lg bg-slate-100">
            <img
              src={mediaUrl}
              alt="Capture"
              className="h-full w-full object-contain"
            />
          </div>
        )}
        {capture.notes ? (
          <p className="mt-2 text-sm text-slate-600">Trainee note: {capture.notes}</p>
        ) : null}
      </Card>

      {assessment ? (
        <>
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">AI checklist</h2>
            <p className="mt-1 text-sm text-slate-600">
              Overall:{" "}
              <span
                className={
                  assessment.aiOverallStatus === "OK"
                    ? "text-emerald-600"
                    : assessment.aiOverallStatus === "CRIT"
                      ? "text-rose-600"
                      : "text-amber-600"
                }
              >
                {assessment.aiOverallStatus ?? "—"}
              </span>
              {assessment.aiConfidence != null
                ? ` (${Math.round(assessment.aiConfidence * 100)}% confidence)`
                : ""}
            </p>
            {assessment.aiSummary ? (
              <p className="mt-2 text-sm text-slate-700">{assessment.aiSummary}</p>
            ) : null}
            {assessment.triageFlags?.redFlags?.length ? (
              <p className="mt-2 text-sm font-semibold text-amber-700">
                Flags: {assessment.triageFlags.redFlags.join(", ")}
              </p>
            ) : null}
            {assessment.aiChecks && assessment.aiChecks.length > 0 ? (
              <table className="mt-3 w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 text-left font-semibold">Check</th>
                    <th className="py-2 text-left font-semibold">Status</th>
                    <th className="py-2 text-left font-semibold">Evidence / Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {assessment.aiChecks.map((c) => (
                    <tr key={c.checkId} className="border-b border-slate-100">
                      <td className="py-1.5">{unitConfig?.checks.find((x) => x.checkId === c.checkId)?.label ?? c.checkId}</td>
                      <td className="py-1.5">
                        <span
                          className={
                            c.status === "OK"
                              ? "text-emerald-600"
                              : c.status === "CRIT"
                                ? "text-rose-600"
                                : "text-amber-600"
                          }
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-1.5 text-slate-600">
                        {c.evidence ?? ""}
                        {c.issue ? ` — ${c.issue}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Trainer note</h2>
            <Button
              className="mt-2"
              size="sm"
              variant="secondary"
              onClick={handleGenerateNote}
              disabled={loadingNote}
            >
              {loadingNote ? "Generating…" : "Generate trainer note"}
            </Button>
            {generatedNote && !loadingNote ? (
              <p className="mt-2 text-sm text-emerald-600">Note generated and saved below.</p>
            ) : null}
            <textarea
              className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={4}
              value={trainerNote}
              onChange={(e) => setTrainerNote(e.target.value)}
              placeholder="Add or edit trainer note…"
            />
            <div className="mt-2">
              <label className="block text-sm font-medium text-slate-700">
                Final status override
              </label>
              <select
                className="mt-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
                value={trainerFinalStatus}
                onChange={(e) => setTrainerFinalStatus(e.target.value)}
              >
                <option value="">—</option>
                <option value="OK">OK</option>
                <option value="WARN">WARN</option>
                <option value="CRIT">CRIT</option>
                <option value="UNKNOWN">UNKNOWN</option>
              </select>
            </div>
            <Button
              className="mt-3"
              size="sm"
              onClick={handleSaveOverride}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save override"}
            </Button>
          </Card>
        </>
      ) : (
        <Card>
          <p className="text-sm text-slate-600">No assessment for this capture yet.</p>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Export</h2>
        <a
          href={evidencePackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block"
        >
          <Button variant="secondary" size="sm">
            Export evidence pack (HTML)
          </Button>
        </a>
      </Card>
    </div>
  );
}
