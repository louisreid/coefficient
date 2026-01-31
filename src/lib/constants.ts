import { COMPETENCE_UNITS } from "@/lib/competence/config";

/** Competence unit IDs; stored as skillTag in DB for compatibility. */
export const SKILLS = [...COMPETENCE_UNITS] as const;

export type SkillTag = (typeof SKILLS)[number];

export const TIERS = ["Foundation"] as const;
