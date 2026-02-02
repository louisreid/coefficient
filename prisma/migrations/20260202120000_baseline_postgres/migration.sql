-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "email" TEXT,
    "legalName" TEXT,
    "identityBoundAt" TIMESTAMP(3),
    "pinHash" TEXT,
    "pinUpdatedAt" TIMESTAMP(3),
    "magicLinkToken" TEXT,
    "magicLinkExpires" TIMESTAMP(3),
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "currentQuestionHash" TEXT,
    "currentQuestionPrompt" TEXT,
    "currentSkillTag" TEXT,
    "currentQuestionStartedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentOverride" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "overrideStatus" TEXT NOT NULL,
    "assessorNote" TEXT,
    "assessorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetenceCriterion" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetenceCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailureMode" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailureMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "supporting" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnnotation" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "reasonForReview" TEXT,
    "suggestedFailureModeTags" JSONB,
    "modelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidencePack" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "identityBoundAt" TIMESTAMP(3),
    "snapshot" JSONB NOT NULL,
    "pdfBlobUrl" TEXT,

    CONSTRAINT "EvidencePack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Class_joinCode_key" ON "Class"("joinCode");

-- CreateIndex
CREATE INDEX "Class_teacherId_idx" ON "Class"("teacherId");

-- CreateIndex
CREATE INDEX "Student_classId_idx" ON "Student"("classId");

-- CreateIndex
CREATE INDEX "Student_email_idx" ON "Student"("email");

-- CreateIndex
CREATE INDEX "Attempt_classId_createdAt_idx" ON "Attempt"("classId", "createdAt");

-- CreateIndex
CREATE INDEX "Attempt_studentId_createdAt_idx" ON "Attempt"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "Attempt_skillTag_isCorrect_idx" ON "Attempt"("skillTag", "isCorrect");

-- CreateIndex
CREATE INDEX "AssessmentOverride_studentId_idx" ON "AssessmentOverride"("studentId");

-- CreateIndex
CREATE INDEX "AssessmentOverride_unitId_idx" ON "AssessmentOverride"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentOverride_studentId_unitId_key" ON "AssessmentOverride"("studentId", "unitId");

-- CreateIndex
CREATE INDEX "CompetenceCriterion_unitId_idx" ON "CompetenceCriterion"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetenceCriterion_unitId_code_key" ON "CompetenceCriterion"("unitId", "code");

-- CreateIndex
CREATE INDEX "FailureMode_unitId_idx" ON "FailureMode"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "FailureMode_unitId_tag_key" ON "FailureMode"("unitId", "tag");

-- CreateIndex
CREATE INDEX "EvidenceItem_attemptId_idx" ON "EvidenceItem"("attemptId");

-- CreateIndex
CREATE INDEX "EvidenceItem_criterionId_idx" ON "EvidenceItem"("criterionId");

-- CreateIndex
CREATE INDEX "AIAnnotation_attemptId_idx" ON "AIAnnotation"("attemptId");

-- CreateIndex
CREATE INDEX "EvidencePack_studentId_unitId_idx" ON "EvidencePack"("studentId", "unitId");

-- CreateIndex
CREATE INDEX "EvidencePack_exportedAt_idx" ON "EvidencePack"("exportedAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentOverride" ADD CONSTRAINT "AssessmentOverride_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "CompetenceCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnnotation" ADD CONSTRAINT "AIAnnotation_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
