import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

async function wrappedHandler(
  req: Request,
  context: { params: Promise<Record<string, string | string[]>> },
) {
  try {
    return await handler(req, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[NextAuth]", error);
    // Return 500 with error message so it's visible in Network tab / logs without needing Vercel dashboard
    return new Response(
      JSON.stringify({ error: "Server error", message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const GET = wrappedHandler;
export const POST = wrappedHandler;
