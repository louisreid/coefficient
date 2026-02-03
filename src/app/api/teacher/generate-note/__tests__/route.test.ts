/** @jest-environment node */
import { POST } from "../route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

jest.mock("@/lib/db", () => ({
  prisma: {
    evidenceCapture: { findFirst: jest.fn() },
    class: { findFirst: jest.fn() },
    captureAssessment: { update: jest.fn() },
  },
}));

const mockGetServerSession = getServerSession as jest.Mock;
const mockCaptureFindFirst = prisma.evidenceCapture.findFirst as jest.Mock;
const mockClassFindFirst = prisma.class.findFirst as jest.Mock;

async function postGenerateNote(body: object) {
  return POST(
    new NextRequest("http://localhost/api/teacher/generate-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/teacher/generate-note", () => {
  beforeEach(() => {
    mockGetServerSession.mockReset();
    mockCaptureFindFirst.mockReset();
    mockClassFindFirst.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await postGenerateNote({ captureId: "cap1" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when body is not JSON", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "t1" } });
    const res = await POST(
      new NextRequest("http://localhost/api/teacher/generate-note", {
        method: "POST",
        body: "not json",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when captureId is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "t1" } });
    const res = await postGenerateNote({});
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("captureId");
  });

  it("returns 404 when capture not found", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "t1" } });
    mockCaptureFindFirst.mockResolvedValue(null);
    const res = await postGenerateNote({ captureId: "cap1" });
    expect(res.status).toBe(404);
  });

  it("returns 403 when teacher does not own class", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "t1" } });
    mockCaptureFindFirst.mockResolvedValue({
      id: "cap1",
      classId: "c1",
      captureAssessment: { id: "a1", aiSummary: "x" },
      student: { nickname: "T" },
    });
    mockClassFindFirst.mockResolvedValue(null);
    const res = await postGenerateNote({ captureId: "cap1" });
    expect(res.status).toBe(403);
  });

  it("returns 400 when capture has no assessment", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "t1" } });
    mockCaptureFindFirst.mockResolvedValue({
      id: "cap1",
      classId: "c1",
      captureAssessment: null,
      student: { nickname: "T" },
    });
    mockClassFindFirst.mockResolvedValue({ id: "c1" });
    const res = await postGenerateNote({ captureId: "cap1" });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("No assessment");
  });
});
