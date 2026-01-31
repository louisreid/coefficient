import { generateScenario, evaluateScenarioAnswer } from "@/lib/competence/generator";
import { ROV_PRE_DIVE_GO_NO_GO } from "@/lib/competence/config";

describe("generateScenario", () => {
  it("returns same scenario for same unitId, difficulty, seed (deterministic)", () => {
    const a = generateScenario(ROV_PRE_DIVE_GO_NO_GO, 1, "student1:1");
    const b = generateScenario(ROV_PRE_DIVE_GO_NO_GO, 1, "student1:1");
    expect(a.idHash).toBe(b.idHash);
    expect(a.prompt).toBe(b.prompt);
    expect(a.correctIndex).toBe(b.correctIndex);
    expect(a.correctAnswer).toBe(b.correctAnswer);
    expect(a.choices).toEqual(b.choices);
  });

  it("returns different scenario for different seed", () => {
    const a = generateScenario(ROV_PRE_DIVE_GO_NO_GO, 1, "student1:1");
    const b = generateScenario(ROV_PRE_DIVE_GO_NO_GO, 1, "student1:2");
    expect(a.idHash).not.toBe(b.idHash);
  });

  it("returns scenario with 4 choices and valid correctAnswer", () => {
    const s = generateScenario(ROV_PRE_DIVE_GO_NO_GO, 2, "test:1");
    expect(s.choices).toHaveLength(4);
    expect(["A", "B", "C", "D"]).toContain(s.correctAnswer);
    expect(s.correctIndex).toBeGreaterThanOrEqual(0);
    expect(s.correctIndex).toBeLessThan(4);
  });
});

describe("evaluateScenarioAnswer", () => {
  it("returns true when trainee selected correct option (letter)", () => {
    const s = generateScenario(ROV_PRE_DIVE_GO_NO_GO, 1, "eval:1");
    expect(evaluateScenarioAnswer(s, s.correctAnswer)).toBe(true);
  });

  it("returns false when trainee selected wrong option", () => {
    const s = generateScenario(ROV_PRE_DIVE_GO_NO_GO, 1, "eval:2");
    const wrong = ["A", "B", "C", "D"].find((l) => l !== s.correctAnswer) ?? "A";
    expect(evaluateScenarioAnswer(s, wrong)).toBe(false);
  });
});
