import { ERROR_PATTERNS, getParsedQuestion } from "@/lib/mistakes/errorPatterns";

export type MistakeExplanation = {
  matchedPatternId: string | null;
  confidence: number;
  message: string;
  steps?: string[];
  llmUsed?: boolean;
};

export const detectMistake = (input: {
  question: string;
  studentAnswer: string;
  correctAnswer: string;
}): MistakeExplanation => {
  const studentValue = Number(input.studentAnswer);
  const correctValue = Number(input.correctAnswer);

  if (!Number.isFinite(studentValue) || !Number.isFinite(correctValue)) {
    return {
      matchedPatternId: null,
      confidence: 0,
      message: "Double-check the calculation.",
    };
  }

  const parsed = getParsedQuestion(input.question);

  for (const pattern of ERROR_PATTERNS) {
    const match = pattern.detector({
      question: input.question,
      studentAnswer: studentValue,
      correctAnswer: correctValue,
      parsed,
    });
    if (match) {
      return {
        matchedPatternId: pattern.id,
        confidence: match.confidence,
        message: match.message,
        steps: match.steps,
      };
    }
  }

  return {
    matchedPatternId: null,
    confidence: 0,
    message: "Double-check the calculation.",
  };
};
