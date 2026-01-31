-- CreateTable
CREATE TABLE "AssessmentOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "overrideStatus" TEXT NOT NULL,
    "assessorNote" TEXT,
    "assessorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentOverride_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentOverride_studentId_unitId_key" ON "AssessmentOverride"("studentId", "unitId");
CREATE INDEX "AssessmentOverride_studentId_idx" ON "AssessmentOverride"("studentId");
CREATE INDEX "AssessmentOverride_unitId_idx" ON "AssessmentOverride"("unitId");
