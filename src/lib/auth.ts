import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "database" },
  pages: { signIn: "/auth/signin" },
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
