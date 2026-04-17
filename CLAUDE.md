# Magis

AI-powered personal training platform. Three user tiers: Solo/AI, Coached Client, Coach.

## Tech Stack

- **Frontend:** Next.js 14.2 (App Router), Tailwind, TypeScript
- **Backend:** Supabase (Postgres, Auth, RLS), Vercel
- **AI:** Anthropic Claude API (Sonnet for program generation)
- **PWA:** Serwist service worker

## Product Spec

The canonical product spec is `Magis_Product_Spec_v5.md` in the repo root. This is the single source of truth for feature scope, user tiers, onboarding flows, UI structure, and build phases.

**Rules:**
- Always consult the spec before making decisions about feature scope, user flows, or UI structure.
- If a code change contradicts the spec, flag it before proceeding.
- When an implementation decision changes the spec, update `Magis_Product_Spec_v5.md` in the same commit as the code change.
- Never edit the spec without explaining what changed and why in the commit message.

## Project Structure

- `src/app/(auth)/` — auth flows: login, signup, onboarding, role selection
- `src/app/(client)/` — client-facing: home, workout logging, calendar, history, profile
- `src/app/(coach)/` — coach-facing: dashboard, clients, programs, library
- `src/app/api/` — API routes (program generation)
- `src/components/` — shared UI components organized by feature domain
- `src/lib/actions/` — server actions (one file per domain: ai, auth, program, logging, etc.)
- `src/lib/queries/` — read-only data fetching functions
- `supabase/migrations/` — numbered SQL migrations (currently 001–045)

## Conventions

- Server actions in `src/lib/actions/`, queries in `src/lib/queries/` — keep them separate.
- One migration file per schema change, numbered sequentially (e.g., `046_description.sql`).
- Programs go through draft → published workflow. Never skip draft status.
- All AI-generated content gets logged to `agent_activity_log`.
