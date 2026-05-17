Magis
AI-powered personal training platform. Three user roles: Solo/AI, Coached Client, Coach.
Product Spec
The canonical product spec is Magis_Product_Spec_v5.md in the repo root.

Always consult the spec before making decisions about feature scope, user flows, or UI structure.
If a code change contradicts the spec, flag it before proceeding.
When an implementation decision changes the spec, update Magis_Product_Spec_v5.md in the same commit.

Tech Stack

Framework: Next.js 14.2 (App Router), React 18, TypeScript 5
Styling: Tailwind CSS 3.4
Backend: Supabase (Postgres, Auth with RLS, Storage)
Hosting: Vercel
AI: Anthropic Claude API (@anthropic-ai/sdk) — Sonnet for program generation
PWA: Serwist service worker (disabled in dev)
Drag-and-drop: @dnd-kit/core, @dnd-kit/sortable
Icons: lucide-react

Project Structure
src/
├── app/
│   ├── (auth)/          # Login, signup, onboarding, role selection
│   ├── (client)/        # Client-facing: home, workout, calendar, history, profile, free-workout
│   ├── (coach)/         # Coach-facing: dashboard, clients, programs, library, coach-profile
│   ├── api/             # API routes (program generation)
│   ├── invite/          # Coach invitation flow
│   └── fonts/           # Font files
├── components/          # Organized by feature domain (see below)
├── lib/
│   ├── actions/         # Server actions (writes/mutations)
│   ├── queries/         # Read-only data fetching
│   ├── supabase/        # Supabase client creation (server.ts, client.ts)
│   └── utils/           # Utilities (cn.ts, date.ts, logger.ts, program-lifecycle.ts)
├── types/
│   ├── app.types.ts     # App-level composite types, constants, enums
│   └── database.types.ts # Auto-generated Supabase types (do not edit manually)
supabase/
└── migrations/          # Numbered SQL migrations (currently 001–056)
Architecture Patterns
Server vs Client Components

Pages (page.tsx) are server components by default. They fetch data and pass it as props to client components.
Client components have "use client" at the top and handle interactivity, state, and effects.
Keep data fetching in server components or server actions — never call Supabase directly from client components.

Data Layer

