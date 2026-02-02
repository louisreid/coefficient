import {
  computeAttemptRiskFlags,
  computeAnswerDriftFlags,
  computeTraineeRiskFlags,
  hasFlagsRequiringReview,
} from "../riskFlags";

describe("riskFlags", () => {
  describe("computeAttemptRiskFlags", () => {
    it("flags critical fail when wrong on critical question", () => {
      const flags = computeAttemptRiskFlags({
        id: "a1",
        questionHash: "q1",
        studentAnswer: "A",
        isCorrect: false,
        responseTimeMs: 5000,
        metadata: { criticalFail: true },
      });
      expect(flags).toHaveLength(1);
      expect(flags[0].kind).toBe("critical_fail");
      expect(flags[0].reason).toContain("Critical fail");
      expect(flags[0].severity).toBe("critical");
    });

    it("does not flag critical fail when correct", () => {
      const flags = computeAttemptRiskFlags({
        id: "a1",
        questionHash: "q1",
        studentAnswer: "B",
        isCorrect: true,
        responseTimeMs: 5000,
        metadata: { criticalFail: true },
      });
      expect(flags.filter((f) => f.kind === "critical_fail")).toHaveLength(0);
    });

    it("flags time too fast when below threshold", () => {
      const flags = computeAttemptRiskFlags({
        id: "a1",
        questionHash: "q1",
        studentAnswer: "A",
        isCorrect: true,
        responseTimeMs: 2000,
        metadata: null,
      });
      expect(flags.some((f) => f.kind === "time_too_fast")).toBe(true);
    });

    it("flags justification below threshold when correct but short justification", () => {
      const flags = computeAttemptRiskFlags({
        id: "a1",
        questionHash: "q1",
        studentAnswer: "B",
        isCorrect: true,
        responseTimeMs: 10000,
        metadata: { justification: "OK" },
      });
      expect(flags.some((f) => f.kind === "justification_below_threshold")).toBe(
        true,
      );
    });
  });

  describe("computeAnswerDriftFlags", () => {
    it("flags when same question has different answers across attempts", () => {
      const flags = computeAnswerDriftFlags([
        {
          id: "a1",
          questionHash: "q1",
          studentAnswer: "A",
          isCorrect: false,
          responseTimeMs: 5000,
        },
        {
          id: "a2",
          questionHash: "q1",
          studentAnswer: "B",
          isCorrect: false,
          responseTimeMs: 6000,
        },
      ]);
      expect(flags).toHaveLength(1);
      expect(flags[0].kind).toBe("answer_drift");
      expect(flags[0].reason).toContain("different answers");
    });

    it("does not flag when same answer repeated", () => {
      const flags = computeAnswerDriftFlags([
        {
          id: "a1",
          questionHash: "q1",
          studentAnswer: "A",
          isCorrect: false,
          responseTimeMs: 5000,
        },
        {
          id: "a2",
          questionHash: "q1",
          studentAnswer: "A",
          isCorrect: false,
          responseTimeMs: 6000,
        },
      ]);
      expect(flags).toHaveLength(0);
    });
  });

  describe("computeTraineeRiskFlags", () => {
    it("returns per-attempt flags plus drift flags ordered by severity", () => {
      const flags = computeTraineeRiskFlags([
        {
          id: "a1",
          questionHash: "q1",
          studentAnswer: "A",
          isCorrect: false,
          responseTimeMs: 5000,
          metadata: { criticalFail: true },
        },
      ]);
      expect(flags.length).toBeGreaterThanOrEqual(1);
      expect(flags[0].severity).toBe("critical");
    });
  });

  describe("hasFlagsRequiringReview", () => {
    it("returns true when any flags exist", () => {
      expect(
        hasFlagsRequiringReview([
          {
            id: "a1",
            questionHash: "q1",
            studentAnswer: "A",
            isCorrect: false,
            responseTimeMs: 5000,
            metadata: { criticalFail: true },
          },
        ]),
      ).toBe(true);
    });

    it("returns false when no flags", () => {
      expect(
        hasFlagsRequiringReview([
          {
            id: "a1",
            questionHash: "q1",
            studentAnswer: "B",
            isCorrect: true,
            responseTimeMs: 15000,
            metadata: { justification: "A sufficient justification here." },
          },
        ]),
      ).toBe(false);
    });
  });
});
