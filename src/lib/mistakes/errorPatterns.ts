import type { ParsedQuestion } from "@/lib/mistakes/utils";
import { applyOp, formatNumber, parseQuestion } from "@/lib/mistakes/utils";

export type MistakeMatch = {
  message: string;
  steps?: string[];
  confidence: number;
};

export type MistakePattern = {
  id: string;
  name: string;
  description: string;
  detector: (input: {
    question: string;
    studentAnswer: number;
    correctAnswer: number;
    parsed: ParsedQuestion | null;
  }) => MistakeMatch | null;
  explanationTemplate: string;
  example: {
    question: string;
    wrong: string;
    correct: string;
    message: string;
  };
  confidenceHint: number;
};

const buildStepsAddMul = (
  a: number,
  b: number,
  c: number,
  op1: "+" | "-",
  op2: "×" | "÷",
) => {
  const inner = applyOp(b, op2, c);
  const result = applyOp(a, op1, inner);
  return [
    `Do ${formatNumber(b)} ${op2} ${formatNumber(c)} first = ${formatNumber(
      inner,
    )}.`,
    `Then ${formatNumber(a)} ${op1} ${formatNumber(inner)} = ${formatNumber(
      result,
    )}.`,
  ];
};

const buildStepsParenMul = (
  a: number,
  b: number,
  c: number,
  op1: "+" | "-",
  op2: "×" | "÷",
) => {
  const inner = applyOp(a, op1, b);
  const result = applyOp(inner, op2, c);
  return [
    `Inside brackets: ${formatNumber(a)} ${op1} ${formatNumber(
      b,
    )} = ${formatNumber(inner)}.`,
    `Then ${formatNumber(inner)} ${op2} ${formatNumber(c)} = ${formatNumber(
      result,
    )}.`,
  ];
};

const buildStepsMulDiv = (a: number, b: number, op: "×" | "÷") => {
  const result = applyOp(a, op, b);
  return [`${formatNumber(a)} ${op} ${formatNumber(b)} = ${formatNumber(result)}.`];
};

const detectIgnoreParentheses = (
  parsed: ParsedQuestion,
  studentAnswer: number,
) => {
  if (parsed.kind !== "bidmasParenMul") return null;
  const wrong = applyOp(
    parsed.a,
    parsed.op1,
    applyOp(parsed.b, parsed.op2, parsed.c),
  );
  if (studentAnswer !== wrong) return null;
  return {
    message: `It looks like you ignored the brackets and did ${formatNumber(
      parsed.b,
    )} ${parsed.op2} ${formatNumber(parsed.c)} first.`,
    steps: buildStepsParenMul(
      parsed.a,
      parsed.b,
      parsed.c,
      parsed.op1,
      parsed.op2,
    ),
    confidence: 0.9,
  };
};

const detectAddBeforeMultiply = (
  parsed: ParsedQuestion,
  studentAnswer: number,
) => {
  if (parsed.kind !== "bidmasAddMul" || parsed.op2 !== "×") return null;
  const wrong = applyOp(applyOp(parsed.a, parsed.op1, parsed.b), parsed.op2, parsed.c);
  if (studentAnswer !== wrong) return null;
  return {
    message: "You added/subtracted before multiplying.",
    steps: buildStepsAddMul(
      parsed.a,
      parsed.b,
      parsed.c,
      parsed.op1,
      parsed.op2,
    ),
    confidence: 0.85,
  };
};

const detectLeftToRightDivision = (
  parsed: ParsedQuestion,
  studentAnswer: number,
) => {
  if (parsed.kind !== "bidmasAddMul" || parsed.op2 !== "÷") return null;
  const wrong = applyOp(applyOp(parsed.a, parsed.op1, parsed.b), parsed.op2, parsed.c);
  if (studentAnswer !== wrong) return null;
  return {
    message: "You went left-to-right before doing the division.",
    steps: buildStepsAddMul(
      parsed.a,
      parsed.b,
      parsed.c,
      parsed.op1,
      parsed.op2,
    ),
    confidence: 0.82,
  };
};

