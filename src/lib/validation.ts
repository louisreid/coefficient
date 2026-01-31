import { z } from "zod";

export const classSchema = z.object({
  className: z
    .string()
    .trim()
    .min(2, "Class name is too short")
    .max(40, "Class name is too long"),
});

export const joinCodeSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^COE-[A-Z0-9]{4}$/, "Join code must look like COE-XXXX"),
});

export const nicknameSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, "Nickname is too short")
    .max(24, "Nickname is too long"),
  classId: z.string().min(1),
});

export const pinSchema = z.object({
  pin: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "PIN must be 4 digits"),
});

export const studentOnboardSchema = nicknameSchema.extend({
  pin: pinSchema.shape.pin,
});

export const studentLoginSchema = z.object({
  joinCode: joinCodeSchema.shape.joinCode,
  nickname: nicknameSchema.shape.nickname,
  pin: pinSchema.shape.pin,
});

export const studentResetRequestSchema = z.object({
  joinCode: joinCodeSchema.shape.joinCode,
  nickname: nicknameSchema.shape.nickname,
});

export const studentResetVerifySchema = z.object({
  joinCode: joinCodeSchema.shape.joinCode,
  nickname: nicknameSchema.shape.nickname,
  pin: pinSchema.shape.pin,
  selectedAttemptIds: z.array(z.string().min(1)).length(3),
});

export const attemptMetadataSchema = z
  .object({
    scenarioId: z.string().optional(),
    choiceSelected: z.string().optional(),
    correctChoice: z.string().optional(),
    tags: z.array(z.string()).optional(),
    criticalFail: z.boolean().optional(),
    justification: z.string().optional(),
  })
  .optional();

export const attemptSchema = z.object({
  classId: z.string().min(1),
  studentId: z.string().min(1),
  questionHash: z.string().min(1),
  prompt: z.string().min(1),
  skillTag: z.string().min(1),
  difficulty: z.number().int().min(1).max(3),
  correctAnswer: z.string().min(1),
  studentAnswer: z.string().min(1),
  isCorrect: z.boolean(),
  responseTimeMs: z.number().int().min(0),
  metadata: attemptMetadataSchema,
});
