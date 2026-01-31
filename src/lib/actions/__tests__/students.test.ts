/** @jest-environment node */
import bcrypt from "bcryptjs";
import {
  createStudentAction,
  loginStudentAction,
  requestStudentResetChallengeAction,
  resetStudentPinAction,
  setStudentLiveQuestionAction,
  teacherResetStudentPinAction,
} from "@/lib/actions/students";
import { prisma } from "@/lib/db";
import { setupTestDatabase, resetDatabase, disconnectDatabase } from "@/__tests__/setup/db";
import { createAttempt, createClass, createStudent, createUser } from "@/__tests__/setup/factories";
import { getServerSession } from "next-auth/next";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

const mockedGetServerSession = getServerSession as jest.Mock;

describe("student actions", () => {
  beforeAll(() => setupTestDatabase());
  beforeEach(async () => {
    mockedGetServerSession.mockReset();
    await resetDatabase();
  });
  afterAll(async () => disconnectDatabase());

  it("creates a student with hashed PIN", async () => {
    const klass = await createClass({ joinCode: "COE-AAAA", teacherId: null });
    const formData = new FormData();
    formData.set("classId", klass.id);
    formData.set("nickname", "Clever Gorilla");
    formData.set("pin", "1234");

    const result = await createStudentAction({ ok: false }, formData);
    expect(result.ok).toBe(true);

    const student = await prisma.student.findUnique({ where: { id: result.studentId } });
    expect(student?.pinHash).toBeTruthy();
    expect(student?.pinHash).not.toBe("1234");
  });

  it("logs in a student with correct PIN", async () => {
    const klass = await createClass({ joinCode: "COE-AB12", teacherId: null });
    await createStudent({ classId: klass.id, nickname: "Silver Panda", pin: "4321" });

    const formData = new FormData();
    formData.set("joinCode", "COE-AB12");
    formData.set("nickname", "Silver Panda");
    formData.set("pin", "4321");

    const result = await loginStudentAction({ ok: false }, formData);
    expect(result.ok).toBe(true);
    expect(result.classId).toBe(klass.id);
  });

  it("rejects login when PIN is incorrect", async () => {
    const klass = await createClass({ joinCode: "COE-AB12", teacherId: null });
    await createStudent({ classId: klass.id, nickname: "Silver Panda", pin: "4321" });

    const formData = new FormData();
    formData.set("joinCode", "COE-AB12");
    formData.set("nickname", "Silver Panda");
    formData.set("pin", "0000");

    const result = await loginStudentAction({ ok: false }, formData);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Incorrect PIN.");
  });

  it("requires five attempts to start reset challenge", async () => {
    const klass = await createClass({ joinCode: "COE-AB12", teacherId: null });
    const student = await createStudent({
      classId: klass.id,
      nickname: "Cosmic Tiger",
      pin: "1234",
    });

    for (let i = 0; i < 4; i += 1) {
      await createAttempt({ classId: klass.id, studentId: student.id });
    }

    const formData = new FormData();
    formData.set("joinCode", "COE-AB12");
    formData.set("nickname", "Cosmic Tiger");

    const result = await requestStudentResetChallengeAction({ ok: false }, formData);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("You need at least 5 attempts to reset your PIN.");
  });

  it("starts reset challenge with attempts", async () => {
    const klass = await createClass({ joinCode: "COE-AB12", teacherId: null });
    const student = await createStudent({
      classId: klass.id,
      nickname: "Cosmic Tiger",
      pin: "1234",
    });

    for (let i = 0; i < 5; i += 1) {
      await createAttempt({ classId: klass.id, studentId: student.id });
    }

    const formData = new FormData();
    formData.set("joinCode", "COE-AB12");
    formData.set("nickname", "Cosmic Tiger");

    const result = await requestStudentResetChallengeAction({ ok: false }, formData);
    expect(result.ok).toBe(true);
    expect(result.attempts).toHaveLength(5);
  });

  it("rejects reset PIN when selection is incorrect", async () => {
    const klass = await createClass({ joinCode: "COE-AB12", teacherId: null });
    const student = await createStudent({
      classId: klass.id,
      nickname: "Cosmic Tiger",
      pin: "1234",
    });

    for (let i = 0; i < 5; i += 1) {
      await createAttempt({ classId: klass.id, studentId: student.id });
    }

    const formData = new FormData();
    formData.set("joinCode", "COE-AB12");
    formData.set("nickname", "Cosmic Tiger");
    formData.set("pin", "9876");
    formData.append("selectedAttemptIds", "wrong-id-1");
    formData.append("selectedAttemptIds", "wrong-id-2");
    formData.append("selectedAttemptIds", "wrong-id-3");

    const result = await resetStudentPinAction({ ok: false }, formData);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Selection does not match recent attempts.");
  });

  it("resets PIN when selection matches recent attempts", async () => {
    const klass = await createClass({ joinCode: "COE-AB12", teacherId: null });
    const student = await createStudent({
      classId: klass.id,
      nickname: "Cosmic Tiger",
      pin: "1234",
    });

    for (let i = 0; i < 5; i += 1) {
      await createAttempt({ classId: klass.id, studentId: student.id });
    }

    const attempts = await prisma.attempt.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true },
    });

    const formData = new FormData();
    formData.set("joinCode", "COE-AB12");
    formData.set("nickname", "Cosmic Tiger");
    formData.set("pin", "9876");
    attempts.slice(0, 3).forEach((attempt) => {
      formData.append("selectedAttemptIds", attempt.id);
    });

    const result = await resetStudentPinAction({ ok: false }, formData);
    expect(result.ok).toBe(true);

    const updated = await prisma.student.findUnique({ where: { id: student.id } });
    expect(updated?.pinHash).toBeTruthy();
    expect(await bcrypt.compare("9876", updated?.pinHash ?? "")).toBe(true);
  });

  it("allows teachers to reset student PINs", async () => {
    const teacher = await createUser({ email: "teacher@school.com" });
    const klass = await createClass({ joinCode: "COE-AB12", teacherId: teacher.id });
    const student = await createStudent({
      classId: klass.id,
      nickname: "Golden Panda",
      pin: "1234",
    });
    mockedGetServerSession.mockResolvedValue({ user: { id: teacher.id } });

    const formData = new FormData();
    formData.set("classId", klass.id);
    formData.set("studentId", student.id);
    formData.set("pin", "2468");

    const result = await teacherResetStudentPinAction({ ok: false }, formData);
    expect(result.ok).toBe(true);
    expect(result.newPin).toBe("2468");
  });

  it("rejects teacher resets when unauthenticated", async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("classId", "class");
    formData.set("studentId", "student");
    formData.set("pin", "2468");

    const result = await teacherResetStudentPinAction({ ok: false }, formData);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Unauthorized.");
  });

  it("updates live question fields", async () => {
    const klass = await createClass({ joinCode: "COE-AB12", teacherId: null });
    const student = await createStudent({
      classId: klass.id,
      nickname: "Silver Panda",
      pin: "4321",
    });

    await setStudentLiveQuestionAction({
      studentId: student.id,
      questionHash: "Q123",
      prompt: "1 + 2",
      skillTag: "INT_ADD_SUB",
    });

    const updated = await prisma.student.findUnique({ where: { id: student.id } });
    expect(updated?.currentQuestionHash).toBe("Q123");
    expect(updated?.currentQuestionPrompt).toBe("1 + 2");
    expect(updated?.currentSkillTag).toBe("INT_ADD_SUB");
    expect(updated?.lastActiveAt).toBeTruthy();
  });
});
