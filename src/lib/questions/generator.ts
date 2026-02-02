import { SkillTag } from "@/lib/constants";
import { pick, seededRandom, hashString } from "@/lib/questions/random";
import type { Question } from "@/lib/questions/types";

const rangeByDifficulty = (difficulty: number) => {
  if (difficulty <= 1) return 10;
  if (difficulty === 2) return 20;
  return 50;
};

const wrapNeg = (value: number) => (value < 0 ? `(${value})` : `${value}`);

const buildQuestionHash = (prompt: string, answer: string, seed: string) => {
  const raw = `${prompt}|${answer}|${seed}`;
  return `Q${hashString(raw).toString(36)}`;
};

const clampDifficulty = (difficulty: number) =>
  Math.max(1, Math.min(3, Math.round(difficulty)));

const makeAddSub = (
  rand: () => number,
  difficulty: number,
): { prompt: string; answer: string } => {
  const range = rangeByDifficulty(difficulty);
  const a = Math.floor(rand() * (range * 2 + 1)) - range;
  const b = Math.floor(rand() * (range * 2 + 1)) - range;
  const op = pick(rand, ["+", "-"]);
  const prompt = `${wrapNeg(a)} ${op} ${wrapNeg(b)}`;
  const answer = op === "+" ? a + b : a - b;
  return { prompt, answer: `${answer}` };
};

const makeMulDiv = (
  rand: () => number,
  difficulty: number,
): { prompt: string; answer: string } => {
  const range = difficulty === 1 ? 10 : difficulty === 2 ? 12 : 15;
  const a = Math.floor(rand() * (range * 2 + 1)) - range;
  const b = Math.floor(rand() * (range * 2 + 1)) - range;
  const op = pick(rand, ["×", "÷"]);

  if (op === "×") {
    const prompt = `${wrapNeg(a)} × ${wrapNeg(b)}`;
    return { prompt, answer: `${a * b}` };
  }

  const divisor = b === 0 ? 1 : b;
  const product = a * divisor;
  const prompt = `${wrapNeg(product)} ÷ ${wrapNeg(divisor)}`;
  return { prompt, answer: `${a}` };
};

const makeBidmas = (
  rand: () => number,
  difficulty: number,
): { prompt: string; answer: string } => {
  const range = difficulty === 1 ? 8 : difficulty === 2 ? 12 : 18;
  const a = Math.floor(rand() * (range * 2 + 1)) - range;
  const b = Math.floor(rand() * (range * 2 + 1)) - range;
  const c = Math.floor(rand() * (range * 2 + 1)) - range;
  const template = pick(rand, ["(a + b) × c", "a + b × c", "(a - b) + c"]);

  if (template === "(a + b) × c") {
    const prompt = `(${a} + ${b}) × ${wrapNeg(c)}`;
    return { prompt, answer: `${(a + b) * c}` };
  }

  if (template === "a + b × c") {
    const prompt = `${wrapNeg(a)} + ${wrapNeg(b)} × ${wrapNeg(c)}`;
    return { prompt, answer: `${a + b * c}` };
  }

  const prompt = `(${a} - ${b}) + ${wrapNeg(c)}`;
  return { prompt, answer: `${a - b + c}` };
};

const shuffleWithRand = <T,>(items: T[], rand: () => number) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(rand() * (i + 1));
    [copy[i], copy[swapIndex]] = [copy[swapIndex], copy[i]];
  }
  return copy;
};

export function generateQuestion(
  skill: SkillTag,
  difficulty: number,
  seed: string,
): Question {
  const rand = seededRandom(`${skill}:${difficulty}:${seed}`);
  const safeDifficulty = clampDifficulty(difficulty);
  let prompt = "";
  let correctAnswer = "";

  if (skill === "INT_ADD_SUB") {
    ({ prompt, answer: correctAnswer } = makeAddSub(rand, safeDifficulty));
  } else if (skill === "INT_MUL_DIV") {
    ({ prompt, answer: correctAnswer } = makeMulDiv(rand, safeDifficulty));
  } else if (skill === "BIDMAS_INT") {
    ({ prompt, answer: correctAnswer } = makeBidmas(rand, safeDifficulty));
  } else {
    // ROV_PRE_DIVE_GO_NO_GO: use competence/generator, not this maths generator
    throw new Error(
      "Use competence/generator for ROV_PRE_DIVE_GO_NO_GO; this generator is for maths skills only.",
    );
  }

  return {
    idHash: buildQuestionHash(prompt, correctAnswer, seed),
    prompt,
    correctAnswer,
    skillTag: skill,
    difficulty: safeDifficulty,
  };
}

export function buildQuestionChoices(question: Question) {
  const correctValue = Number(question.correctAnswer);
  if (!Number.isFinite(correctValue)) {
    return [question.correctAnswer];
  }

  const rand = seededRandom(`choices:${question.idHash}`);
  const deltas =
    question.difficulty <= 1
      ? [1, 2, 3, 4, 5, 6]
      : question.difficulty === 2
        ? [2, 3, 4, 5, 7, 9, 11, 12]
        : [3, 4, 6, 8, 10, 12, 15, 18, 20];

  const distractors = new Set<number>();
  let guard = 0;
  while (distractors.size < 8 && guard < 50) {
    guard += 1;
    const delta = pick(rand, deltas) * (rand() < 0.5 ? -1 : 1);
    let candidate = correctValue + delta;
    const roll = rand();
    if (roll < 0.2) {
      candidate = correctValue - delta;
    } else if (roll < 0.3) {
      candidate = correctValue + delta * 2;
    } else if (roll < 0.4) {
      candidate = -correctValue;
    }
    if (candidate === correctValue) {
      continue;
    }
    distractors.add(candidate);
  }

  const options = [correctValue, ...Array.from(distractors).slice(0, 3)];
  while (options.length < 4) {
    const fallback = correctValue + (options.length + 1);
    if (!options.includes(fallback)) {
      options.push(fallback);
    } else {
      options.push(correctValue - (options.length + 1));
    }
  }

  return shuffleWithRand(options, rand).map((value) => `${value}`);
}

export function evaluateAnswer(
  correctAnswer: string,
  studentAnswer: string,
) {
  const normalized = studentAnswer.trim();
  if (!/^[-]?\d+$/.test(normalized)) {
    return false;
  }

  return Number(normalized) === Number(correctAnswer);
}
