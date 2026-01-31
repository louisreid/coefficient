"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

type LiveStudent = {
  id: string;
  nickname: string;
  className: string;
  currentStreak: number;
  currentQuestionPrompt: string | null;
  currentSkillTag: string | null;
};

type LivePayload = {
  students: LiveStudent[];
  updatedAt: string;
};

export function TeacherLiveStudents() {
  const [students, setStudents] = useState<LiveStudent[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const source = new EventSource("/api/teacher/live");

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as LivePayload;
        setStudents(payload.students ?? []);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    };

    source.onerror = () => {
      setStatus("error");
      source.close();
    };

    return () => {
      source.close();
    };
  }, []);

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Live active trainees
          </h2>
          <p className="text-sm text-slate-600">
            Updates every few seconds.
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {status === "error" ? "Offline" : status === "loading" ? "Loading" : "Live"}
        </span>
      </div>

      {students.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No active trainees right now.
        </p>
      ) : (
        <div className="mt-4 grid gap-2">
          {students.map((student) => (
            <div
              key={student.id}
              className="grid gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 md:grid-cols-[1.2fr_0.6fr_1.6fr_0.6fr]"
            >
              <div className="font-semibold text-slate-900">
                {student.nickname}
                <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {student.className}
                </span>
              </div>
              <div>Streak: {student.currentStreak}</div>
              <div className="text-slate-600">
                {student.currentQuestionPrompt ?? "—"}
              </div>
              <div className="text-slate-500">
                {student.currentSkillTag ?? "—"}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