const detectMisreadMultiplyAsAdd = (
  parsed: ParsedQuestion,
  studentAnswer: number,
) => {
  if (parsed.kind !== "bidmasAddMul" || parsed.op2 !== "×") return null;
  const wrong = applyOp(applyOp(parsed.a, parsed.op1, parsed.b), "+", parsed.c);
  if (studentAnswer !== wrong) return null;
  return {
    message: "It looks like × was treated like +.",
    steps: buildStepsAddMul(
      parsed.a,
      parsed.b,
      parsed.c,
      parsed.op1,
      parsed.op2,
    ),
    confidence: 0.7,
  };
};

const detectMisreadDivideAsMultiply = (
  parsed: ParsedQuestion,
  studentAnswer: number,
) => {
  if (parsed.kind === "mulDiv" && parsed.op === "÷") {
    const wrong = parsed.a * parsed.b;
    if (studentAnswer !== wrong) return null;
    return {
      message: "It looks like ÷ was treated like ×.",
      steps: buildStepsMulDiv(parsed.a, parsed.b, parsed.op),
      confidence: 0.7,
    };
  }
  if (parsed.kind === "bidmasAddMul" && parsed.op2 === "÷") {
    const wrong = applyOp(parsed.a, parsed.op1, parsed.b * parsed.c);
    if (studentAnswer !== wrong) return null;
    return {
      message: "It looks like ÷ was treated like ×.",
      steps: buildStepsAddMul(
        parsed.a,
        parsed.b,
        parsed.c,
        parsed.op1,
        parsed.op2,
      ),
      confidence: 0.7,
    };
  }
  return null;
};

const detectNegativeTimesNegative = (
  parsed: ParsedQuestion,
  studentAnswer: number,
) => {
  if (parsed.kind !== "mulDiv" || parsed.op !== "×") return null;
  if (parsed.a >= 0 || parsed.b >= 0) return null;
  const wrong = -(parsed.a * parsed.b);
  if (studentAnswer !== wrong) return null;
  return {
    message: "Negative × negative becomes positive.",
    steps: buildStepsMulDiv(parsed.a, parsed.b, parsed.op),
    confidence: 0.9,
  };
};

const detectNegativeDivideNegative = (
  parsed: ParsedQuestion,
  studentAnswer: number,
) => {
  if (parsed.kind !== "mulDiv" || parsed.op !== "÷") return null;
  if (parsed.a >= 0 || parsed.b >= 0) return null;
  const wrong = -(parsed.a / parsed.b);
  if (studentAnswer !== wrong) return null;
  return {
    message: "Negative ÷ negative becomes positive.",
    steps: buildStepsMulDiv(parsed.a, parsed.b, parsed.op),
    confidence: 0.9,
  };
};

const detectLostNegativeOnMultiplyDivide = (
  parsed: ParsedQuestion,
  studentAnswer: number,
) => {
  if (parsed.kind !== "mulDiv") return null;
  const negativeCount = [parsed.a, parsed.b].filter((n) => n < 0).length;
  if (negativeCount !== 1) return null;
  const wrong = applyOp(Math.abs(parsed.a), parsed.op, Math.abs(parsed.b));
  if (studentAnswer !== wrong) return null;
  return {
    message: "A single negative makes the answer negative.",
    steps: buildStepsMulDiv(parsed.a, parsed.b, parsed.op),
    confidence: 0.75,
  };
};

const detectDropNegativeTerm = (
  parsed: ParsedQuestion,
  studentAnswer: number,
) => {
  if (parsed.kind !== "addSub") return null;
  const wrongA = applyOp(Math.abs(parsed.a), parsed.op, parsed.b);
  const wrongB = applyOp(parsed.a, parsed.op, Math.abs(parsed.b));
  if (studentAnswer !== wrongA && studentAnswer !== wrongB) return null;
  return {
    message: "A negative sign was dropped in the add/sub step.",
    steps: [
      `${formatNumber(parsed.a)} ${parsed.op} ${formatNumber(parsed.b)} = ${formatNumber(
        applyOp(parsed.a, parsed.op, parsed.b),
      )}.`,
    ],
    confidence: 0.7,
  };
};

