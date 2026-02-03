/** @jest-environment node */
import { GET } from "../route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

jest.mock("@/lib/db", () => ({
  prisma: {
    class: { findFirst: jest.fn() },
    evidenceCapture: { findFirst: jest.fn(), findMany: jest.fn() },
  },
}));

jest.mock("@/lib/fieldVideo/storage", () => ({
  getSignedUrlForPath: jest.fn().mockResolvedValue("https://signed.example/photo.jpg"),
}));

const mockGetServerSession = getServerSession as jest.Mock;
const mockClassFindFirst = prisma.class.findFirst as jest.Mock;
const mockCaptureFindFirst = prisma.evidenceCapture.findFirst as jest.Mock;
const mockCaptureFindMany = prisma.evidenceCapture.findMany as jest.Mock;

describe("GET /api/teacher/evidence/field", () => {
  beforeEach(() => {
    mockGetServerSession.mockReset();
    mockClassFindFirst.mockReset();
    mockCaptureFindFirst.mockReset();
    mockCaptureFindMany.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = new NextRequest(
      "http://localhost/api/teacher/evidence/field?classId=c1&captureId=cap1"
    );
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when classId is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "t1" } });
    const req = new NextRequest(
      "http://localhost/api/teacher/evidence/field?captureId=cap1"
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Missing");
  });

  it("returns 404 when class not found or not owned", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "t1" } });
    mockClassFindFirst.mockResolvedValue(null);
    const req = new NextRequest(
      "http://localhost/api/teacher/evidence/field?classId=c1&captureId=cap1"
    );
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("returns 400 when neither captureId, sessionId nor studentId provided", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "t1" } });
    mockClassFindFirst.mockResolvedValue({ id: "c1", name: "Class" });
    const req = new NextRequest(
      "http://localhost/api/teacher/evidence/field?classId=c1"
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("captureId");
  });

  it("returns HTML evidence pack for single capture when authorized", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "t1" } });
    mockClassFindFirst.mockResolvedValue({ id: "c1", name: "Test Class" });
    mockCaptureFindFirst.mockResolvedValue({
      id: "cap1",
      unitId: "HVAC_MINISPLIT_INDOOR_PREP",
      stepId: "STEP_1",
      createdAt: new Date("2025-02-01T12:00:00Z"),
      storagePath: "c1/cap1-photo.jpg",
      student: {
        nickname: "Trainee",
        legalName: null,
        identityBoundAt: null,
      },
      captureAssessment: {
        aiOverallStatus: "OK",
        aiSummary: "All good.",
        aiChecks: [
          { checkId: "PLATE_LEVEL", status: "OK", evidence: "Level." },
        ],
        trainerNote: null,
      },
    });

    const req = new NextRequest(
      "http://localhost/api/teacher/evidence/field?classId=c1&captureId=cap1"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain("Field evidence pack");
    expect(html).toContain("Test Class");
    expect(html).toContain("Trainee");
    expect(html).toContain("training feedback only");
    expect(html).toContain("PLATE_LEVEL");
  });

  it("returns HTML with no captures message when captureId not in class", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "t1" } });
    mockClassFindFirst.mockResolvedValue({ id: "c1", name: "Class" });
    mockCaptureFindFirst.mockResolvedValue(null);

    const req = new NextRequest(
      "http://localhost/api/teacher/evidence/field?classId=c1&captureId=nonexistent"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("No captures found");
  });
});
