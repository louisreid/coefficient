import { evaluateAnswer, generateQuestion } from "@/lib/questions/generator";

describe("generateQuestion", () => {
  it("is deterministic for a seed", () => {
    const first = generateQuestion("INT_ADD_SUB", 2, "seed-1");
    const second = generateQuestion("INT_ADD_SUB", 2, "seed-1");
    expect(first).toEqual(second);
  });

  it("clamps difficulty to the 1-3 range", () => {
    const low = generateQuestion("INT_MUL_DIV", 0, "seed-low");
    const high = generateQuestion("INT_MUL_DIV", 99, "seed-high");
    expect(low.difficulty).toBe(1);
    expect(high.difficulty).toBe(3);
  });
});

describe("evaluateAnswer", () => {
  it("accepts trimmed integers and negatives", () => {
    expect(evaluateAnswer("5", " 5 ")).toBe(true);
    expect(evaluateAnswer("-3", "-3")).toBe(true);
  });

  it("rejects non-integer input", () => {
    expect(evaluateAnswer("5", "5.5")).toBe(false);
    expect(evaluateAnswer("5", "abc")).toBe(false);
  });
});
