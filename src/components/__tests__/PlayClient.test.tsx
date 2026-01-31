import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayClient } from "@/components/PlayClient";
import {
  buildQuestionChoices,
  generateQuestion,
  evaluateAnswer,
} from "@/lib/questions";
import { recordAttemptAction } from "@/lib/actions/attempts";
import { setStudentLiveQuestionAction } from "@/lib/actions/students";

jest.mock("@/lib/questions", () => ({
  buildQuestionChoices: jest.fn(),
  generateQuestion: jest.fn(),
  evaluateAnswer: jest.fn(),
  getHint: jest.fn(),
  getRescue: jest.fn(),
}));

jest.mock("@/lib/actions/attempts", () => ({
  recordAttemptAction: jest.fn(),
}));

jest.mock("@/lib/actions/students", () => ({
  setStudentLiveQuestionAction: jest.fn(),
}));

const mockedBuildQuestionChoices = buildQuestionChoices as jest.Mock;
const mockedGenerateQuestion = generateQuestion as jest.Mock;
const mockedEvaluateAnswer = evaluateAnswer as jest.Mock;
const mockedRecordAttempt = recordAttemptAction as jest.Mock;
const mockedSetLive = setStudentLiveQuestionAction as jest.Mock;

describe("PlayClient", () => {
  beforeEach(() => {
    localStorage.clear();
    mockedBuildQuestionChoices.mockReset();
    mockedGenerateQuestion.mockReset();
    mockedEvaluateAnswer.mockReset();
    mockedRecordAttempt.mockReset();
    mockedSetLive.mockReset();
  });

  it("prompts to join when no class info in storage", () => {
    render(<PlayClient />);
    expect(
      screen.getByText("You are not in a class yet."),
    ).toBeInTheDocument();
  });

  it("generates and submits a question when logged in", async () => {
    localStorage.setItem("gorillamaths.studentId", "student-1");
    localStorage.setItem("gorillamaths.classId", "class-1");
    localStorage.setItem("gorillamaths.loginAt", `${Date.now()}`);

    mockedGenerateQuestion.mockReturnValue({
      idHash: "Q123",
      prompt: "1 + 1",
      correctAnswer: "2",
      skillTag: "INT_ADD_SUB",
      difficulty: 1,
    });
    mockedBuildQuestionChoices.mockReturnValue(["1", "2", "3", "4"]);
    mockedEvaluateAnswer.mockReturnValue(true);

    render(<PlayClient />);

    await waitFor(() => {
      expect(screen.getByText("1 + 1")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Type your answer");
    await userEvent.type(input, "1");
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockedRecordAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          classId: "class-1",
          studentId: "student-1",
          questionHash: "Q123",
          studentAnswer: "1",
          isCorrect: true,
        }),
      );
    });

    expect(mockedSetLive).toHaveBeenCalled();
  });
});
