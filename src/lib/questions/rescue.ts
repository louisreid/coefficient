import type { RescueCard } from "@/lib/questions/types";
import { SkillTag } from "@/lib/constants";

const RESCUES: Record<SkillTag, RescueCard> = {
  INT_ADD_SUB: {
    title: "Rescue: adding negatives",
    example: "Example: -3 + 7 = 4 (think 7 - 3)",
    prompt: "-8 + 5 = ?",
    answer: "-3",
  },
  INT_MUL_DIV: {
    title: "Rescue: sign rule",
    example: "Example: -4 × 3 = -12 (different signs = negative)",
    prompt: "-18 ÷ 3 = ?",
    answer: "-6",
  },
  BIDMAS_INT: {
    title: "Rescue: brackets first",
    example: "Example: (6 - 2) × 3 = 4 × 3 = 12",
    prompt: "(9 + 1) ÷ 2 = ?",
    answer: "5",
  },
};

export function getRescue(skill: SkillTag) {
  return RESCUES[skill];
}
