"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { sendMagicLinkEmail } from "@/lib/email";
import {
  studentLoginSchema,
  studentMagicLinkRequestSchema,
  studentOnboardSchema,
  studentResetRequestSchema,
  studentResetVerifySchema,
} from "@/lib/validation";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";

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

export type RequestMagicLinkState = {
  ok: boolean;
  error?: string;
};

export type VerifyMagicLinkState = {
  ok: boolean;
  error?: string;
  studentId?: string;
  classId?: string;
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
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Enter a valid first name or nickname." };
  }

  const now = new Date();
  const student = await prisma.student.create({
    data: {
      classId: parsed.data.classId,
      nickname: parsed.data.nickname,
      email: parsed.data.email ?? null,
      pinHash: null,
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
    return { ok: false, error: "No PIN set for this account. Use the email link to return, or ask your assessor to set a PIN." };
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

const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000;
const getBaseUrl = () =>
  process.env.NEXTAUTH_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export async function requestMagicLinkAction(
  _prevState: RequestMagicLinkState,
  formData: FormData,
): Promise<RequestMagicLinkState> {
  const rawJoinCode = formData.get("joinCode");
  const parsed = studentMagicLinkRequestSchema.safeParse({
    email: formData.get("email"),
    joinCode: typeof rawJoinCode === "string" && rawJoinCode.trim() ? rawJoinCode : undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const where: { email: string; classId?: string } = { email: parsed.data.email };
  if (parsed.data.joinCode) {
    const klass = await prisma.class.findUnique({ where: { joinCode: parsed.data.joinCode } });
    if (!klass) {
      return { ok: true };
    }
    where.classId = klass.id;
  }

  const student = await prisma.student.findFirst({
    where,
    select: { id: true, classId: true },
  });
  if (!student) {
    return { ok: true };
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + MAGIC_LINK_EXPIRY_MS);
  await prisma.student.update({
    where: { id: student.id },
    data: { magicLinkToken: token, magicLinkExpires: expires },
  });

  const baseUrl = getBaseUrl();
  const magicLinkUrl = `${baseUrl}/student/return/verify?token=${encodeURIComponent(token)}`;
  const sendResult = await sendMagicLinkEmail(parsed.data.email, magicLinkUrl);
  if (!sendResult.ok) {
    return { ok: false, error: sendResult.error ?? "Failed to send email." };
  }

  return { ok: true };
}

export async function verifyMagicLinkAction(
  token: string,
): Promise<VerifyMagicLinkState> {
  if (!token?.trim()) {
    return { ok: false, error: "Invalid or expired link." };
  }

  const student = await prisma.student.findFirst({
    where: {
      magicLinkToken: token,
      magicLinkExpires: { gt: new Date() },
    },
    select: { id: true, classId: true },
  });
  if (!student) {
    return { ok: false, error: "Invalid or expired link." };
  }

  await prisma.student.update({
    where: { id: student.id },
    data: { magicLinkToken: null, magicLinkExpires: null, lastActiveAt: new Date() },
  });

  return { ok: true, studentId: student.id, classId: student.classId };
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
