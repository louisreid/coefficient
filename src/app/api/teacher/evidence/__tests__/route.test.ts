import { GET } from "../route";

const mockGetServerSession = jest.fn();
jest.mock("next-auth/next", () => ({
  getServerSession: () => mockGetServerSession(),
}));

describe("GET /api/teacher/evidence", () => {
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue({ user: { id: "teacher1" } });
  });

  it("returns 400 when classId or studentId is missing", async () => {
    const url = "http://localhost/api/teacher/evidence";
    const req = new Request(url);
    const res = await GET(req);
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("Missing");
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = new Request(
      "http://localhost/api/teacher/evidence?classId=c1&studentId=s1"
    );
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
