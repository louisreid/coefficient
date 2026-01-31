import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StudentReturnForm } from "@/components/StudentReturnForm";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    useActionState: jest.fn(),
  };
});

const mockedUseActionState = React.useActionState as jest.Mock;

describe("StudentReturnForm", () => {
  beforeEach(() => {
    mockedUseActionState.mockReset();
    push.mockReset();
    localStorage.clear();
  });

  it("toggles between login and reset views", async () => {
    mockedUseActionState
      .mockImplementationOnce(() => [{ ok: false }, jest.fn(), false])
      .mockImplementationOnce(() => [{ ok: false }, jest.fn(), false])
      .mockImplementationOnce(() => [{ ok: false }, jest.fn(), false]);

    render(<StudentReturnForm />);

    expect(
      screen.getByRole("button", { name: "Return to class" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "I forgot my PIN" }));

    expect(
      screen.getByRole("button", { name: "Start reset challenge" }),
    ).toBeInTheDocument();
  });

  it("renders reset attempts when challenge succeeds", async () => {
    mockedUseActionState
      .mockImplementationOnce(() => [{ ok: false }, jest.fn(), false])
      .mockImplementationOnce(() => [
        {
          ok: true,
          joinCode: "COE-AB12",
          nickname: "Clever Gorilla",
          attempts: [
            { id: "a1", prompt: "1 + 1", correctAnswer: "2" },
            { id: "a2", prompt: "2 + 2", correctAnswer: "4" },
            { id: "a3", prompt: "3 + 3", correctAnswer: "6" },
            { id: "a4", prompt: "4 + 4", correctAnswer: "8" },
            { id: "a5", prompt: "5 + 5", correctAnswer: "10" },
          ],
        },
        jest.fn(),
        false,
      ])
      .mockImplementationOnce(() => [{ ok: false }, jest.fn(), false]);

    render(<StudentReturnForm />);

    await userEvent.click(screen.getByRole("button", { name: "I forgot my PIN" }));

    await waitFor(() => {
      expect(screen.getAllByRole("checkbox")).toHaveLength(5);
    });
  });
});
