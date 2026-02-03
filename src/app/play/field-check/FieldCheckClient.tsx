"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const DISCLAIMER =
  "This is for training feedback only. It is not a safety authority or substitute for local codes or supervisor sign-off.";

type CohortSettings = {
  allowMediaUploads: boolean;
  fieldVideoUnits: Array<{
    unitId: string;
    description: string;
    steps: Array< { stepId: string; label: string }>;
  }>;
};

type Assessment = {
  aiOverallStatus: string | null;
  aiConfidence: number | null;
  aiChecks: Array<{ checkId: string; status: string; evidence?: string; issue?: string }> | null;
  aiSummary: string | null;
  triageFlags: { redFlags?: string[] } | null;
};

export function FieldCheckClient() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [settings, setSettings] = useState<CohortSettings | null>(null);
  const [step, setStep] = useState<{ unitId: string; stepId: string; label: string } | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    captureId: string;
    assessment: Assessment | null;
    error?: string;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const storedStudentId = localStorage.getItem("gorillamaths.studentId");
    const storedClassId = localStorage.getItem("gorillamaths.classId");
    if (!storedStudentId || !storedClassId) {
      router.push("/play");
      return;
    }
    setStudentId(storedStudentId);
    setClassId(storedClassId);
  }, [router]);

  useEffect(() => {
    if (!classId || !studentId) return;
    fetch(
      `/api/student/cohort-settings?classId=${encodeURIComponent(classId)}&studentId=${encodeURIComponent(studentId)}`
    )
      .then((r) => r.json())
      .then((data: CohortSettings) => {
        if (!data.allowMediaUploads || !data.fieldVideoUnits?.length) {
          router.push("/play");
          return;
        }
        setSettings(data);
        const unit = data.fieldVideoUnits[0];
        if (unit?.steps?.length) {
          setStep({
            unitId: unit.unitId,
            stepId: unit.steps[0]!.stepId,
            label: unit.steps[0]!.label,
          });
        }
      })
      .catch(() => router.push("/play"));
  }, [classId, studentId, router]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
    } catch (e) {
      console.error(e);
      const fallback = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      setStream(fallback);
    }
  }, []);

  useEffect(() => {
    if (!stream || !videoRef.current) return;
    videoRef.current.srcObject = stream;
    return () => {
      stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !stream) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.9));
  }, [stream]);

  const clearPhoto = useCallback(() => {
    setPhotoDataUrl(null);
  }, []);

  const submit = useCallback(async () => {
    if (!studentId || !classId || !step || !photoDataUrl) return;
    setSubmitting(true);
    try {
      const blob = await (await fetch(photoDataUrl)).blob();
      const form = new FormData();
      form.set("classId", classId);
      form.set("studentId", studentId);
      form.set("unitId", step.unitId);
      form.set("stepId", step.stepId);
      form.set("photo", blob, "photo.jpg");
      if (notes.trim()) form.set("notes", notes.trim());

      const res = await fetch("/api/student/field-capture", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ captureId: "", assessment: null, error: data.error ?? "Upload failed" });
        setSubmitting(false);
        return;
      }
      setResult({
        captureId: data.captureId,
        assessment: data.assessment ?? null,
        error: data.error,
      });
    } catch (e) {
      setResult({
        captureId: "",
        assessment: null,
        error: e instanceof Error ? e.message : "Request failed",
      });
    }
    setSubmitting(false);
  }, [studentId, classId, step, photoDataUrl, notes]);

  const resetFlow = useCallback(() => {
    setResult(null);
    setPhotoDataUrl(null);
    setNotes("");
  }, []);

  if (!settings || !classId || !studentId) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="text-slate-600">Loading…</p>
      </Card>
    );
  }

  const unit = settings.fieldVideoUnits[0];
  const steps = unit?.steps ?? [];

  if (result !== null) {
    const ass = result.assessment;
    return (
      <Card className="mx-auto max-w-2xl">
        <h2 className="text-lg font-semibold text-slate-900">Result</h2>
        {result.error ? (
          <p className="mt-2 text-sm text-rose-600">{result.error}</p>
        ) : null}
        {ass ? (
          <div className="mt-4 space-y-3 text-sm">
            <p>
              <strong>Overall:</strong>{" "}
              <span
                className={
                  ass.aiOverallStatus === "OK"
                    ? "text-emerald-600"
                    : ass.aiOverallStatus === "CRIT"
                      ? "text-rose-600"
                      : "text-amber-600"
                }
              >
                {ass.aiOverallStatus ?? "—"}
              </span>
              {ass.aiConfidence != null
                ? ` (${Math.round(ass.aiConfidence * 100)}% confidence)`
                : ""}
            </p>
            {ass.aiSummary ? <p>{ass.aiSummary}</p> : null}
            {ass.aiChecks && ass.aiChecks.length > 0 ? (
              <div>
                <p className="font-semibold text-slate-700">Checklist</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-slate-600">
                  {ass.aiChecks.slice(0, 6).map((c) => (
                    <li key={c.checkId}>
                      {c.checkId}: {c.status}
                      {c.issue ? ` — ${c.issue}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {ass.triageFlags?.redFlags?.length ? (
              <p className="text-amber-700">
                Flags: {ass.triageFlags.redFlags.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-6 flex gap-2">
          <Button onClick={resetFlow} variant="secondary">
            Add another capture
          </Button>
          <Button onClick={() => router.push("/play")}>Back to scenarios</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <p className="text-sm font-semibold text-slate-500">Step</p>
        <select
          className="mt-2 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
          value={step ? `${step.unitId}:${step.stepId}` : ""}
          onChange={(e) => {
            const v = e.target.value;
            const [uId, sId] = v.split(":");
            const s = steps.find((x) => x.stepId === sId);
            if (s) setStep({ unitId: uId!, stepId: s.stepId, label: s.label });
          }}
        >
          {steps.map((s) => (
            <option key={s.stepId} value={`${unit?.unitId}:${s.stepId}`}>
              {s.stepId}: {s.label}
            </option>
          ))}
        </select>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-slate-500">Camera</p>
        <p className="mt-1 text-xs text-slate-600">{DISCLAIMER}</p>

        {!stream ? (
          <Button className="mt-4" onClick={startCamera}>
            Start camera
          </Button>
        ) : (
          <div className="mt-4">
            {!photoDataUrl ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="max-h-80 w-full rounded-lg bg-slate-900 object-contain"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="mt-3 flex gap-2">
                  <Button onClick={takePhoto}>Take photo</Button>
                </div>
              </>
            ) : (
              <>
                <img
                  src={photoDataUrl}
                  alt="Capture"
                  className="max-h-80 w-full rounded-lg object-contain"
                />
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" onClick={clearPhoto}>
                    Retake
                  </Button>
                  <div className="flex-1" />
                  <Input
                    placeholder="Quick note (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    onClick={submit}
                    disabled={submitting}
                  >
                    {submitting ? "Analyzing…" : "Submit"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
