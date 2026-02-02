
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

Local development uses **PostgreSQL** via a **hosted Supabase project** (no Docker required).

1. **Create a Supabase project**: Go to [supabase.com](https://supabase.com) and create a project (or use MCP: list orgs → confirm cost → create project). Note your database password.

2. **Get connection strings**: In the Dashboard → **Project Settings → Database**, copy the **Connection string** (URI). Use **Session mode** for both `DATABASE_URL` and `DIRECT_URL` if not using the pooler; if using the pooler for `DATABASE_URL`, set `DIRECT_URL` to the **Session mode** URI for migrations.

3. **Set `.env`**: Copy `.env.example` to `.env` and set `DATABASE_URL` and `DIRECT_URL` to those URIs (replace `[YOUR-PASSWORD]` with your project’s database password).

4. **Apply migrations and run**:

   ```bash
   pnpm install
   pnpm prisma migrate deploy
   pnpm dev:local
   ```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) (or [http://localhost:3000](http://localhost:3000)) to start.

- **`pnpm dev:local`** — Recommended: binds to 127.0.0.1 and uses webpack (avoids `uv_interface_addresses` and Turbopack/Tailwind resolution issues).
- **`pnpm dev`** — Runs Next.js + Jest watch; use if you need the test watcher.

**Tests** require a Postgres database: set `DATABASE_URL` (and `DIRECT_URL` if using a pooler) in your environment—e.g. the same hosted Supabase URL as in your `.env`—then run `pnpm test`.

### Alternative: local Supabase (Docker)

If you prefer to run Postgres locally, **Docker** (or OrbStack/Podman) must be installed and running. Then:

```bash
npx supabase init   # once per repo
npx supabase start
npx supabase status # copy DB URL
```

Set `DATABASE_URL` and `DIRECT_URL` in `.env` to the DB URL from `supabase status` (e.g. `postgresql://postgres:postgres@127.0.0.1:54322/postgres`). For local, both can be the same. Then run `pnpm prisma migrate deploy` and `pnpm dev:local` as above.

## Environment variables

### Teacher login (Google OAuth)

Create a Google OAuth app and set these in `.env`:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL` (e.g. `http://localhost:3000`)
- `NEXTAUTH_SECRET` (already generated locally)

### Scenario explanations (Gemini)

For AI-powered wrong-answer explanations in scenario assessments, set:

- `GEMINI_API_KEY` — Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey). If unset, the explain API returns a fallback explanation and logs in development.

### Magic link (trainee return)

To email magic links when trainees return by email, set:

- `RESEND_API_KEY` — API key from [Resend](https://resend.com). If unset, magic-link emails are skipped (in dev the link is logged to the console).
- `MAGIC_LINK_FROM_EMAIL` (optional) — From address for magic-link emails; defaults to Resend’s onboarding address.

## Production (https://coefficient.work)

1. **Vercel**: Deploy the app and add the domain **coefficient.work** in Project → Settings → Domains. Point your DNS to the records Vercel shows.
2. **Environment variables** (Vercel → Settings → Environment Variables, Production):
   - `NEXTAUTH_URL` = `https://coefficient.work`
   - `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (same as local or new)
   - `DATABASE_URL` = your production Postgres URL (e.g. Supabase: Project Settings → Database → Connection string, URI; use Session mode for direct, or Transaction mode for pooler).
   - `DIRECT_URL` = same as `DATABASE_URL` if not using a pooler; if using Supabase pooler for `DATABASE_URL`, set this to the **Session mode** (direct) URI for migrations.
   - `NEXT_PUBLIC_APP_URL` = `https://coefficient.work` (optional; used so QR codes encode a full join URL)
   - `GEMINI_API_KEY` if you use Gemini in production

   After adding env, run `pnpm prisma migrate deploy` against the production DB (e.g. set `DATABASE_URL` and `DIRECT_URL` locally to production values, or run in CI) to apply migrations.
3. **Google OAuth**: In Google Cloud Console → Credentials → your OAuth client, add:
   - **Authorized JavaScript origins**: `https://coefficient.work`
   - **Authorized redirect URIs**: `https://coefficient.work/api/auth/callback/google`

Keep `NEXTAUTH_URL="http://localhost:3000"` in local `.env` for development.

## Notes

- Database is **PostgreSQL** (dev and tests via a hosted Supabase project, or optional local Supabase CLI + Docker; production via Supabase). Configure `DATABASE_URL` and `DIRECT_URL` in `.env` (see above).
- Server Actions power mutations for class creation, joining, onboarding, and
  attempt recording.
- Question generation is deterministic by template and seeded values.
