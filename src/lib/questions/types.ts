import { SkillTag } from "@/lib/constants";

export type Question = {
  idHash: string;
  prompt: string;
  correctAnswer: string;
  skillTag: SkillTag;
  difficulty: number;
};

export type HintCard = {
  title: string;
  oneSentence: string;
  example: string;
};

export type RescueCard = {
  title: string;
  example: string;
  prompt: string;
  answer: string;
};
