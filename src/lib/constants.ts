import { COMPETENCE_UNITS } from "@/lib/competence/config";

/** Competence unit IDs; stored as skillTag in DB for compatibility. */
export const SKILLS = [...COMPETENCE_UNITS] as const;

/** Legacy maths skills (used by questions/ module and tests). */
export const LEGACY_SKILLS = [
  "INT_ADD_SUB",
  "INT_MUL_DIV",
  "BIDMAS_INT",
] as const;

export type SkillTag =
  | (typeof SKILLS)[number]
  | (typeof LEGACY_SKILLS)[number];

export const TIERS = ["Foundation"] as const;
