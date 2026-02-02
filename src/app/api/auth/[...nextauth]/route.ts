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
    console.error("[NextAuth]", error);
    throw error;
  }
}

export const GET = wrappedHandler;
export const POST = wrappedHandler;
