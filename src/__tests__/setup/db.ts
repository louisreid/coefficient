import { execSync } from "node:child_process";
import { prisma } from "@/lib/db";

const testDatabaseUrl = process.env.DATABASE_URL;
const testDirectUrl = process.env.DIRECT_URL ?? testDatabaseUrl;
let hasMigrated = false;

export const setupTestDatabase = () => {
  if (!testDatabaseUrl) {
    throw new Error(
      "DATABASE_URL is required for tests (PostgreSQL). Use the same URL as dev, e.g. from your Supabase project (Dashboard → Project Settings → Database).",
    );
  }
  if (hasMigrated) return;
  execSync("pnpm prisma migrate deploy", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      DIRECT_URL: testDirectUrl,
    },
  });
  hasMigrated = true;
};

export const resetDatabase = async () => {
  await prisma.attempt.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
};
