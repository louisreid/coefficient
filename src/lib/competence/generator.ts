import { pick, seededRandom, hashString } from "@/lib/questions/random";
import { ROV_PRE_DIVE_TEMPLATES } from "./config";
import type { Scenario } from "./types";

const LABELS = ["A", "B", "C", "D"] as const;

function buildScenarioHash(templateId: string, seed: string): string {
  const raw = `${templateId}|${seed}`;
  return `S${hashString(raw).toString(36)}`;
}

/**
 * Generate one scenario for the given unit, difficulty, and seed.
 * Deterministic: same inputs produce the same scenario.
 */
export function generateScenario(
  unitId: string,
  difficulty: number,
  seed: string
): Scenario {
  const rand = seededRandom(`${unitId}:${difficulty}:${seed}`);
  const template = pick(rand, ROV_PRE_DIVE_TEMPLATES);
  const correctAnswer = LABELS[template.correctIndex] ?? "A";
  const idHash = buildScenarioHash(template.id, seed);

  return {
    idHash,
    templateId: template.id,
    prompt: template.prompt,
    choices: [...template.choices],
    correctIndex: template.correctIndex,
    correctAnswer,
    rationale: template.rationale,
    tags: [...template.tags],
    criticalFail: template.criticalFail,
    skillTag: unitId,
    difficulty: Math.max(1, Math.min(3, Math.round(difficulty))),
  };
}

/**
 * Evaluate trainee choice (e.g. "A" or index 0) against scenario.
 */
export function evaluateScenarioAnswer(
  scenario: Scenario,
  studentAnswer: string
): boolean {
  const normalized = studentAnswer.trim().toUpperCase();
  if (LABELS.includes(normalized as (typeof LABELS)[number])) {
    return normalized === scenario.correctAnswer;
  }
  const idx = parseInt(studentAnswer, 10);
  if (Number.isFinite(idx) && idx >= 0 && idx <= 3) {
    return (LABELS[idx] ?? "") === scenario.correctAnswer;
  }
  return false;
}

/**
 * Return the 4 choice labels in order (A–D) for display.
 */
export function getScenarioChoiceLabels(): readonly ["A", "B", "C", "D"] {
  return LABELS;
}
