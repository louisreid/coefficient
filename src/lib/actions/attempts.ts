"use server";

import { prisma } from "@/lib/db";
import { attemptSchema } from "@/lib/validation";

export type AttemptInput = {
  classId: string;
  studentId: string;
  questionHash: string;
  prompt: string;
  skillTag: string;
  difficulty: number;
  correctAnswer: string;
  studentAnswer: string;
  isCorrect: boolean;
  responseTimeMs: number;
  metadata?: {
    scenarioId?: string;
    choiceSelected?: string;
    correctChoice?: string;
    tags?: string[];
    criticalFail?: boolean;
    justification?: string;
  };
};

export async function recordAttemptAction(input: AttemptInput) {
  const parsed = attemptSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Invalid attempt payload.");
  }

  const data = {
    ...parsed.data,
    metadata: parsed.data.metadata ?? undefined,
  };
  await prisma.attempt.create({ data });
  await prisma.student.update({
    where: { id: parsed.data.studentId },
    data: {
      lastActiveAt: new Date(),
      currentStreak: parsed.data.isCorrect ? { increment: 1 } : 0,
    },
  });
}
