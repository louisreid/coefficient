/** @jest-environment node */
import { recordAttemptAction } from "@/lib/actions/attempts";
import { prisma } from "@/lib/db";
import { setupTestDatabase, resetDatabase, disconnectDatabase } from "@/__tests__/setup/db";
import { createClass, createStudent } from "@/__tests__/setup/factories";

describe("recordAttemptAction", () => {
  beforeAll(() => setupTestDatabase());
  beforeEach(async () => resetDatabase());
  afterAll(async () => disconnectDatabase());

  it("throws on invalid payloads", async () => {
    await expect(
      recordAttemptAction({
        classId: "",
        studentId: "",
        questionHash: "",
        prompt: "",
        skillTag: "",
        difficulty: 10,
        correctAnswer: "",
        studentAnswer: "",
        isCorrect: true,
        responseTimeMs: -1,
      }),
    ).rejects.toThrow("Invalid attempt payload.");
  });

  it("records attempt and updates student streak", async () => {
    const klass = await createClass({ joinCode: "COE-AB12", teacherId: null });
    const student = await createStudent({
      classId: klass.id,
      nickname: "Brave Lemur",
      pin: "4321",
    });

    await recordAttemptAction({
      classId: klass.id,
      studentId: student.id,
      questionHash: "Q1",
      prompt: "1 + 1",
      skillTag: "INT_ADD_SUB",
      difficulty: 1,
      correctAnswer: "2",
      studentAnswer: "2",
      isCorrect: true,
      responseTimeMs: 800,
    });

    const attempt = await prisma.attempt.findFirst({
      where: { studentId: student.id },
    });
    const updatedStudent = await prisma.student.findUnique({
      where: { id: student.id },
    });

    expect(attempt).toBeTruthy();
    expect(updatedStudent?.currentStreak).toBe(1);
    expect(updatedStudent?.lastActiveAt).toBeTruthy();
  });
});
