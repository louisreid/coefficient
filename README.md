
## Proof of Concept: Coefficient Assess (Vocational Competence MVP)

This repository is a fork of **Gorilla Maths** repurposed into a **vocational competence assessment MVP**. The goal is to demonstrate that an **AI-native, scenario-based assessor** can reduce instructor workload while producing **audit-friendly evidence** aligned to real-world competence frameworks (initial design partner focus: **ROV training**).

### What this POC proves
This POC is designed to validate the core assumptions needed for a YC-grade application:

- **Assessor-led distribution works**: An assessor creates a cohort and shares a join code/QR. Trainees join anonymously using a nickname + PIN (no emails, no PII).
- **Scenario-based competence checks work without a simulator**: Trainees complete short operational scenarios (multiple-choice + optional justification) mapped to a single competence unit.
- **Automated evidence is possible**: Every response is logged and can be exported as a printable **Evidence Pack** (transcript + rubric scoring + critical failures + assessor sign-off).
- **AI adds value where it matters**: On incorrect answers, an optional AI “assessor feedback” explains the likely failure mode, why it matters (safety/ops impact), the correct action sequence, and a remediation micro-drill.
- **Assessor workflow is supported**: Assessors can review sessions, override outcomes (PASS/BORDERLINE/FAIL), add notes, and monitor live activity and common failure modes across a cohort.

### MVP scope (intentionally narrow)
This POC implements **one competence module only** (e.g., “ROV Pre-Dive / Pre-Launch Go/No-Go & Safety Checks”) to stay focused on proving the system loop end-to-end:

1. Create cohort → share join code  
2. Trainee joins anonymously  
3. Trainee completes a short assessment session  
4. AI supports feedback and scoring  
5. Assessor reviews / overrides  
6. Evidence pack exported

### What this is not (non-goals)
- Not a full training platform, LMS, or curriculum library  
- Not a 3D simulator or hardware-integrated training system  
- Not a certification authority or compliance replacement  
- Not built to store trainee PII or long-term identity data

### Why it matters
If this loop works for ROV competence assessment, the same engine can generalize to other vocational domains (e.g., offshore operations, industrial safety, utilities, trades) by swapping the competence unit and scenario templates.

## How to run locally

```bash
pnpm install
pnpm prisma migrate dev
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to start.

## Teacher login (Google OAuth)

Create a Google OAuth app and set these in `.env`:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL` (e.g. `http://localhost:3000`)
- `NEXTAUTH_SECRET` (already generated locally)

## Production (https://coefficient-phi.vercel.app)

1. **Vercel**: Deploy the app and add the domain **gorillamaths.com** in Project → Settings → Domains. Point your DNS to the records Vercel shows.
2. **Environment variables** (Vercel → Settings → Environment Variables, Production):
   - `NEXTAUTH_URL` = `https://gorillamaths.com`
   - `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (same as local or new)
   - `DATABASE_URL` = your production database URL (e.g. Vercel Postgres, Neon). SQLite is for local only.
   - `NEXT_PUBLIC_APP_URL` = `https://gorillamaths.com` (optional; used so QR codes encode a full join URL)
   - `GEMINI_API_KEY` if you use Gemini in production
3. **Google OAuth**: In Google Cloud Console → Credentials → your OAuth client, add:
   - **Authorized JavaScript origins**: `https://gorillamaths.com`
   - **Authorized redirect URIs**: `https://gorillamaths.com/api/auth/callback/google`

Keep `NEXTAUTH_URL="http://localhost:3000"` in local `.env` for development.

## Notes

- SQLite database is configured in `.env` (`DATABASE_URL="file:./dev.db"`).
- Server Actions power mutations for class creation, joining, onboarding, and
  attempt recording.
- Question generation is deterministic by template and seeded values.
