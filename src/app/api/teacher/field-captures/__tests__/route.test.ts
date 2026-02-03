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
    evidenceCapture: { findMany: jest.fn() },
  },
}));

jest.mock("@/lib/fieldVideo/storage", () => ({
  getSignedUrlForPath: jest.fn().mockResolvedValue("https://signed.example/url"),
}));

const mockGetServerSession = getServerSession as jest.Mock;
const mockClassFindFirst = prisma.class.findFirst as jest.Mock;
const mockEvidenceCaptureFindMany = prisma.evidenceCapture.findMany as jest.Mock;

describe("GET /api/teacher/field-captures", () => {
  beforeEach(() => {
    mockGetServerSession.mockReset();
    mockClassFindFirst.mockReset();
    mockEvidenceCaptureFindMany.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = new NextRequest(
      "http://localhost/api/teacher/field-captures?classId=c1"
    );
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when classId is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "teacher1" } });
    const req = new NextRequest("http://localhost/api/teacher/field-captures");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Missing");
  });

  it("returns 404 when class not found or not owned by teacher", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "teacher1" } });
    mockClassFindFirst.mockResolvedValue(null);
    const req = new NextRequest(
      "http://localhost/api/teacher/field-captures?classId=c1"
    );
    const res = await GET(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("not found");
  });

  it("returns captures list when authenticated and class owned", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "teacher1" } });
    mockClassFindFirst.mockResolvedValue({ id: "c1" });
    mockEvidenceCaptureFindMany.mockResolvedValue([
      {
        id: "cap1",
        studentId: "s1",
        unitId: "HVAC_MINISPLIT_INDOOR_PREP",
        stepId: "STEP_1",
        type: "PHOTO",
        createdAt: new Date("2025-02-01T12:00:00Z"),
        storagePath: "c1/cap1-photo.jpg",
        thumbnailPath: null,
        notes: null,
        captureAssessment: {
          aiOverallStatus: "OK",
          aiConfidence: 0.9,
          triageFlags: { redFlags: [], criticalChecks: [] },
        },
        student: { nickname: "Trainee One" },
      },
    ]);

    const req = new NextRequest(
      "http://localhost/api/teacher/field-captures?classId=c1"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.captures).toHaveLength(1);
    expect(data.captures[0].id).toBe("cap1");
    expect(data.captures[0].nickname).toBe("Trainee One");
    expect(data.captures[0].overallStatus).toBe("OK");
  });
});
