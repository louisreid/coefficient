import { ERROR_PATTERNS } from "@/lib/mistakes/errorPatterns";
import { detectMistake } from "@/lib/mistakes/detectMistake";

describe("detectMistake patterns", () => {
  it("matches each pattern example", () => {
    for (const pattern of ERROR_PATTERNS) {
      const result = detectMistake({
        question: pattern.example.question,
        studentAnswer: pattern.example.wrong,
        correctAnswer: pattern.example.correct,
      });
      expect(result.matchedPatternId).toBe(pattern.id);
    }
  });

  it("detects common wrong answers for (-8) + 7 × (-8)", () => {
    const question = "(-8) + 7 × (-8)";
    const correct = "-64";

    const slip1 = detectMistake({
      question,
      studentAnswer: "-67",
      correctAnswer: correct,
    });
    expect(slip1.matchedPatternId).toBe("times_table_slip");

    const slip2 = detectMistake({
      question,
      studentAnswer: "-52",
      correctAnswer: correct,
    });
    expect(slip2.matchedPatternId).toBe("times_table_slip");
  });
});
