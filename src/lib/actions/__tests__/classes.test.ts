/** @jest-environment node */
import { createClassAction, joinClassAction } from "@/lib/actions/classes";
import { prisma } from "@/lib/db";
import { setupTestDatabase, resetDatabase, disconnectDatabase } from "@/__tests__/setup/db";
import { createClass, createUser } from "@/__tests__/setup/factories";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

const mockedGetServerSession = getServerSession as jest.Mock;
const mockedRedirect = redirect as jest.Mock;

describe("classes actions", () => {
  beforeAll(() => setupTestDatabase());
  beforeEach(async () => resetDatabase());
  afterAll(async () => disconnectDatabase());

  it("joins a class when join code is valid", async () => {
    const klass = await createClass({ joinCode: "COE-AB12", teacherId: null });
    const formData = new FormData();
    formData.set("joinCode", "COE-AB12");

    const result = await joinClassAction({ ok: false }, formData);

    expect(result.ok).toBe(true);
    expect(result.classId).toBe(klass.id);
  });

  it("rejects invalid join code", async () => {
    const formData = new FormData();
    formData.set("joinCode", "BADCODE");

    const result = await joinClassAction({ ok: false }, formData);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Enter a valid join code.");
  });

  it("creates a class for an authenticated teacher", async () => {
    const teacher = await createUser({ email: "teacher@example.com" });
    mockedGetServerSession.mockResolvedValue({ user: { id: teacher.id } });

    const formData = new FormData();
    formData.set("className", "10A Maths");

    await createClassAction(formData);

    const created = await prisma.class.findFirst({ where: { name: "10A Maths" } });
    expect(created?.teacherId).toBe(teacher.id);
    expect(mockedRedirect).toHaveBeenCalledWith(
      `/teacher/class/${created?.id}`,
    );
  });
});
