import { z } from "zod";

/** Single check result from Gemini */
export const fieldAssessCheckSchema = z.object({
  checkId: z.string(),
  status: z.enum(["OK", "WARN", "CRIT", "UNKNOWN"]),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
  issue: z.string().optional(),
  fix: z.string().optional(),
});

export const fieldAssessOverallSchema = z.object({
  status: z.enum(["OK", "WARN", "CRIT", "UNKNOWN"]),
  confidence: z.number().min(0).max(1),
});

/** Strict JSON response from Gemini for field assess */
export const fieldAssessResponseSchema = z.object({
  stepId: z.string(),
  overall: fieldAssessOverallSchema,
  checks: z.array(fieldAssessCheckSchema),
  summary: z.string(),
  askNext: z.array(z.string()),
  redFlags: z.array(z.string()),
});

export type FieldAssessResponse = z.infer<typeof fieldAssessResponseSchema>;

/** Generate-note API response */
export const generateNoteResponseSchema = z.object({
  recommendation: z.string(),
  note: z.string(),
  citations: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export type GenerateNoteResponse = z.infer<typeof generateNoteResponseSchema>;
