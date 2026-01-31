"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatPill } from "@/components/ui/StatPill";
import { recordAttemptAction } from "@/lib/actions/attempts";
import { setStudentLiveQuestionAction } from "@/lib/actions/students";
import { ROV_PRE_DIVE_GO_NO_GO } from "@/lib/competence/config";
import {
  evaluateScenarioAnswer,
  generateScenario,
  getScenarioChoiceLabels,
} from "@/lib/competence/generator";
import type { Scenario } from "@/lib/competence/types";
import { explainWrongAnswer } from "@/lib/mistakes/explainWrongAnswer";
import type { MistakeExplanation } from "@/lib/mistakes/detectMistake";

type UnitStats = {
  correct: number;
  total: number;
  wrongStreak: number;
};

const getAccuracy = (stats: UnitStats) =>
  stats.total === 0 ? 0 : stats.correct / stats.total;

const getDifficultyForUnit = (stats: UnitStats) => {
  if (stats.total < 4) return 1;
  const accuracy = getAccuracy(stats);
  if (accuracy > 0.8) return 3;
  if (accuracy > 0.6) return 2;
  return 1;
};

const shortcutLabels = ["Q", "W", "A", "S"];
const choiceKeys = ["q", "w", "a", "s"];

export function PlayClient() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(
    null,
  );
  const [justification, setJustification] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"correct" | "wrong" | null>(
    null,
  );
  const [review, setReview] = useState<{
    studentAnswer: string;
    correctAnswer: string;
    explanation: MistakeExplanation | null;
    loading: boolean;
    aiExplanation: MistakeExplanation | null;
    aiLoading: boolean;
    aiOpened: boolean;
    revealCorrect: boolean;
  } | null>(null);
  const [pendingNext, setPendingNext] = useState<boolean>(false);
  const [streakDelta, setStreakDelta] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioStart, setScenarioStart] = useState(Date.now());
  const [unitStats, setUnitStats] = useState<UnitStats>({
    correct: 0,
    total: 0,
    wrongStreak: 0,
  });

  const labels = getScenarioChoiceLabels();
  const choices = useMemo(
    () =>
      scenario
        ? scenario.choices.map((text, i) => ({ label: labels[i], text }))
        : [],
    [scenario, labels],
  );
  const isReviewing = review !== null;

  useEffect(() => {
    const storedStudentId = localStorage.getItem("gorillamaths.studentId");
    const storedClassId = localStorage.getItem("gorillamaths.classId");
    const storedLoginAt = Number(localStorage.getItem("gorillamaths.loginAt") ?? "0");
    const maxSessionMs = 60 * 60 * 1000;
    if (!storedStudentId || !storedClassId) {
      setStudentId(null);
      setClassId(null);
      return;
    }
    if (!storedLoginAt || Date.now() - storedLoginAt > maxSessionMs) {
      localStorage.removeItem("gorillamaths.studentId");
      localStorage.removeItem("gorillamaths.classId");
      localStorage.removeItem("gorillamaths.loginAt");
      setStudentId(null);
      setClassId(null);
      router.push("/student/return");
      return;
    }
    setStudentId(storedStudentId);
    setClassId(storedClassId);
  }, [router]);

  useEffect(() => {
    if (streakDelta === null) return;
    const timeout = window.setTimeout(() => setStreakDelta(null), 900);
    return () => window.clearTimeout(timeout);
  }, [streakDelta]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => {
      setFeedback(null);
      setFeedbackTone(null);
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const nextScenario = useCallback(
    async (difficultyOverride?: number) => {
      if (!studentId) return;
      const difficulty =
        difficultyOverride ?? getDifficultyForUnit(unitStats);
      const seed = `${studentId}:${scenarioIndex + 1}`;
      const next = generateScenario(
        ROV_PRE_DIVE_GO_NO_GO,
        difficulty,
        seed,
      );
      setScenario(next);
      setScenarioIndex((prev) => prev + 1);
      setScenarioStart(Date.now());
      setSelectedChoiceIndex(null);
      setJustification("");
      setReview(null);
      setPendingNext(false);
      await setStudentLiveQuestionAction({
        studentId,
        questionHash: next.idHash,
        prompt: next.prompt,
        skillTag: next.skillTag,
      });
    },
    [studentId, scenarioIndex, unitStats],
  );

  useEffect(() => {
    if (studentId && !scenario) {
      void nextScenario();
    }
  }, [studentId, scenario, nextScenario]);

  const recordAttempt = useCallback(
    async (
      isCorrect: boolean,
      studentAnswer: string,
      meta?: {
        scenarioId: string;
        choiceSelected: string;
        correctChoice: string;
        tags: string[];
        criticalFail: boolean;
        justification: string;
      },
    ) => {
      if (!studentId || !classId || !scenario) return;
      await recordAttemptAction({
        classId,
        studentId,
        questionHash: scenario.idHash,
        prompt: scenario.prompt,
        skillTag: scenario.skillTag,
        difficulty: scenario.difficulty,
        correctAnswer: scenario.correctAnswer,
        studentAnswer,
        isCorrect,
        responseTimeMs: Math.max(0, Date.now() - scenarioStart),
        metadata: meta ?? undefined,
      });
    },
    [studentId, classId, scenario, scenarioStart],
  );

  const onSubmit = useCallback(async () => {
    if (!scenario || isReviewing) return;
    const selectedLabel =
      selectedChoiceIndex !== null
        ? labels[selectedChoiceIndex] ?? ""
        : "";
    const studentAnswer = selectedLabel;
    const isCorrect = evaluateScenarioAnswer(scenario, studentAnswer);
    const meta = {
      scenarioId: scenario.templateId,
      choiceSelected: studentAnswer,
      correctChoice: scenario.correctAnswer,
      tags: scenario.tags,
      criticalFail: scenario.criticalFail && !isCorrect,
      justification: justification.trim(),
    };
    await recordAttempt(isCorrect, studentAnswer, meta);

    setUnitStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
      wrongStreak: isCorrect ? 0 : prev.wrongStreak + 1,
    }));

    if (isCorrect) {
      setStreak((prev) => prev + 1);
      setFeedback("Correct! Streak +1.");
      setFeedbackTone("correct");
      setStreakDelta(1);
      setReview(null);
      setPendingNext(false);
      await nextScenario();
      return;
    }

    const delta = streak > 0 ? -streak : null;
    setStreak(0);
    setFeedbackTone("wrong");
    setStreakDelta(delta ?? 0);
    setPendingNext(true);

    const explanation = await explainWrongAnswer({
      question: scenario.prompt,
      correctAnswer: scenario.correctAnswer,
      studentAnswer: studentAnswer || "—",
      skillTag: scenario.skillTag,
      scenarioPrompt: scenario.prompt,
      traineeChoice: studentAnswer,
      correctChoice: scenario.correctAnswer,
      tags: scenario.tags,
      criticalFail: scenario.criticalFail,
      justification: justification.trim() || undefined,
    });

    setReview({
      studentAnswer: studentAnswer || "—",
      correctAnswer: scenario.correctAnswer,
      explanation,
      loading: false,
      aiExplanation: null,
      aiLoading: false,
      aiOpened: false,
      revealCorrect: false,
    });
  }, [
    scenario,
    isReviewing,
    selectedChoiceIndex,
    justification,
    labels,
    nextScenario,
    recordAttempt,
    streak,
    unitStats,
  ]);

  const handleChoiceSelect = useCallback(
    (index: number) => {
      if (isReviewing) return;
      setSelectedChoiceIndex(index);
    },
    [isReviewing],
  );

  useEffect(() => {
    if (!choices.length) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (isReviewing) {
        if (event.key === "Enter") {
          event.preventDefault();
          void handleNextScenario();
        }
        return;
      }
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (event.key === "Enter") {
        if (!isTypingTarget && selectedChoiceIndex !== null) {
          event.preventDefault();
          void onSubmit();
        }
        return;
      }

      if (isTypingTarget) return;

      const key = event.key.toLowerCase();
      const index = choiceKeys.indexOf(key);

      if (index >= 0 && index < choices.length) {
        event.preventDefault();
        handleChoiceSelect(index);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [choices, handleChoiceSelect, isReviewing, onSubmit, selectedChoiceIndex]);

  const handleNextScenario = async () => {
    if (review && !review.revealCorrect) {
      setReview((prev) => (prev ? { ...prev, revealCorrect: true } : prev));
      return;
    }
    setReview(null);
    setPendingNext(false);
    await nextScenario();
  };

  const handleRedoScenario = () => {
    setReview(null);
    setPendingNext(false);
    setSelectedChoiceIndex(null);
    setJustification("");
  };

  const handleSkipScenario = async () => {
    setReview(null);
    setPendingNext(false);
    await nextScenario();
  };

  const handleOpenAi = async () => {
    if (!review || review.aiOpened || !scenario) return;
    setReview((prev) =>
      prev ? { ...prev, aiOpened: true, aiLoading: true } : prev,
    );
    const explanation = await explainWrongAnswer({
      question: scenario.prompt,
      correctAnswer: scenario.correctAnswer,
      studentAnswer: review.studentAnswer,
      skillTag: scenario.skillTag,
      forceLlm: true,
      scenarioPrompt: scenario.prompt,
      traineeChoice: review.studentAnswer,
      correctChoice: scenario.correctAnswer,
      tags: scenario.tags,
      criticalFail: scenario.criticalFail,
      justification: justification.trim() || undefined,
    });
    setReview((prev) =>
      prev
        ? { ...prev, aiExplanation: explanation, aiLoading: false }
        : prev,
    );
  };

  if (!studentId || !classId) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="text-xl font-semibold text-slate-900">
          You are not in a cohort yet.
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Join a cohort first to start assessment.
        </p>
        <Button className="mt-4 w-full" onClick={() => router.push("/join")}>
          Join a cohort
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <StatPill label="Streak" value={streak} />
          <AnimatePresence>
            {streakDelta !== null ? (
              <motion.span
                key={`${streakDelta}`}
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: -8, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className={`absolute -right-2 -top-3 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  streakDelta > 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {streakDelta > 0 ? `+${streakDelta}` : streakDelta}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
        <StatPill label="Scenarios" value={unitStats.total} />
        <StatPill label="Unit" value={scenario?.skillTag ?? ""} />
      </div>

      <Card className="text-center">
        <p className="text-sm uppercase tracking-wide text-slate-500">
          Scenario
        </p>
        <div className="mt-4 text-lg font-semibold text-slate-900">
          {scenario?.prompt ?? "Loading..."}
        </div>
      </Card>

      {review ? (
        <Card className="text-left">
          <p className="text-sm font-semibold text-slate-700">
            Review before moving on
          </p>
          <div className="mt-3 grid gap-2 text-sm text-slate-700">
            <p>
              Your answer:{" "}
              <span className="font-semibold">{review.studentAnswer}</span>
            </p>
            {review.revealCorrect ? (
              <p>
                Correct answer:{" "}
                <span className="font-semibold">{review.correctAnswer}</span>
              </p>
            ) : null}
            <p>
              Failure mode:{" "}
              <span className="font-semibold">
                {review.loading
                  ? "Checking..."
                  : review.explanation?.message ?? "Review the correct procedure."}
              </span>
            </p>
            {review.explanation?.steps?.length ? (
              <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                {review.explanation.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <details
            className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            onToggle={(event) => {
              const open = (event.target as HTMLDetailsElement).open;
              if (open) void handleOpenAi();
            }}
          >
            <summary className="cursor-pointer text-slate-600">
              Need more help? See assessor feedback
            </summary>
            <div className="mt-2 text-xs text-slate-600">
              {review.aiLoading
                ? "Thinking..."
                : review.aiExplanation?.message ??
                  "Open the accordion to load a suggestion."}
            </div>
            {review.aiExplanation?.steps?.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                {review.aiExplanation.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            ) : null}
          </details>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRedoScenario}
            >
              Redo scenario
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSkipScenario}
            >
              Skip scenario
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleNextScenario()}
            >
              {review.revealCorrect ? "Next scenario" : "Reveal answer"}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="text-center">
        <p className="text-sm uppercase tracking-wide text-slate-500">
          Choose an option
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {choices.map((choice, index) => (
            <Button
              key={`${choice.label}-${index}`}
              variant="secondary"
              size="lg"
              type="button"
              onClick={() => handleChoiceSelect(index)}
              className={`relative flex items-start justify-start gap-2 text-left ${
                selectedChoiceIndex === index ? "ring-2 ring-slate-400" : ""
              }`}
            >
              <span className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm">
                {shortcutLabels[index] ?? ""}
              </span>
              <span className="flex-1">
                <span className="font-semibold">{choice.label}.</span>{" "}
                {choice.text}
              </span>
            </Button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <label className="block text-left text-sm font-semibold text-slate-600">
            Why did you choose this? (optional)
          </label>
          <Input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => {
              if (event.key === "Enter" && selectedChoiceIndex !== null) {
                event.preventDefault();
                void onSubmit();
              }
            }}
            placeholder="Short justification..."
            className="text-left"
            disabled={isReviewing}
          />
        </div>

        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (selectedChoiceIndex !== null) void onSubmit();
          }}
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              size="lg"
              type="submit"
              disabled={isReviewing || selectedChoiceIndex === null}
            >
              Submit
            </Button>
            <Button
              variant="ghost"
              size="lg"
              type="button"
              onClick={() => {
                setSelectedChoiceIndex(null);
                setJustification("");
              }}
              disabled={isReviewing}
            >
              Clear
            </Button>
          </div>
        </form>

        <p className="mt-3 text-xs text-slate-500">
          Shortcuts: Q/W/A/S. Enter submits your answer.
        </p>
        <AnimatePresence mode="wait">
          {feedback ? (
            <motion.p
              key={feedback}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className={`mt-2 text-sm ${
                feedbackTone === "correct"
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {feedback}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </Card>
    </div>
  );
}
