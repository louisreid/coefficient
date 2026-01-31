"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import {
  studentLoginSchema,
  studentOnboardSchema,
  studentResetRequestSchema,
  studentResetVerifySchema,
} from "@/lib/validation";
import { authOptions } from "@/lib/auth";

export type CreateStudentState = {
  ok: boolean;
  error?: string;
  studentId?: string;
  classId?: string;
};

export type LoginStudentState = {
  ok: boolean;
  error?: string;
  studentId?: string;
  classId?: string;
  className?: string;
};

export type ResetChallengeState = {
  ok: boolean;
  error?: string;
  joinCode?: string;
  nickname?: string;
  attempts?: Array<{ id: string; prompt: string; correctAnswer: string }>;
};

export type ResetPinState = {
  ok: boolean;
  error?: string;
};

export type TeacherResetPinState = {
  ok: boolean;
  error?: string;
  newPin?: string;
};

const hashPin = async (pin: string) => bcrypt.hash(pin, 10);

const generateRandomPin = () =>
  Math.floor(1000 + Math.random() * 9000).toString();

const findStudentByJoinCode = async (joinCode: string, nickname: string) => {
  const klass = await prisma.class.findUnique({ where: { joinCode } });
  if (!klass) return null;
  const student = await prisma.student.findFirst({
    where: { classId: klass.id, nickname },
  });
  if (!student) return null;
  return { student, classId: klass.id, className: klass.name };
};

export async function createStudentAction(
  _prevState: CreateStudentState,
  formData: FormData,
): Promise<CreateStudentState> {
  const parsed = studentOnboardSchema.safeParse({
    nickname: formData.get("nickname"),
    classId: formData.get("classId"),
    pin: formData.get("pin"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Enter a valid nickname and PIN." };
  }

  const pinHash = await hashPin(parsed.data.pin);
  const now = new Date();

  const student = await prisma.student.create({
    data: {
      classId: parsed.data.classId,
      nickname: parsed.data.nickname,
      pinHash,
      pinUpdatedAt: now,
      lastActiveAt: now,
    },
  });

  return { ok: true, studentId: student.id, classId: parsed.data.classId };
}

export async function loginStudentAction(
  _prevState: LoginStudentState,
  formData: FormData,
): Promise<LoginStudentState> {
  const parsed = studentLoginSchema.safeParse({
    joinCode: formData.get("joinCode"),
    nickname: formData.get("nickname"),
    pin: formData.get("pin"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Enter your join code, nickname, and PIN." };
  }

  const result = await findStudentByJoinCode(
    parsed.data.joinCode,
    parsed.data.nickname,
  );
  if (!result?.student?.pinHash) {
    return { ok: false, error: "Student not found." };
  }

  const matches = await bcrypt.compare(parsed.data.pin, result.student.pinHash);
  if (!matches) {
    return { ok: false, error: "Incorrect PIN." };
  }

  await prisma.student.update({
    where: { id: result.student.id },
    data: { lastActiveAt: new Date() },
  });

  return {
    ok: true,
    studentId: result.student.id,
    classId: result.classId,
    className: result.className,
  };
}

export async function requestStudentResetChallengeAction(
  _prevState: ResetChallengeState,
  formData: FormData,
): Promise<ResetChallengeState> {
  const parsed = studentResetRequestSchema.safeParse({
    joinCode: formData.get("joinCode"),
    nickname: formData.get("nickname"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Enter your join code and nickname." };
  }

  const result = await findStudentByJoinCode(
    parsed.data.joinCode,
    parsed.data.nickname,
  );
  if (!result) {
    return { ok: false, error: "Student not found." };
  }

  const attempts = await prisma.attempt.findMany({
    where: { studentId: result.student.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, prompt: true, correctAnswer: true },
  });

  if (attempts.length < 5) {
    return {
      ok: false,
      error: "You need at least 5 attempts to reset your PIN.",
    };
  }

  return {
    ok: true,
    joinCode: parsed.data.joinCode,
    nickname: parsed.data.nickname,
    attempts,
  };
}

export async function resetStudentPinAction(
  _prevState: ResetPinState,
  formData: FormData,
): Promise<ResetPinState> {
  const parsed = studentResetVerifySchema.safeParse({
    joinCode: formData.get("joinCode"),
    nickname: formData.get("nickname"),
    pin: formData.get("pin"),
    selectedAttemptIds: formData.getAll("selectedAttemptIds"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Select the correct questions and enter a PIN." };
  }

  const result = await findStudentByJoinCode(
    parsed.data.joinCode,
    parsed.data.nickname,
  );
  if (!result) {
    return { ok: false, error: "Student not found." };
  }

  const attempts = await prisma.attempt.findMany({
    where: { studentId: result.student.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true },
  });

  if (attempts.length < 5) {
    return { ok: false, error: "Not enough attempts to reset PIN." };
  }

  const correctIds = new Set(attempts.slice(0, 3).map((attempt) => attempt.id));
  const selectedIds = new Set(parsed.data.selectedAttemptIds);

  if (
    correctIds.size !== selectedIds.size ||
    Array.from(correctIds).some((id) => !selectedIds.has(id))
  ) {
    return { ok: false, error: "Selection does not match recent attempts." };
  }

  const pinHash = await hashPin(parsed.data.pin);

  await prisma.student.update({
    where: { id: result.student.id },
    data: { pinHash, pinUpdatedAt: new Date() },
  });

  return { ok: true };
}

export async function teacherResetStudentPinAction(
  _prevState: TeacherResetPinState,
  formData: FormData,
): Promise<TeacherResetPinState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized." };
  }

  const studentId = String(formData.get("studentId") ?? "");
  const classId = String(formData.get("classId") ?? "");
  const customPin = String(formData.get("pin") ?? "").trim();
  const pin = customPin || generateRandomPin();

  if (!/^\d{4}$/.test(pin)) {
    return { ok: false, error: "PIN must be 4 digits." };
  }

  const klass = await prisma.class.findFirst({
    where: { id: classId, teacherId: session.user.id },
    select: { id: true },
  });
  if (!klass) {
    return { ok: false, error: "Class not found." };
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, classId },
    select: { id: true },
  });
  if (!student) {
    return { ok: false, error: "Student not found." };
  }

  const pinHash = await hashPin(pin);

  await prisma.student.update({
    where: { id: studentId },
    data: { pinHash, pinUpdatedAt: new Date() },
  });

  return { ok: true, newPin: pin };
}

export async function setStudentLiveQuestionAction(input: {
  studentId: string;
  questionHash: string;
  prompt: string;
  skillTag: string;
}) {
  if (!input.studentId) return;
  await prisma.student.update({
    where: { id: input.studentId },
    data: {
      currentQuestionHash: input.questionHash,
      currentQuestionPrompt: input.prompt,
      currentSkillTag: input.skillTag,
      currentQuestionStartedAt: new Date(),
      lastActiveAt: new Date(),
    },
  });
}
