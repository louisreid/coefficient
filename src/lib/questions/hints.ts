import type { HintCard } from "@/lib/questions/types";
import { SkillTag } from "@/lib/constants";

const HINTS: Record<SkillTag, HintCard[]> = {
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

export function getHint(skill: SkillTag): HintCard {
  const list = HINTS[skill];
  return list[0];
}
