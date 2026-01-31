import {
  attemptSchema,
  joinCodeSchema,
  pinSchema,
  studentLoginSchema,
} from "@/lib/validation";

describe("joinCodeSchema", () => {
  it("accepts valid codes and uppercases them", () => {
    const parsed = joinCodeSchema.safeParse({ joinCode: "coe-ab12" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.joinCode).toBe("COE-AB12");
    }
  });

  it("rejects invalid formats", () => {
    const parsed = joinCodeSchema.safeParse({ joinCode: "BADCODE" });
    expect(parsed.success).toBe(false);
  });
});

describe("pinSchema", () => {
  it("accepts 4-digit pins", () => {
    expect(pinSchema.safeParse({ pin: "1234" }).success).toBe(true);
  });

  it("rejects non-4-digit pins", () => {
    expect(pinSchema.safeParse({ pin: "123" }).success).toBe(false);
    expect(pinSchema.safeParse({ pin: "12ab" }).success).toBe(false);
  });
});

describe("studentLoginSchema", () => {
  it("requires join code, nickname, and pin", () => {
    const parsed = studentLoginSchema.safeParse({
      joinCode: "COE-AB12",
      nickname: "Clever Gorilla",
      pin: "1234",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("attemptSchema", () => {
  it("rejects out-of-range difficulty", () => {
    const parsed = attemptSchema.safeParse({
      classId: "class",
      studentId: "student",
      questionHash: "Q1",
      prompt: "1 + 1",
      skillTag: "ROV_PRE_DIVE_GO_NO_GO",
      difficulty: 5,
      correctAnswer: "2",
      studentAnswer: "2",
      isCorrect: true,
      responseTimeMs: 500,
    });
    expect(parsed.success).toBe(false);
  });
});
