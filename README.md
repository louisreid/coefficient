# Gorilla Maths

Teacher-led, pseudonymous GCSE Maths Foundation grind app built with Next.js 14,
TypeScript, Tailwind CSS, Prisma, and SQLite.

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

## Production (gorillamaths.com)

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
