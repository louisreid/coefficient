import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (process.env.NODE_ENV === "production" && (value == null || value === "")) {
    throw new Error(
      `Missing required env for auth in production: ${name}. Set it in your hosting provider (e.g. Vercel).`,
    );
  }
  return value ?? "";
}

// NextAuth needs NEXTAUTH_URL in production (Vercel can infer from VERCEL_URL; setting it explicitly is safest).
const rawNextAuthUrl = (process.env.NEXTAUTH_URL ?? "").trim();
const nextAuthUrl =
  rawNextAuthUrl || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
if (process.env.NODE_ENV === "production" && !nextAuthUrl) {
  throw new Error(
    "Missing NEXTAUTH_URL in production. Set it in Vercel (e.g. https://coefficient.work) or rely on VERCEL_URL.",
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: getRequiredEnv("NEXTAUTH_SECRET"),
  // trustHost required in serverless/proxy environments; NextAuthOptions type may not include it
  ...({ trustHost: true } as Partial<NextAuthOptions>),
  providers: [
    GoogleProvider({
      clientId: getRequiredEnv("GOOGLE_CLIENT_ID"),
      clientSecret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
    }),
  ],
  session: { strategy: "database" },
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    redirect: async ({ url, baseUrl }) => {
      console.log("[NextAuth redirect]", { url, baseUrl });
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    signIn: async ({ user, account }) => {
      console.log("[NextAuth signIn]", {
        user: user?.email,
        provider: account?.provider,
        hasAccount: !!account,
      });
      return true;
    },
  },
};
