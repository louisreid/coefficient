-- AlterTable
ALTER TABLE "Student" ADD COLUMN "pinHash" TEXT;
ALTER TABLE "Student" ADD COLUMN "pinUpdatedAt" DATETIME;
ALTER TABLE "Student" ADD COLUMN "currentStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Student" ADD COLUMN "currentQuestionHash" TEXT;
ALTER TABLE "Student" ADD COLUMN "currentQuestionPrompt" TEXT;
ALTER TABLE "Student" ADD COLUMN "currentSkillTag" TEXT;
ALTER TABLE "Student" ADD COLUMN "currentQuestionStartedAt" DATETIME;