const detectSubtractingNegative = (
  parsed: ParsedQuestion,
  studentAnswer: number,
) => {
  if (parsed.kind !== "addSub" || parsed.op !== "-" || parsed.b >= 0) return null;
  const wrong = parsed.a - Math.abs(parsed.b);
  if (studentAnswer !== wrong) return null;
  return {
    message: "Subtracting a negative turns into adding.",
    steps: [
      `${formatNumber(parsed.a)} - (${formatNumber(parsed.b)}) = ${formatNumber(
        parsed.a + Math.abs(parsed.b),
      )}.`,
    ],
    confidence: 0.8,
  };
};

const detectReverseOperands = (
  parsed: ParsedQuestion,
  studentAnswer: number,
) => {
  if (parsed.kind === "addSub" && parsed.op === "-") {
    if (studentAnswer !== parsed.b - parsed.a) return null;
    return {
      message: "It looks like the subtraction order was flipped.",
      steps: [`Order matters: ${formatNumber(parsed.a)} - ${formatNumber(parsed.b)}.`],
      confidence: 0.6,
    };
  }
  if (parsed.kind === "mulDiv" && parsed.op === "÷") {
    if (studentAnswer !== parsed.b / parsed.a) return null;
    return {
      message: "Division order matters; numerator and denominator flipped.",
      steps: [`Keep ${formatNumber(parsed.a)} on top: ${formatNumber(parsed.a)} ÷ ${formatNumber(parsed.b)}.`],
      confidence: 0.6,
    };
  }
  return null;
};

const detectDistributionMiss = (
  parsed: ParsedQuestion,
  studentAnswer: number,
) => {
  if (parsed.kind !== "bidmasParenMul" || parsed.op2 !== "×") return null;
  const wrongA = parsed.a * parsed.c + parsed.b;
  const wrongB = parsed.b * parsed.c + parsed.a;
  if (studentAnswer !== wrongA && studentAnswer !== wrongB) return null;
  return {
    message: "When distributing, both terms in the brackets get multiplied.",
    steps: buildStepsParenMul(
      parsed.a,
      parsed.b,
      parsed.c,
      parsed.op1,
      parsed.op2,
    ),
    confidence: 0.65,
  };
};

const detectOffByOne = (correctAnswer: number, studentAnswer: number) => {
  if (Math.abs(correctAnswer - studentAnswer) !== 1) return null;
  return {
    message: "You were off by 1 — double-check the final arithmetic.",
    confidence: 0.4,
  };
};

const detectCloseArithmeticSlip = (
  correctAnswer: number,
  studentAnswer: number,
) => {
  const diff = Math.abs(correctAnswer - studentAnswer);
  if (diff === 0 || diff > 2) return null;
  return {
    message: "Very close — check the last calculation step.",
    confidence: 0.35,
  };
};

const detectTimesTableSlip = (
  parsed: ParsedQuestion,
  studentAnswer: number,
) => {
  if (parsed.kind !== "bidmasAddMul" || parsed.op2 !== "×") return null;
  const base = applyOp(parsed.a, parsed.op1, applyOp(parsed.b, parsed.op2, parsed.c));
  const diff = studentAnswer - base;
  if (diff === 0 || Math.abs(diff) > 12) return null;
  return {
    message: "It looks like the multiply step was slightly off.",
    steps: buildStepsAddMul(
      parsed.a,
      parsed.b,
      parsed.c,
      parsed.op1,
      parsed.op2,
    ),
    confidence: 0.6,
  };
};

