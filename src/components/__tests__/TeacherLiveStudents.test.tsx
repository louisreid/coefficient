import { render, screen, waitFor } from "@testing-library/react";
import { TeacherLiveStudents } from "@/components/TeacherLiveStudents";

type MockMessageEvent = { data: string };

class MockEventSource {
  static instances: MockEventSource[] = [];
  onmessage: ((event: MockMessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  url: string;
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
  }

  emitMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  emitError() {
    this.onerror?.();
  }
}

describe("TeacherLiveStudents", () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    // @ts-expect-error - test shim
    global.EventSource = MockEventSource;
  });

  it("renders live students from SSE", async () => {
    render(<TeacherLiveStudents />);

    const instance = MockEventSource.instances[0];
    instance.emitMessage({
      students: [
        {
          id: "s1",
          nickname: "Silver Panda",
          className: "Year 10",
          currentStreak: 2,
          currentQuestionPrompt: "1 + 1",
          currentSkillTag: "INT_ADD_SUB",
        },
      ],
      updatedAt: new Date().toISOString(),
    });

    await waitFor(() => {
      expect(screen.getByText("Silver Panda")).toBeInTheDocument();
      expect(screen.getByText("Live")).toBeInTheDocument();
    });
  });

  it("shows offline status when SSE errors", async () => {
    render(<TeacherLiveStudents />);

    const instance = MockEventSource.instances[0];
    instance.emitError();

    await waitFor(() => {
      expect(screen.getByText("Offline")).toBeInTheDocument();
    });
  });
});
