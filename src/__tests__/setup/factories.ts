import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

type FactoryOverrides<T> = Partial<T>;

export const createUser = (overrides: FactoryOverrides<{ email: string }>) =>
  prisma.user.create({
    data: {
      email: overrides.email ?? `teacher-${Date.now()}@example.com`,
      name: "Test Teacher",
    },
  });

export const createClass = (
  overrides: FactoryOverrides<{
    name: string;
    joinCode: string;
    teacherId: string | null;
  }>,
) =>
  prisma.class.create({
    data: {
      name: overrides.name ?? "Year 10 Maths",
      tier: "Foundation",
      joinCode: overrides.joinCode ?? `COE-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      teacherId: overrides.teacherId ?? null,
    },
  });

export const createStudent = async (
  overrides: FactoryOverrides<{
    classId: string;
    nickname: string;
    pin: string;
  }>,
) => {
  const pin = overrides.pin ?? "1234";
  const pinHash = await bcrypt.hash(pin, 10);
  const now = new Date();
  return prisma.student.create({
    data: {
      classId: overrides.classId ?? "",
      nickname: overrides.nickname ?? "Clever Gorilla",
      pinHash,
      pinUpdatedAt: now,
      lastActiveAt: now,
    },
  });
};

export const createAttempt = (
  overrides: FactoryOverrides<{
    classId: string;
    studentId: string;
    questionHash: string;
    prompt: string;
    skillTag: string;
    difficulty: number;
    correctAnswer: string;
    studentAnswer: string;
    isCorrect: boolean;
  }>,
) =>
  prisma.attempt.create({
    data: {
      classId: overrides.classId ?? "",
      studentId: overrides.studentId ?? "",
      questionHash: overrides.questionHash ?? "QTEST",
      prompt: overrides.prompt ?? "1 + 1",
      skillTag: overrides.skillTag ?? "INT_ADD_SUB",
      difficulty: overrides.difficulty ?? 1,
      correctAnswer: overrides.correctAnswer ?? "2",
      studentAnswer: overrides.studentAnswer ?? "2",
      isCorrect: overrides.isCorrect ?? true,
      responseTimeMs: 500,
    },
  });