Queries (src/lib/queries/*.queries.ts): Read-only functions that return data. Used in server components and server actions. Each file covers one domain (session, calendar, program, exercise, etc.).
Actions (src/lib/actions/*.actions.ts): Server actions for writes/mutations. Each file covers one domain. Actions call revalidatePath() or redirect() as needed.
Pattern: Queries and actions each create their own Supabase client via createClient() from @/lib/supabase/server.

Supabase Clients

createClient() from src/lib/supabase/server.ts — cookie-based, used in server components and server actions. This is the standard client for 99% of cases.
createAdminClient() from the same file — service role access, only for privileged operations (e.g., inviting users). Never expose to client.
createClient() from src/lib/supabase/client.ts — browser-side client, used only in "use client" components that need real-time or direct auth operations.

Auth & Routing

Middleware (src/middleware.ts) handles auth redirects and role-based route protection.
Roles: coach, client, solo — stored in user.app_metadata.role.
Coach routes: /dashboard, /clients, /programs, /coach-profile.
Client/Solo routes: /home, /workout, /free-workout, /calendar, /history, /profile, /my-library.
Auth routes: /login, /signup, /onboarding, /choose-role, /invite, /forgot-password, /reset-password.
Client layout includes BottomNav and PageWrapper. Coach layout has its own nav.

State Management

No global state library — use React useState/useReducer for local state.
router.refresh() does NOT re-initialize useState from new props. If you call a server action + router.refresh(), you must also do an optimistic setState update locally.
React 18 Strict Mode double-fires effects in development. Use useRef guards for one-time effects like API calls.

UI & Styling
Design System
The app uses a nature-inspired dark-on-cream color palette:
TokenValueUsagebg / background#EEECE6 (warm cream)Page backgroundsprimary#2C4A2E (forest green)Text, headings, bordersaccent#1B2E4B (navy blue)Buttons, active states, CTAsaccent-light#FAF9F6 (off-white)Text on accent backgroundsmuted#6B7B5E (sage)Secondary text, placeholderssurface#FFFFFF (white)Cards, input backgrounds
primary also has a full shade scale (50–900) for opacity variants.
Typography

font-heading — serif font for headings
font-sans / font-body — system sans-serif for body text
Use Tailwind classes: font-heading text-2xl font-bold text-primary for page titles, text-sm text-muted for secondary text, text-xs uppercase tracking-widest text-muted for labels.

UI Primitives
Reusable components in src/components/ui/:

Button — supports variant (primary, secondary, accent, danger), size (sm, md, lg), fullWidth
Card — container with padding prop (sm, md, lg)
Badge — status indicator with variant (success, warning, danger)
Modal — overlay dialog with isOpen, onClose, title
Input — styled text input
Spinner — loading spinner
Toast — notification toast

Always use these primitives rather than building one-off styled elements. If a new primitive is needed, add it to src/components/ui/.
Component Organization
Components are organized by feature domain under src/components/:
auth, calendar, coach, dev, disclaimer, error, exercises, feedback, intake, layout, library, measurements, notes, pr, streaks, ui, volume, workout
Place new components in the appropriate domain folder.
Styling Rules

Use Tailwind utility classes exclusively — no CSS modules or styled-components.
Use cn() from @/lib/utils/cn (wraps clsx + tailwind-merge) for conditional classes.
Mobile-first design — this is a PWA primarily used on phones.
Use safe-area-inset-bottom spacing (pb-safe) for bottom-nav clearance.
Common pattern for rounded cards: rounded-xl or rounded-2xl.
Active/tap feedback: active:scale-[0.98] transition-transform.

Database Conventions
Migrations

One migration file per schema change, numbered sequentially: 065_description.sql.
Current highest migration: 064_coach_events_new_types.sql.
After adding a migration, regenerate types: npx supabase gen types typescript --local > src/types/database.types.ts (or --linked if no Docker).
Never edit database.types.ts manually except as a temporary stub when the regen pipeline is unavailable; overwrite with a real regen at the next opportunity.

Key Tables

profiles — user profiles, extends Supabase auth (role, preferred_unit, onboarding_complete, timezone)
programs — coach-created training programs (status: draft → scheduled → published → archived; starts_on and ends_on date-typed NOT NULL; generation_instructions = per-generation coach free-text; intake_snapshot = frozen client_intake JSONB at generation time, forward-looking)
workout_templates — days within a program (title, week_number, day_number, type: strength/cardio)
workout_template_exercises — exercises within a template (position, sets, reps, weight, rest, notes, alternate_exercise_ids)
scheduled_workouts — generated on publish, one row per client workout date (status: scheduled/completed/skipped/rescheduled). Mutations to this table fire a trigger that recomputes programs.ends_on from MAX(scheduled_date).
workout_sessions — active/completed workout instances
set_logs — individual set records (reps, weight, per session)
cardio_logs — cardio session records (duration, distance, HR, RPE, per session)
session_extra_work — bonus sets logged during template workouts
exercises — exercise library (name, muscle_group, equipment, instructions)
coach_client_relationships — links coaches to clients
coach_events — shared coach-notification event log behind the coach dashboard; the future bell icon will read the same table. Seven event types split into two read-side categories: the Activity feed (passive log: workout_completed, client_joined, client_left, client_intake_completed) and the Attention page (action-needed: end_of_program_alert, client_inactive_alert). client_comment is written but rendered on neither surface — it stays for the bell, read via the workout summary view. workout_completed / client_comment / client_joined / client_left / client_intake_completed are fired by DB triggers; end_of_program_alert + client_inactive_alert are materialized lazily on dashboard + Attention-page load (materialize_end_of_program_alerts / materialize_client_inactive_alerts RPCs). Self-coached relationships (coach_id = client_id) fire no new event types.
agent_activity_log — all AI-generated content gets logged here

Row Level Security
All tables use RLS policies. Queries run as the authenticated user — never bypass RLS unless using createAdminClient() for a specific reason.

Program Lifecycle (date-based)

Coach creates program → status: draft, is_active: true, starts_on placeholder = today (overwritten at publish).
Solo users get the same flow but generateSoloProgram (src/lib/actions/ai.actions.ts) auto-publishes immediately so they have a live program on /home.
Coach publishes via publishProgram (src/lib/actions/program.actions.ts), which is a thin wrapper around the publish_program Postgres RPC. The RPC atomically: archives prior published programs (status='archived', is_active=false), replaces this program's scheduled_workouts (computed in TS by buildScheduledWorkoutRows and passed in as JSONB), then flips status='published'. The trigger sets ends_on inside the same transaction.
Editing a published program still uses the apply_program_edits RPC for atomic batched changes; date changes there fire the same ends_on trigger.
The lifecycle status is date-based: use getProgramLifecycle() from src/lib/utils/program-lifecycle.ts (states: not_started | active | ended | draft | archived) instead of hand-rolling status comparisons.
A program does NOT auto-archive when ends_on passes — it stays status='published' until a new program is published. "Ended" is a display state derived from today > ends_on, not a stored status.
Programs can also be pending_review (whitelisted, unused) or archived.

End-of-program / next-program flow: a coach generates a follow-up block in "progression mode" (Generate Next Program → /clients/[id]/generate/next), which feeds Claude the prior block's structure, logged performance, adherence, and client notes. The new program is scheduled (status='scheduled') with a future starts_on rather than published immediately. promote_scheduled_programs RPC lazily flips scheduled → published when starts_on arrives in the client's timezone — called from getCoachDashboard and client home load (no cron). Cancelling a scheduled program reverts it to draft.

Timezone & "today" computation

profiles.timezone is captured one-shot from Intl.DateTimeFormat().resolvedOptions().timeZone on first authenticated load by src/components/auth/TimezoneCapture.tsx. The capture component is mounted in both client and coach layouts and only writes when timezone is null — never auto-overwrites.
Compute today's date server-side: const todayISO = getTodayISO(profile.timezone) and pass todayISO down as a prop. Never call getTodayISO inside client components — it would cause a hydration mismatch around midnight in the user's TZ.
getTodayISO falls back to America/New_York when timezone is null/empty.

Workout Types

Template strength workouts: Launched from scheduled_workouts, use set_logs with template_exercise_id
Template cardio workouts: Same launch path, workout_templates.type = 'cardio', use cardio_logs
Free strength workouts: User-initiated, workout_template_id = null, use set_logs with exercise_id
Free cardio workouts: (being added) free_workout_type = 'cardio', use cardio_logs

Common Gotchas

useState(prop) does NOT re-initialize on router.refresh(). Always pair server action calls with optimistic local state updates.
React 18 Strict Mode fires effects twice in dev. Guard one-time effects with useRef.
programs.is_active can be true on multiple programs (including stale drafts). When looking up the active program, prefer status = 'published' and filter by is_active = true.
Date calculations: always construct dates with "T00:00:00" suffix to avoid timezone-induced off-by-one errors (e.g., new Date(dateStr + "T00:00:00")).
The alternate_exercise_ids field on workout_template_exercises is a JSONB array of UUIDs. It needs post-fetch resolution via getExercisesByIds() to get full exercise objects.
Week count for programs: use distinct week_number values from workout_templates, not date arithmetic on scheduled_workouts.
"Missed" workouts are not a stored status — they're computed at display time from scheduled_date < todayISO && status !== 'completed'. The scheduled_workouts CHECK only allows scheduled / completed / skipped / rescheduled.
RPCs that gate on auth.uid() (publish_program, apply_program_edits) cannot be tested with raw psql — auth.uid() returns NULL outside an authenticated session. Test through the app UI or set up a test JWT.

Development
bashnpm run dev     # Start dev server
npm run build   # Production build
npm run lint    # ESLint
Environment variables needed: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY.