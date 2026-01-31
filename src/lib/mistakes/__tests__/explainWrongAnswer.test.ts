import { explainWrongAnswer } from "@/lib/mistakes/explainWrongAnswer";

describe("explainWrongAnswer", () => {
  beforeEach(() => {
    // @ts-expect-error - allow test mock
    global.fetch = jest.fn();
  });

  it("returns deterministic explanation without calling LLM", async () => {
    const mockFetch = global.fetch as jest.Mock;
    const result = await explainWrongAnswer({
      question: "2 + 3 × 4",
      correctAnswer: "14",
      studentAnswer: "20",
    });

    expect(result.matchedPatternId).toBe("add_before_multiply");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("forces LLM when requested", async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        likelyMistake: "Order of operations.",
        explanation: "Multiply before adding.",
        steps: ["Do 3 × 4 first.", "Then add 2."],
      }),
    });

    const result = await explainWrongAnswer({
      question: "2 + 3 × 4",
      correctAnswer: "14",
      studentAnswer: "20",
      forceLlm: true,
    });

    expect(mockFetch).toHaveBeenCalled();
    expect(result.llmUsed).toBe(true);
  });

  it("falls back to LLM when no pattern matches", async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        likelyMistake: "You treated ÷ like ×.",
        explanation: "Divide before adding.",
        steps: ["Do 6 ÷ 3 first.", "Then add 2."],
      }),
    });

    const result = await explainWrongAnswer({
      question: "2 + 6 ÷ 3",
      correctAnswer: "4",
      studentAnswer: "9",
    });

    expect(result.llmUsed).toBe(true);
    expect(result.message).toContain("You treated ÷ like ×.");
  });
});