export const ERROR_PATTERNS: MistakePattern[] = [
  {
    id: "ignore_parentheses",
    name: "Ignored parentheses",
    description: "Computed without applying brackets first.",
    detector: ({ parsed, studentAnswer }) =>
      parsed ? detectIgnoreParentheses(parsed, studentAnswer) : null,
    explanationTemplate: "Do brackets first, then multiply/divide.",
    example: {
      question: "(3 + 4) × 2",
      wrong: "11",
      correct: "14",
      message: "It looks like you ignored the brackets.",
    },
    confidenceHint: 0.9,
  },
  {
    id: "add_before_multiply",
    name: "Added before multiplying",
    description: "Did a + b before b × c.",
    detector: ({ parsed, studentAnswer }) =>
      parsed ? detectAddBeforeMultiply(parsed, studentAnswer) : null,
    explanationTemplate: "Multiply before add/subtract.",
    example: {
      question: "2 + 3 × 4",
      wrong: "20",
      correct: "14",
      message: "You added before multiplying.",
    },
    confidenceHint: 0.85,
  },
  {
    id: "left_to_right_division",
    name: "Left-to-right before division",
    description: "Added/subtracted before dividing.",
    detector: ({ parsed, studentAnswer }) =>
      parsed ? detectLeftToRightDivision(parsed, studentAnswer) : null,
    explanationTemplate: "Do division before add/subtract.",
    example: {
      question: "8 + 6 ÷ 2",
      wrong: "7",
      correct: "11",
      message: "You went left-to-right before dividing.",
    },
    confidenceHint: 0.82,
  },
  {
    id: "misread_times_as_plus",
    name: "Misread × as +",
    description: "Read multiplication as addition.",
    detector: ({ parsed, studentAnswer }) =>
      parsed ? detectMisreadMultiplyAsAdd(parsed, studentAnswer) : null,
    explanationTemplate: "× means multiply.",
    example: {
      question: "1 + 2 × 3",
      wrong: "6",
      correct: "7",
      message: "It looks like × was treated like +.",
    },
    confidenceHint: 0.7,
  },
  {
    id: "misread_div_as_mul",
    name: "Misread ÷ as ×",
    description: "Read division as multiplication.",
    detector: ({ parsed, studentAnswer }) =>
      parsed ? detectMisreadDivideAsMultiply(parsed, studentAnswer) : null,
    explanationTemplate: "÷ means divide.",
    example: {
      question: "8 ÷ 2",
      wrong: "16",
      correct: "4",
      message: "It looks like ÷ was treated like ×.",
    },
    confidenceHint: 0.7,
  },
  {
    id: "neg_times_neg_is_neg",
    name: "Neg × neg is negative",
    description: "Treated negative × negative as negative.",
    detector: ({ parsed, studentAnswer }) =>
      parsed ? detectNegativeTimesNegative(parsed, studentAnswer) : null,
    explanationTemplate: "Negative × negative becomes positive.",
    example: {
      question: "-3 × -4",
      wrong: "-12",
      correct: "12",
      message: "Negative × negative becomes positive.",
    },
    confidenceHint: 0.9,
  },
  {
    id: "neg_div_neg_is_neg",
    name: "Neg ÷ neg is negative",
    description: "Treated negative ÷ negative as negative.",
    detector: ({ parsed, studentAnswer }) =>
      parsed ? detectNegativeDivideNegative(parsed, studentAnswer) : null,
    explanationTemplate: "Negative ÷ negative becomes positive.",
    example: {
      question: "-12 ÷ -3",
      wrong: "-4",
      correct: "4",
      message: "Negative ÷ negative becomes positive.",
    },
    confidenceHint: 0.9,
  },
  {
    id: "lost_negative_in_mul_div",
    name: "Lost negative in ×/÷",
    description: "Dropped the single negative sign in multiply/divide.",
    detector: ({ parsed, studentAnswer }) =>
      parsed ? detectLostNegativeOnMultiplyDivide(parsed, studentAnswer) : null,
    explanationTemplate: "One negative makes the result negative.",
    example: {
      question: "-6 × 3",
      wrong: "18",
      correct: "-18",
      message: "A single negative makes the answer negative.",
    },
    confidenceHint: 0.75,
  },
  {
    id: "drop_negative_term",
    name: "Dropped a negative term",
    description: "Ignored the negative sign in addition/subtraction.",
    detector: ({ parsed, studentAnswer }) =>
      parsed ? detectDropNegativeTerm(parsed, studentAnswer) : null,
    explanationTemplate: "Keep track of negative signs when adding/subtracting.",
    example: {
      question: "-5 + 2",
      wrong: "7",
      correct: "-3",
      message: "A negative sign was dropped in the add/sub step.",
    },
    confidenceHint: 0.7,
  },
  {
    id: "subtracting_negative_confusion",
    name: "Subtracting a negative confusion",
    description: "Treated a - (-b) as a - b.",
    detector: ({ parsed, studentAnswer }) =>
      parsed ? detectSubtractingNegative(parsed, studentAnswer) : null,
    explanationTemplate: "Subtracting a negative is the same as adding.",
    example: {
      question: "6 - -2",
      wrong: "4",
      correct: "8",
      message: "Subtracting a negative turns into adding.",
    },
    confidenceHint: 0.8,
  },
  {
    id: "reverse_operands",
    name: "Reversed operand order",
    description: "Swapped the order in subtraction/division.",
    detector: ({ parsed, studentAnswer }) =>
      parsed ? detectReverseOperands(parsed, studentAnswer) : null,
    explanationTemplate: "Order matters for subtraction and division.",
    example: {
      question: "10 - 4",
      wrong: "-6",
      correct: "6",
      message: "It looks like the subtraction order was flipped.",
    },
    confidenceHint: 0.6,
  },
  {
    id: "distribution_miss",
    name: "Incomplete distribution",
    description: "Multiplied only one term in brackets.",
    detector: ({ parsed, studentAnswer }) =>
      parsed ? detectDistributionMiss(parsed, studentAnswer) : null,
    explanationTemplate: "Multiply each bracket term by the outside number.",
    example: {
      question: "(2 + 3) × 4",
      wrong: "11",
      correct: "20",
      message: "Both terms should be multiplied.",
    },
    confidenceHint: 0.65,
  },
  {
    id: "times_table_slip",
    name: "Times table slip",
    description: "Small slip in the multiplication step.",
    detector: ({ parsed, studentAnswer }) =>
      parsed ? detectTimesTableSlip(parsed, studentAnswer) : null,
    explanationTemplate: "Recheck the multiplication step first.",
    example: {
      question: "(-8) + 7 × (-8)",
      wrong: "-67",
      correct: "-64",
      message: "It looks like the multiply step was slightly off.",
    },
    confidenceHint: 0.6,
  },
  {
    id: "off_by_one",
    name: "Off by one",
    description: "Answer is one away from correct.",
    detector: ({ studentAnswer, correctAnswer }) =>
      detectOffByOne(correctAnswer, studentAnswer),
    explanationTemplate: "Check the final arithmetic step.",
    example: {
      question: "7 + 5",
      wrong: "11",
      correct: "12",
      message: "You were off by 1.",
    },
    confidenceHint: 0.4,
  },
  {
    id: "close_arithmetic_slip",
    name: "Close arithmetic slip",
    description: "Small arithmetic slip near correct answer.",
    detector: ({ studentAnswer, correctAnswer }) =>
      detectCloseArithmeticSlip(correctAnswer, studentAnswer),
    explanationTemplate: "Close — double-check the arithmetic.",
    example: {
      question: "9 - 3",
      wrong: "8",
      correct: "6",
      message: "Very close — check the last calculation step.",
    },
    confidenceHint: 0.35,
  },
];

export const getPatternById = (id: string) =>
  ERROR_PATTERNS.find((pattern) => pattern.id === id) ?? null;

export const getParsedQuestion = (question: string) => parseQuestion(question);
