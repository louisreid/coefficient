import type { HintCard } from "@/lib/questions/types";
import { LEGACY_SKILLS, SKILLS } from "@/lib/constants";

const LEGACY_HINTS: Record<(typeof LEGACY_SKILLS)[number], HintCard[]> = {
  INT_ADD_SUB: [
    {
      title: "Subtracting a negative",
      oneSentence: "Subtracting a negative is the same as adding.",
      example: "6 - (-4) = 6 + 4 = 10",
    },
  ],
  INT_MUL_DIV: [
    {
      title: "Sign rule",
      oneSentence: "Same signs give a positive, different signs give a negative.",
      example: "-6 × -2 = 12, 12 ÷ -3 = -4",
    },
  ],
  BIDMAS_INT: [
    {
      title: "BIDMAS order",
      oneSentence: "Do brackets first, then multiplications, then additions.",
      example: "3 + 2 × 4 = 3 + 8 = 11",
    },
    {
      title: "Handle brackets",
      oneSentence: "Solve the bracket completely before the rest.",
      example: "(5 - 2) × 3 = 3 × 3 = 9",
    },
  ],
};

const ROV_HINTS: Record<(typeof SKILLS)[number], HintCard[]> = {
  ROV_PRE_DIVE_GO_NO_GO: [
    {
      title: "Pre-dive checklist",
      oneSentence: "Complete every checklist item before sign-off; no exceptions.",
      example: "Tether, then power-on, then thruster spin-up.",
    },
  ],
};

const HINTS = { ...LEGACY_HINTS, ...ROV_HINTS };

export function getHint(
  skill: (typeof LEGACY_SKILLS)[number] | (typeof SKILLS)[number],
): HintCard {
  const list = HINTS[skill as keyof typeof HINTS];
  return list[0];
}
