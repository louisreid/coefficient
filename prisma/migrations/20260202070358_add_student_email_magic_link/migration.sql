-- AlterTable
ALTER TABLE "Student" ADD COLUMN "email" TEXT;
ALTER TABLE "Student" ADD COLUMN "magicLinkExpires" DATETIME;
ALTER TABLE "Student" ADD COLUMN "magicLinkToken" TEXT;

-- CreateIndex
CREATE INDEX "Student_email_idx" ON "Student"("email");
