# Coefficient Assess — Fork Deliverables

## List of files changed (from repo root)

### New files
- `src/lib/competence/config.ts` — Competence units, ROV Pre-Dive scenario templates (22), scoring constants
- `src/lib/competence/types.ts` — ScenarioTemplate, Scenario types
- `src/lib/competence/generator.ts` — generateScenario, evaluateScenarioAnswer
- `src/lib/competence/scoring.ts` — computeScoringSummary, thresholds (FAIL/BORDERLINE/PASS)
- `src/lib/competence/index.ts` — Re-exports
- `src/lib/competence/__tests__/generator.test.ts` — Deterministic scenario test
- `src/lib/competence/__tests__/scoring.test.ts` — Threshold tests
- `src/lib/actions/assessments.ts` — getTraineeAssessmentSummaries, saveAssessmentOverrideAction, saveOverrideFormAction
- `src/app/teacher/class/[id]/student/[studentId]/review/page.tsx` — Review session page
- `src/app/teacher/class/[id]/student/[studentId]/review/ReviewOverrideForm.tsx` — Override form
- `src/app/api/teacher/evidence/route.ts` — Evidence pack HTML export
- `src/app/api/teacher/evidence/__tests__/route.test.ts` — Evidence route test
- `prisma/migrations/20260131000000_attempt_metadata/migration.sql` — Attempt.metadata
- `prisma/migrations/20260131000001_assessment_override/migration.sql` — AssessmentOverride table

### Modified files
- `src/lib/constants.ts` — SKILLS → COMPETENCE_UNITS (ROV_PRE_DIVE_GO_NO_GO)
- `src/lib/joinCode.ts` — Default prefix GOR → COE
- `src/lib/validation.ts` — joinCode regex COE-XXXX, attemptMetadataSchema, attemptSchema.metadata
- `src/lib/actions/attempts.ts` — AttemptInput.metadata, create with metadata
- `src/lib/analytics.ts` — topFailureModes from metadata.tags, at-risk with SCORING.AT_RISK_WRONG_THRESHOLD and criticalFail
- `src/lib/mistakes/explainWrongAnswer.ts` — Scenario payload, new API response shape (likelyFailureMode, correctAction, etc.)
- `src/app/api/student/explain/route.ts` — Assessor feedback prompt and JSON (likelyFailureMode, whyItMatters, correctAction, correctSequence, remediationDrill)
- `prisma/schema.prisma` — Attempt.metadata Json?, AssessmentOverride model, Student.assessmentOverrides
- `src/app/layout.tsx` — Title/description → Coefficient Assess
- `src/app/page.tsx` — Labels (Trainee, cohort, Assessor, pseudonym)
- `src/app/play/page.tsx` — Assessment, competence assessment
- `src/app/join/page.tsx` — Trainee join, cohort, assessor
- `src/app/teacher/page.tsx` — Assessor, cohorts, Create cohort
- `src/app/teacher/new/page.tsx` — Assessor setup, Create cohort, Cohort name
- `src/app/teacher/class/[id]/page.tsx` — Cohort labels, Top failure modes, Assessments section, Review session link
- `src/app/student/onboard/page.tsx` — Cohort, pseudonym
- `src/app/student/return/page.tsx` — Trainee return
- `src/components/PlayClient.tsx` — Scenario-based flow, ROV module, justification, metadata on attempt, assessor feedback
- `src/components/JoinForm.tsx` — Join cohort, placeholder COE-ABCD
- `src/components/OnboardForm.tsx` — Start assessment
- `src/components/TeacherLiveStudents.tsx` — Live active trainees
- `src/lib/__tests__/joinCode.test.ts` — COE-AAAA
- `src/lib/__tests__/validation.test.ts` — COE-AB12, ROV_PRE_DIVE_GO_NO_GO
- `src/__tests__/setup/factories.ts` — COE- prefix
- `src/lib/actions/__tests__/classes.test.ts` — COE-AB12
- `src/lib/actions/__tests__/students.test.ts` — COE-AAAA, COE-AB12
- `src/lib/actions/__tests__/attempts.test.ts` — COE-AB12
- `src/components/__tests__/OnboardForm.test.tsx` — COE-ABCD
- `src/components/__tests__/StudentReturnForm.test.tsx` — COE-AB12

## How to run locally

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Database**
   ```bash
   pnpm exec prisma migrate dev
   ```
   (Or `pnpm exec prisma db push` for dev.)

3. **Environment**
   - Copy `.env.example` to `.env` if present, or set `DATABASE_URL="file:./dev.db"` and optionally `GEMINI_API_KEY` for AI assessor feedback.

4. **Start dev server**
   ```bash
   pnpm dev
   ```

5. **Use the app**
   - Open the app (e.g. http://localhost:3000).
   - Sign in as assessor (Google OAuth) and create a cohort → get join code **COE-XXXX** and QR.
   - Join as trainee with cohort code + pseudonym + PIN → land in Assessment.
   - Complete scenarios (ROV Pre-Dive); wrong answers show rule-based + optional AI assessor feedback.
   - Assessor dashboard: live trainees, top failure modes, at-risk; Assessments tab → Review session → override status + Export Evidence Pack.

## Where to edit

- **Scenario templates and competence units**  
  `src/lib/competence/config.ts`  
  - `ROV_PRE_DIVE_TEMPLATES` — add or edit scenario templates (id, prompt, choices, correctIndex, rationale, tags, criticalFail).  
  - `COMPETENCE_UNITS`, `UNIT_LABELS` — add units or change labels.

- **Scoring thresholds**  
  `src/lib/competence/config.ts` (and used in `src/lib/competence/scoring.ts`)  
  - `SCORING.FAIL_ACCURACY_PCT` (60), `SCORING.PASS_ACCURACY_PCT` (75), `SCORING.AT_RISK_WRONG_THRESHOLD` (5).

- **Join code prefix**  
  `src/lib/joinCode.ts` — default `"COE"`.  
  `src/lib/validation.ts` — regex `^COE-[A-Z0-9]{4}$`.
