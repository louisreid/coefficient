/**
 * EPIC 2.1 — Rule-based risk flags (deterministic, before AI).
 * 100% of CriticalFail responses must be flagged; flags explain why they fired.
 */

import { RISK_FLAGS } from "@/lib/competence/config";

export type RiskFlagKind =
  | "critical_fail"
  | "time_too_fast"
  | "time_too_slow"
  | "justification_below_threshold"
  | "answer_drift";

export type RiskFlag = {
  kind: RiskFlagKind;
  reason: string;
  attemptId?: string;
  questionHash?: string;
  severity: "critical" | "high" | "medium";
};

export type AttemptForFlags = {
  id: string;
  questionHash: string;
  studentAnswer: string;
  isCorrect: boolean;
  responseTimeMs: number;
  metadata?: {
    criticalFail?: boolean;
    justification?: string;
  } | null;
};

/**
 * Compute rule-based risk flags for a single attempt.
 * Visible before AI processing.
 */
export function computeAttemptRiskFlags(attempt: AttemptForFlags): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const meta = attempt.metadata;

  // CriticalFail triggered — 100% must be flagged
  if (meta?.criticalFail && !attempt.isCorrect) {
    flags.push({
      kind: "critical_fail",
      reason: "Critical fail rule triggered: wrong answer on a safety-critical question.",
      attemptId: attempt.id,
      questionHash: attempt.questionHash,
      severity: "critical",
    });
  }

  // Time anomaly
  if (attempt.responseTimeMs < RISK_FLAGS.MIN_RESPONSE_TIME_MS) {
    flags.push({
      kind: "time_too_fast",
      reason: `Response time ${attempt.responseTimeMs}ms is below ${RISK_FLAGS.MIN_RESPONSE_TIME_MS}ms — possible guessing or insufficient consideration.`,
      attemptId: attempt.id,
      questionHash: attempt.questionHash,
      severity: "high",
    });
  }
  if (attempt.responseTimeMs > RISK_FLAGS.MAX_RESPONSE_TIME_MS) {
    flags.push({
      kind: "time_too_slow",
      reason: `Response time ${Math.round(attempt.responseTimeMs / 1000)}s exceeds ${RISK_FLAGS.MAX_RESPONSE_TIME_MS / 1000}s — possible off-task or confusion.`,
      attemptId: attempt.id,
      questionHash: attempt.questionHash,
      severity: "medium",
    });
  }

  // MCQ correct + justification below threshold
  const justification = meta?.justification?.trim() ?? "";
  if (attempt.isCorrect && justification.length > 0 && justification.length < RISK_FLAGS.MIN_JUSTIFICATION_LENGTH) {
    flags.push({
      kind: "justification_below_threshold",
      reason: `Correct answer but justification (${justification.length} chars) is below minimum length (${RISK_FLAGS.MIN_JUSTIFICATION_LENGTH} chars).`,
      attemptId: attempt.id,
      questionHash: attempt.questionHash,
      severity: "medium",
    });
  }

  return flags;
}

/**
 * Compute answer-drift flag: same question (questionHash), multiple attempts with different answers.
 * Call with all attempts for a student in a unit.
 */
export function computeAnswerDriftFlags(attempts: AttemptForFlags[]): RiskFlag[] {
  const byQuestion = new Map<string, AttemptForFlags[]>();
  for (const a of attempts) {
    const list = byQuestion.get(a.questionHash) ?? [];
    list.push(a);
    byQuestion.set(a.questionHash, list);
  }
  const flags: RiskFlag[] = [];
  for (const [, list] of byQuestion) {
    if (list.length < 2) continue;
    const answers = new Set(list.map((a) => a.studentAnswer));
    if (answers.size > 1) {
      flags.push({
        kind: "answer_drift",
        reason: `Multiple attempts for the same question with different answers (${answers.size} distinct answers across ${list.length} attempts).`,
        questionHash: list[0].questionHash,
        attemptId: list[list.length - 1].id,
        severity: "high",
      });
    }
  }
  return flags;
}

/**
 * All risk flags for a trainee's attempts in a unit: per-attempt + answer drift.
 * Ordered by severity (critical first), then by attempt order.
 */
export function computeTraineeRiskFlags(attempts: AttemptForFlags[]): RiskFlag[] {
  const perAttempt: RiskFlag[] = [];
  for (const a of attempts) {
    perAttempt.push(...computeAttemptRiskFlags(a));
  }
  const driftFlags = computeAnswerDriftFlags(attempts);
  const all = [...perAttempt, ...driftFlags];
  const order: Record<RiskFlag["severity"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
  };
  all.sort((a, b) => order[a.severity] - order[b.severity]);
  return all;
}

/**
 * Whether a trainee has any flags that require review (default view = items requiring review).
 */
export function hasFlagsRequiringReview(attempts: AttemptForFlags[]): boolean {
  return computeTraineeRiskFlags(attempts).length > 0;
}
