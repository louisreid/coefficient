"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { classSchema, joinCodeSchema } from "@/lib/validation";
import { generateJoinCode } from "@/lib/joinCode";
import { authOptions } from "@/lib/auth";

export async function createClassAction(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/teacher/new");
  }

  const parsed = classSchema.safeParse({
    className: formData.get("className"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid class name");
  }

  let joinCode = generateJoinCode();
  let attempts = 0;

  while (attempts < 5) {
    const existing = await prisma.class.findUnique({ where: { joinCode } });
    if (!existing) break;
    joinCode = generateJoinCode();
    attempts += 1;
  }

  const newClass = await prisma.class.create({
    data: {
      name: parsed.data.className,
      tier: "Foundation",
      joinCode,
      teacherId: session.user.id,
    },
  });

  redirect(`/teacher/class/${newClass.id}`);
}

export type JoinClassState = {
  ok: boolean;
  error?: string;
  classId?: string;
};

export async function joinClassAction(
  _prevState: JoinClassState,
  formData: FormData,
): Promise<JoinClassState> {
  const parsed = joinCodeSchema.safeParse({
    joinCode: formData.get("joinCode"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Enter a valid join code." };
  }

  const joinCode = parsed.data.joinCode;
  const found = await prisma.class.findUnique({ where: { joinCode } });

  if (!found) {
    return { ok: false, error: "Join code not found." };
  }

  return { ok: true, classId: found.id };
}
