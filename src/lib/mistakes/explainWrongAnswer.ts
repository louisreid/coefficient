import { detectMistake, type MistakeExplanation } from "@/lib/mistakes/detectMistake";

const MIN_CONFIDENCE = 0.6;

export type ExplainWrongAnswerInput = {
  question: string;
  correctAnswer: string;
  studentAnswer: string;
  skillTag?: string;
  forceLlm?: boolean;
  /** Scenario-based assessment (assessor feedback) */
  scenarioPrompt?: string;
  traineeChoice?: string;
  correctChoice?: string;
  tags?: string[];
  criticalFail?: boolean;
  justification?: string;
};

export const explainWrongAnswer = async (
  input: ExplainWrongAnswerInput
): Promise<MistakeExplanation> => {
  // For scenario-based (non-numeric) answers, skip rule-based and use API
  const isScenario =
    input.scenarioPrompt != null ||
    input.traineeChoice != null ||
    input.correctChoice != null;
  const detected = isScenario
    ? { matchedPatternId: null, confidence: 0, message: "" }
    : detectMistake(input);

  if (
    !input.forceLlm &&
    !isScenario &&
    detected.matchedPatternId &&
    detected.confidence >= MIN_CONFIDENCE
  ) {
    return detected;
  }

  try {
    const body: Record<string, unknown> = {
      question: input.question,
      correctAnswer: input.correctAnswer,
      studentAnswer: input.studentAnswer,
      skillTag: input.skillTag,
    };
    if (input.scenarioPrompt != null) body.scenarioPrompt = input.scenarioPrompt;
    if (input.traineeChoice != null) body.traineeChoice = input.traineeChoice;
    if (input.correctChoice != null) body.correctChoice = input.correctChoice;
    if (input.tags != null) body.tags = input.tags;
    if (input.criticalFail != null) body.criticalFail = input.criticalFail;
    if (input.justification != null) body.justification = input.justification;

    const response = await fetch("/api/student/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const message =
        typeof data === "string"
          ? data
          : (data as { error?: string })?.error || "Explain API failed.";
      throw new Error(message);
    }

    const d = data as {
      likelyMistake?: string;
      explanation?: string;
      steps?: string[];
      likelyFailureMode?: string;
      whyItMatters?: string;
      correctAction?: string;
      correctSequence?: string[];
      remediationDrill?: string[];
    };
    const messageParts = [
      d.likelyFailureMode?.trim(),
      d.whyItMatters?.trim(),
      d.correctAction?.trim(),
      d.likelyMistake?.trim(),
      d.explanation?.trim(),
    ].filter(Boolean);

    return {
      matchedPatternId: null,
      confidence: 0.5,
      message: messageParts.join(" ") || "Review the correct procedure.",
      steps: d.correctSequence ?? d.steps,
      llmUsed: true,
    };
  } catch (e) {
    console.error("[explainWrongAnswer] API error:", e);
    return {
      matchedPatternId: null,
      confidence: 0,
      message: "AI explanation unavailable right now.",
    };
  }
};
