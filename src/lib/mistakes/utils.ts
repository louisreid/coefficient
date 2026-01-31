export type ParsedQuestion =
  | {
      kind: "addSub";
      a: number;
      b: number;
      op: "+" | "-";
    }
  | {
      kind: "mulDiv";
      a: number;
      b: number;
      op: "×" | "÷";
    }
  | {
      kind: "bidmasAddMul";
      a: number;
      b: number;
      c: number;
      op1: "+" | "-";
      op2: "×" | "÷";
    }
  | {
      kind: "bidmasParenMul";
      a: number;
      b: number;
      c: number;
      op1: "+" | "-";
      op2: "×" | "÷";
    }
  | {
      kind: "bidmasParenAdd";
      a: number;
      b: number;
      c: number;
      op1: "+" | "-";
      op2: "+" | "-";
    };

const stripParens = (value: string) =>
  value.trim().replace(/^\(([-\d]+)\)$/, "$1");

const parseNumber = (value: string) => {
  const normalized = stripParens(value);
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const parseQuestion = (question: string): ParsedQuestion | null => {
  const bidmasParenMul =
    /^\(([-\d]+)\s([+-])\s([-\d]+)\)\s([×÷])\s([-\d()]+)$/.exec(question);
  if (bidmasParenMul) {
    const a = parseNumber(bidmasParenMul[1]);
    const b = parseNumber(bidmasParenMul[3]);
    const c = parseNumber(bidmasParenMul[5]);
    if (a !== null && b !== null && c !== null) {
      return {
        kind: "bidmasParenMul",
        a,
        b,
        c,
        op1: bidmasParenMul[2] as "+" | "-",
        op2: bidmasParenMul[4] as "×" | "÷",
      };
    }
  }

  const bidmasParenAdd =
    /^\(([-\d]+)\s([+-])\s([-\d]+)\)\s([+-])\s([-\d()]+)$/.exec(question);
  if (bidmasParenAdd) {
    const a = parseNumber(bidmasParenAdd[1]);
    const b = parseNumber(bidmasParenAdd[3]);
    const c = parseNumber(bidmasParenAdd[5]);
    if (a !== null && b !== null && c !== null) {
      return {
        kind: "bidmasParenAdd",
        a,
        b,
        c,
        op1: bidmasParenAdd[2] as "+" | "-",
        op2: bidmasParenAdd[4] as "+" | "-",
      };
    }
  }

  const bidmasAddMul =
    /^([-\d()]+)\s([+-])\s([-\d()]+)\s([×÷])\s([-\d()]+)$/.exec(question);
  if (bidmasAddMul) {
    const a = parseNumber(bidmasAddMul[1]);
    const b = parseNumber(bidmasAddMul[3]);
    const c = parseNumber(bidmasAddMul[5]);
    if (a !== null && b !== null && c !== null) {
      return {
        kind: "bidmasAddMul",
        a,
        b,
        c,
        op1: bidmasAddMul[2] as "+" | "-",
        op2: bidmasAddMul[4] as "×" | "÷",
      };
    }
  }

  const mulDiv = /^([-\d()]+)\s([×÷])\s([-\d()]+)$/.exec(question);
  if (mulDiv) {
    const a = parseNumber(mulDiv[1]);
    const b = parseNumber(mulDiv[3]);
    if (a !== null && b !== null) {
      return { kind: "mulDiv", a, b, op: mulDiv[2] as "×" | "÷" };
    }
  }

  const addSub = /^([-\d()]+)\s([+-])\s([-\d()]+)$/.exec(question);
  if (addSub) {
    const a = parseNumber(addSub[1]);
    const b = parseNumber(addSub[3]);
    if (a !== null && b !== null) {
      return { kind: "addSub", a, b, op: addSub[2] as "+" | "-" };
    }
  }

  return null;
};

export const applyOp = (left: number, op: "+" | "-" | "×" | "÷", right: number) => {
  if (op === "+") return left + right;
  if (op === "-") return left - right;
  if (op === "×") return left * right;
  return left / right;
};

export const formatNumber = (value: number) => {
  if (Number.isNaN(value)) return "NaN";
  if (!Number.isFinite(value)) return "∞";
  return `${value}`;
};
