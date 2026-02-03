-- CreateEnum
CREATE TYPE "AssessmentSessionMode" AS ENUM ('SCENARIO', 'FIELD_VIDEO');

-- CreateEnum
CREATE TYPE "EvidenceCaptureType" AS ENUM ('PHOTO', 'VIDEO');

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "allowMediaUploads" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mediaRetentionDays" INTEGER;

-- CreateTable
CREATE TABLE "AssessmentSession" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "mode" "AssessmentSessionMode" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AssessmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceCapture" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "type" "EvidenceCaptureType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storagePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "durationSeconds" INTEGER,
    "notes" TEXT,
    "consentStored" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EvidenceCapture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaptureAssessment" (
    "id" TEXT NOT NULL,
    "captureId" TEXT NOT NULL,
    "aiOverallStatus" TEXT,
    "aiConfidence" DOUBLE PRECISION,
    "aiChecks" JSONB,
    "aiSummary" TEXT,
    "aiQuestions" JSONB,
    "triageFlags" JSONB,
    "trainerFinalStatus" TEXT,
    "trainerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaptureAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentSession_classId_idx" ON "AssessmentSession"("classId");

-- CreateIndex
CREATE INDEX "AssessmentSession_studentId_idx" ON "AssessmentSession"("studentId");

-- CreateIndex
CREATE INDEX "AssessmentSession_unitId_startedAt_idx" ON "AssessmentSession"("unitId", "startedAt");

-- CreateIndex
CREATE INDEX "EvidenceCapture_sessionId_idx" ON "EvidenceCapture"("sessionId");

-- CreateIndex
CREATE INDEX "EvidenceCapture_studentId_idx" ON "EvidenceCapture"("studentId");

-- CreateIndex
CREATE INDEX "EvidenceCapture_classId_idx" ON "EvidenceCapture"("classId");

-- CreateIndex
CREATE INDEX "EvidenceCapture_unitId_idx" ON "EvidenceCapture"("unitId");

-- CreateIndex
CREATE INDEX "EvidenceCapture_createdAt_idx" ON "EvidenceCapture"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CaptureAssessment_captureId_key" ON "CaptureAssessment"("captureId");

-- CreateIndex
CREATE INDEX "CaptureAssessment_captureId_idx" ON "CaptureAssessment"("captureId");

-- AddForeignKey
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceCapture" ADD CONSTRAINT "EvidenceCapture_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceCapture" ADD CONSTRAINT "EvidenceCapture_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceCapture" ADD CONSTRAINT "EvidenceCapture_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaptureAssessment" ADD CONSTRAINT "CaptureAssessment_captureId_fkey" FOREIGN KEY ("captureId") REFERENCES "EvidenceCapture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
