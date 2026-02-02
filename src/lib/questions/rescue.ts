import type { RescueCard } from "@/lib/questions/types";
import { LEGACY_SKILLS, SKILLS } from "@/lib/constants";

const LEGACY_RESCUES: Record<(typeof LEGACY_SKILLS)[number], RescueCard> = {
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

const ROV_RESCUES: Record<(typeof SKILLS)[number], RescueCard> = {
  ROV_PRE_DIVE_GO_NO_GO: {
    title: "Rescue: pre-dive checklist",
    example: "Complete every item before go.",
    prompt: "Pre-dive checklist: tether continuity shows open circuit. What do you do?",
    answer: "No-go: stop, tag out, report; do not launch until cleared.",
  },
};

const RESCUES = { ...LEGACY_RESCUES, ...ROV_RESCUES };

export function getRescue(
  skill: (typeof LEGACY_SKILLS)[number] | (typeof SKILLS)[number],
) {
  return RESCUES[skill as keyof typeof RESCUES];
}
