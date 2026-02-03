/** @jest-environment node */
import { GET } from "../route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  prisma: {
    student: { findFirst: jest.fn() },
    class: { findUnique: jest.fn() },
  },
}));

const mockStudentFindFirst = prisma.student.findFirst as jest.Mock;
const mockClassFindUnique = prisma.class.findUnique as jest.Mock;

describe("GET /api/student/cohort-settings", () => {
  beforeEach(() => {
    mockStudentFindFirst.mockReset();
    mockClassFindUnique.mockReset();
  });

  it("returns 400 when classId is missing", async () => {
    const req = new NextRequest(
      "http://localhost/api/student/cohort-settings?studentId=s1"
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Missing");
  });

  it("returns 400 when studentId is missing", async () => {
    const req = new NextRequest(
      "http://localhost/api/student/cohort-settings?classId=c1"
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Missing");
  });

  it("returns 404 when student not in class", async () => {
    mockStudentFindFirst.mockResolvedValue(null);
    const req = new NextRequest(
      "http://localhost/api/student/cohort-settings?classId=c1&studentId=s1"
    );
    const res = await GET(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("Student");
  });

  it("returns 404 when class not found", async () => {
    mockStudentFindFirst.mockResolvedValue({ id: "s1" });
    mockClassFindUnique.mockResolvedValue(null);
    const req = new NextRequest(
      "http://localhost/api/student/cohort-settings?classId=c1&studentId=s1"
    );
    const res = await GET(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("Class");
  });

  it("returns allowMediaUploads and fieldVideoUnits when student and class exist", async () => {
    mockStudentFindFirst.mockResolvedValue({ id: "s1" });
    mockClassFindUnique.mockResolvedValue({
      allowMediaUploads: true,
    });
    const req = new NextRequest(
      "http://localhost/api/student/cohort-settings?classId=c1&studentId=s1"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.allowMediaUploads).toBe(true);
    expect(Array.isArray(data.fieldVideoUnits)).toBe(true);
    expect(data.fieldVideoUnits.length).toBeGreaterThan(0);
    expect(data.fieldVideoUnits[0]).toHaveProperty("unitId");
    expect(data.fieldVideoUnits[0]).toHaveProperty("steps");
  });

  it("returns empty fieldVideoUnits when allowMediaUploads is false", async () => {
    mockStudentFindFirst.mockResolvedValue({ id: "s1" });
    mockClassFindUnique.mockResolvedValue({
      allowMediaUploads: false,
    });
    const req = new NextRequest(
      "http://localhost/api/student/cohort-settings?classId=c1&studentId=s1"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.allowMediaUploads).toBe(false);
    expect(data.fieldVideoUnits).toEqual([]);
  });
});
