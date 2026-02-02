/*
  Warnings:

  - You are about to alter the column `metadata` on the `Attempt` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "questionHash" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "skillTag" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "studentAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Attempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Attempt" ("classId", "correctAnswer", "createdAt", "difficulty", "id", "isCorrect", "metadata", "prompt", "questionHash", "responseTimeMs", "skillTag", "studentAnswer", "studentId") SELECT "classId", "correctAnswer", "createdAt", "difficulty", "id", "isCorrect", "metadata", "prompt", "questionHash", "responseTimeMs", "skillTag", "studentAnswer", "studentId" FROM "Attempt";
DROP TABLE "Attempt";
ALTER TABLE "new_Attempt" RENAME TO "Attempt";
CREATE INDEX "Attempt_classId_createdAt_idx" ON "Attempt"("classId", "createdAt");
CREATE INDEX "Attempt_studentId_createdAt_idx" ON "Attempt"("studentId", "createdAt");
CREATE INDEX "Attempt_skillTag_isCorrect_idx" ON "Attempt"("skillTag", "isCorrect");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
