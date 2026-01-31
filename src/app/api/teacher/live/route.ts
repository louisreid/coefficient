import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ACTIVE_WINDOW_MS = 10 * 60 * 1000;
const PING_INTERVAL_MS = 4000;

export const dynamic = "force-dynamic";

const getActiveStudents = async (teacherId: string) => {
  const since = new Date(Date.now() - ACTIVE_WINDOW_MS);
  const students = await prisma.student.findMany({
    where: {
      lastActiveAt: { gte: since },
      class: { teacherId },
    },
    orderBy: { lastActiveAt: "desc" },
    take: 50,
    select: {
      id: true,
      nickname: true,
      currentStreak: true,
      currentQuestionPrompt: true,
      currentSkillTag: true,
      class: { select: { name: true } },
    },
  });

  return students.map((student) => ({
    id: student.id,
    nickname: student.nickname,
    className: student.class.name,
    currentStreak: student.currentStreak ?? 0,
    currentQuestionPrompt: student.currentQuestionPrompt,
    currentSkillTag: student.currentSkillTag,
  }));
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = async () => {
        try {
          const students = await getActiveStudents(session.user.id);
          const payload = {
            students,
            updatedAt: new Date().toISOString(),
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        } catch (error) {
          if (!closed) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  students: [],
                  updatedAt: new Date().toISOString(),
                })}\n\n`,
              ),
            );
          }
        }
      };

      await send();
      const interval = setInterval(send, PING_INTERVAL_MS);

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        controller.close();
      };

      request.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
