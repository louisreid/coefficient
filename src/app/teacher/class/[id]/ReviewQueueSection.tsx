"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ReviewItem } from "@/lib/actions/assessments";
import type { RiskFlag } from "@/lib/riskFlags";

type SortOption = "severity" | "flagCount" | "trainee";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "severity", label: "Severity" },
  { value: "flagCount", label: "Flag count" },
  { value: "trainee", label: "Trainee" },
];

const SEVERITY_LABEL: Record<RiskFlag["severity"], string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
};

export function ReviewQueueSection({
  classId,
  reviewItems,
}: {
  classId: string;
  reviewItems: ReviewItem[];
}) {
  const [sortBy, setSortBy] = useState<SortOption>("severity");

  const sorted = useMemo(() => {
    const items = [...reviewItems];
    if (sortBy === "severity") {
      items.sort(
        (a, b) =>
          a.maxSeverityOrder - b.maxSeverityOrder ||
          b.flagCount - a.flagCount ||
          a.nickname.localeCompare(b.nickname),
      );
    } else if (sortBy === "flagCount") {
      items.sort(
        (a, b) =>
          b.flagCount - a.flagCount ||
          a.maxSeverityOrder - b.maxSeverityOrder ||
          a.nickname.localeCompare(b.nickname),
      );
    } else {
      items.sort(
        (a, b) =>
          a.nickname.localeCompare(b.nickname) ||
          b.maxSeverityOrder - a.maxSeverityOrder,
      );
    }
    return items;
  }, [reviewItems, sortBy]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Items requiring review
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Sort by:</span>
          {SORT_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={sortBy === opt.value ? "primary" : "secondary"}
              size="sm"
              onClick={() => setSortBy(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Trainees with rule-based risk flags (CriticalFail, time anomaly,
        justification threshold, answer drift). Default view shows highest
        severity first.
      </p>
      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No items requiring review.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {sorted.map((item) => (
            <li
              key={item.studentId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-slate-900">
                  {item.nickname}
                </span>
                <span className="text-sm text-slate-600">
                  {item.flagCount} flag{item.flagCount !== 1 ? "s" : ""}
                </span>
                {item.flags.some((f) => f.severity === "critical") && (
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                    Critical
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-600">
                  {item.summary.totalAttempted} attempted ·{" "}
                  {item.summary.criticalFailsCount} critical fail
                  {item.summary.criticalFailsCount !== 1 ? "s" : ""}
                </span>
                <Link
                  href={`/teacher/class/${classId}/student/${item.studentId}/review`}
                >
                  <Button variant="primary" size="sm">
                    Review session
                  </Button>
                </Link>
              </div>
              <div className="w-full border-t border-slate-200 pt-2 text-xs text-slate-600">
                {item.flags.slice(0, 3).map((f, i) => (
                  <p key={i} className="mt-1">
                    <span className="font-semibold text-slate-700">
                      {SEVERITY_LABEL[f.severity]}:
                    </span>{" "}
                    {f.reason}
                  </p>
                ))}
                {item.flags.length > 3 && (
                  <p className="mt-1 text-slate-500">
                    +{item.flags.length - 3} more flag
                    {item.flags.length - 3 !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
