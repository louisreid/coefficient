import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSignedUrlForPath } from "@/lib/fieldVideo/storage";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ captureId: string }> };

/**
 * GET ?path=storagePath (optional; defaults to main media)
 * Returns signed URL for the capture's media. Teacher must own class.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { captureId } = await params;
  const { searchParams } = new URL(request.url);
  const pathParam = searchParams.get("path");

  if (!captureId) {
    return new Response(
      JSON.stringify({ error: "Missing captureId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const capture = await prisma.evidenceCapture.findFirst({
    where: { id: captureId },
    select: { classId: true, storagePath: true, thumbnailPath: true },
  });

  if (!capture) {
    return new Response(
      JSON.stringify({ error: "Capture not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const cls = await prisma.class.findFirst({
    where: { id: capture.classId, teacherId: session.user.id },
    select: { id: true },
  });
  if (!cls) {
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const path = pathParam === "thumbnail" ? capture.thumbnailPath ?? capture.storagePath : capture.storagePath;
  const url = await getSignedUrlForPath(path);
  if (!url) {
    return new Response(
      JSON.stringify({ error: "Failed to create signed URL" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return Response.redirect(url, 302);
}
