import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardForm } from "@/components/OnboardForm";

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

describe("OnboardForm", () => {
  beforeEach(() => {
    mockedUseActionState.mockReset();
    push.mockReset();
    localStorage.clear();
  });

  it("enables submit after first name or nickname is set", async () => {
    mockedUseActionState.mockReturnValue([{ ok: false }, jest.fn(), false]);
    render(
      <OnboardForm
        classId="class-1"
        className="Math Class"
        joinCode="COE-ABCD"
      />,
    );

    const submit = screen.getByRole("button", { name: "Start assessment" });
    expect(submit).toBeDisabled();

    const nameInput = screen.getByPlaceholderText("Your first name or nickname");
    await userEvent.type(nameInput, "Alex");

    expect(submit).toBeEnabled();
  });

  it("stores IDs and redirects on success", async () => {
    mockedUseActionState.mockReturnValue([
      { ok: true, studentId: "student-1", classId: "class-1" },
      jest.fn(),
      false,
    ]);

    render(
      <OnboardForm
        classId="class-1"
        className="Math Class"
        joinCode="COE-ABCD"
      />,
    );

    await waitFor(() => {
      expect(localStorage.getItem("gorillamaths.studentId")).toBe("student-1");
      expect(localStorage.getItem("gorillamaths.classId")).toBe("class-1");
      expect(Number(localStorage.getItem("gorillamaths.loginAt"))).toBeGreaterThan(0);
      expect(push).toHaveBeenCalledWith("/play");
    });
  });
});
