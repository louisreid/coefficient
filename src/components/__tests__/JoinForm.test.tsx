import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { JoinForm } from "@/components/JoinForm";

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

describe("JoinForm", () => {
  beforeEach(() => {
    mockedUseActionState.mockReset();
    push.mockReset();
  });

  it("renders error text when action returns error", () => {
    mockedUseActionState.mockReturnValue([
      { ok: false, error: "Enter a valid join code." },
      jest.fn(),
      false,
    ]);

    render(<JoinForm />);
    expect(screen.getByText("Enter a valid join code.")).toBeInTheDocument();
  });

  it("redirects to onboard when class is found", async () => {
    mockedUseActionState.mockReturnValue([
      { ok: true, classId: "class-123" },
      jest.fn(),
      false,
    ]);

    render(<JoinForm />);
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/student/onboard?classId=class-123"),
    );
  });
});
