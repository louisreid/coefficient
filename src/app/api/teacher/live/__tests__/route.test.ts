/** @jest-environment node */
import { GET } from "@/app/api/teacher/live/route";
import { getServerSession } from "next-auth/next";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    student: {
      findMany: jest.fn(),
    },
  },
}));

const mockedGetServerSession = getServerSession as jest.Mock;
const mockedFindMany = prisma.student.findMany as jest.Mock;

describe("GET /api/teacher/live", () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockedFindMany.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/teacher/live");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("streams active students when authenticated", async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: "teacher-1" } });
    mockedFindMany.mockResolvedValue([
      {
        id: "student-1",
        nickname: "Cosmic Tiger",
        currentStreak: 3,
        currentQuestionPrompt: "1 + 1",
        currentSkillTag: "INT_ADD_SUB",
        class: { name: "Year 10" },
      },
    ]);

    const controller = new AbortController();
    const request = new NextRequest("http://localhost/api/teacher/live", {
      signal: controller.signal,
    });

    const response = await GET(request);
    const reader = response.body?.getReader();
    const chunk = await reader?.read();
    controller.abort();

    const decoded = new TextDecoder().decode(chunk?.value);
    const payloadJson = decoded.trim().replace(/^data:\s*/, "");
    const payload = JSON.parse(payloadJson);

    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(payload.students).toHaveLength(1);
    expect(payload.students[0].className).toBe("Year 10");
  });
});
