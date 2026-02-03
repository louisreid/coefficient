/** @jest-environment node */
import { GET, PATCH } from "@/app/api/teacher/field-captures/[captureId]/route";
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

jest.mock("@/lib/fieldVideo/storage", () => ({
  getSignedUrlForPath: jest.fn().mockResolvedValue("https://signed.example/media"),
}));

const mockGetServerSession = getServerSession as jest.Mock;
const mockCaptureFindFirst = prisma.evidenceCapture.findFirst as jest.Mock;
const mockClassFindFirst = prisma.class.findFirst as jest.Mock;
const mockAssessmentUpdate = prisma.captureAssessment.update as jest.Mock;

async function getWithParams(captureId: string) {
  return GET(
    new NextRequest(`http://localhost/api/teacher/field-captures/${captureId}`),
    { params: Promise.resolve({ captureId }) }
  );
}

async function patchWithParams(captureId: string, body: object) {
  return PATCH(
    new NextRequest(`http://localhost/api/teacher/field-captures/${captureId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ captureId }) }
  );
}

describe("GET /api/teacher/field-captures/[captureId]", () => {
  beforeEach(() => {
    mockGetServerSession.mockReset();
    mockCaptureFindFirst.mockReset();
    mockClassFindFirst.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await getWithParams("cap1");
    expect(res.status).toBe(401);
  });

  it("returns 404 when capture not found", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "t1" } });
    mockCaptureFindFirst.mockResolvedValue(null);
    const res = await getWithParams("cap1");
    expect(res.status).toBe(404);
  });

  it("returns 403 when teacher does not own class", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "t1" } });
    mockCaptureFindFirst.mockResolvedValue({
      id: "cap1",
      classId: "c1",
      student: { nickname: "T" },
      captureAssessment: null,
    });
    mockClassFindFirst.mockResolvedValue(null);
    const res = await getWithParams("cap1");
    expect(res.status).toBe(403);
  });

  it("returns capture and assessment when authorized", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "t1" } });
    mockCaptureFindFirst.mockResolvedValue({
      id: "cap1",
      sessionId: "sess1",
      studentId: "st1",
      classId: "c1",
      unitId: "HVAC",
      stepId: "STEP_1",
      type: "PHOTO",
      createdAt: new Date("2025-02-01T12:00:00Z"),
      durationSeconds: null,
      notes: "Note",
      storagePath: "c1/cap1-photo.jpg",
      thumbnailPath: null,
      student: { nickname: "Trainee" },
      captureAssessment: {
        id: "assess1",
        aiOverallStatus: "WARN",
        aiConfidence: 0.8,
        aiChecks: [],
        aiSummary: "Summary",
        aiQuestions: [],
        triageFlags: {},
        trainerFinalStatus: null,
        trainerNote: null,
      },
    });
    mockClassFindFirst.mockResolvedValue({ id: "c1" });

    const res = await getWithParams("cap1");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.capture.id).toBe("cap1");
    expect(data.capture.nickname).toBe("Trainee");
    expect(data.assessment.aiOverallStatus).toBe("WARN");
  });
});

describe("PATCH /api/teacher/field-captures/[captureId]", () => {
  beforeEach(() => {
    mockGetServerSession.mockReset();
    mockCaptureFindFirst.mockReset();
    mockClassFindFirst.mockReset();
    mockAssessmentUpdate.mockResolvedValue({});
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await patchWithParams("cap1", { trainerNote: "Done" });
    expect(res.status).toBe(401);
  });

  it("returns 404 when capture not found", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "t1" } });
    mockCaptureFindFirst.mockResolvedValue(null);
    const res = await patchWithParams("cap1", { trainerFinalStatus: "OK" });
    expect(res.status).toBe(404);
  });

  it("updates assessment and returns 200 when authorized", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "t1" } });
    mockCaptureFindFirst.mockResolvedValue({
      id: "cap1",
      classId: "c1",
      captureAssessment: { id: "assess1" },
    });
    mockClassFindFirst.mockResolvedValue({ id: "c1" });

    const res = await patchWithParams("cap1", {
      trainerFinalStatus: "OK",
      trainerNote: "Looks good.",
    });
    expect(res.status).toBe(200);
    expect(mockAssessmentUpdate).toHaveBeenCalledWith({
      where: { id: "assess1" },
      data: { trainerFinalStatus: "OK", trainerNote: "Looks good." },
    });
  });
});
