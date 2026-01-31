import { execSync } from "node:child_process";
import { prisma } from "@/lib/db";

const testDatabaseUrl = process.env.DATABASE_URL ?? "file:./test.db";
let hasMigrated = false;

export const setupTestDatabase = () => {
  if (hasMigrated) return;
  execSync("pnpm prisma migrate deploy", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
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
