import { SCORING } from "./config";

export type AssessmentStatus = "PASS" | "BORDERLINE" | "FAIL";

export type AttemptWithMetadata = {
  skillTag: string;
  isCorrect: boolean;
  metadata?: {
    scenarioId?: string;
    choiceSelected?: string;
    correctChoice?: string;
    tags?: string[];
    criticalFail?: boolean;
    justification?: string;
  } | null;
};

export type ScoringSummary = {
  totalAttempted: number;
  accuracyPct: number;
  criticalFailsCount: number;
  topFailureModeTags: { tag: string; count: number }[];
  status: AssessmentStatus;
};

/**
 * Compute scoring summary for a trainee's attempts in a unit.
 * Uses metadata when present; falls back to isCorrect for legacy attempts.
 */
export function computeScoringSummary(
  attempts: AttemptWithMetadata[],
  unitId: string
): ScoringSummary {
  const relevant = attempts.filter((a) => a.skillTag === unitId);

  const totalAttempted = relevant.length;
  const correctCount = relevant.filter((a) => a.isCorrect).length;
  const accuracyPct =
    totalAttempted === 0 ? 0 : Math.round((correctCount / totalAttempted) * 100);

  let criticalFailsCount = 0;
  const tagCounts = new Map<string, number>();

  for (const a of relevant) {
    const meta = a.metadata;
    if (meta?.criticalFail && !a.isCorrect) {
      criticalFailsCount += 1;
    }
    if (meta?.tags) {
      for (const tag of meta.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
  }

  const topFailureModeTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const status = computeStatus(accuracyPct, criticalFailsCount);
  return {
    totalAttempted,
    accuracyPct,
    criticalFailsCount,
    topFailureModeTags,
    status,
  };
}

function computeStatus(
  accuracyPct: number,
  criticalFailsCount: number
): AssessmentStatus {
  if (criticalFailsCount >= 1 || accuracyPct < SCORING.FAIL_ACCURACY_PCT) {
    return "FAIL";
  }
  if (accuracyPct >= SCORING.PASS_ACCURACY_PCT) {
    return "PASS";
  }
  return "BORDERLINE";
}
