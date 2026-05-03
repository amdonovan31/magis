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
│   └── utils/           # Utilities (cn.ts, date.ts, logger.ts)
├── types/
│   ├── app.types.ts     # App-level composite types, constants, enums
│   └── database.types.ts # Auto-generated Supabase types (do not edit manually)
supabase/
└── migrations/          # Numbered SQL migrations (currently 001–050)
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

One migration file per schema change, numbered sequentially: 051_description.sql.
Current highest migration: 050_fix_apply_program_edits_date_conflict.sql.
After adding a migration, regenerate types: npx supabase gen types typescript --local > src/types/database.types.ts.
Never edit database.types.ts manually.

Key Tables

profiles — user profiles, extends Supabase auth (role, preferred_unit, onboarding_complete)
programs — coach-created training programs (status: draft → published → archived)
workout_templates — days within a program (title, week_number, day_number, type: strength/cardio)
workout_template_exercises — exercises within a template (position, sets, reps, weight, rest, notes, alternate_exercise_ids)
scheduled_workouts — generated on publish, one row per client workout date (status: scheduled/completed/missed/skipped)
workout_sessions — active/completed workout instances
set_logs — individual set records (reps, weight, per session)
cardio_logs — cardio session records (duration, distance, HR, RPE, per session)
session_extra_work — bonus sets logged during template workouts
exercises — exercise library (name, muscle_group, equipment, instructions)
coach_client_relationships — links coaches to clients
agent_activity_log — all AI-generated content gets logged here

Row Level Security
All tables use RLS policies. Queries run as the authenticated user — never bypass RLS unless using createAdminClient() for a specific reason.
Program Lifecycle

Coach creates program → status: draft, is_active: true
Coach publishes → status: published, generates scheduled_workouts from templates
Publishing archives other published programs for the same client
Editing a published program uses the apply_program_edits RPC for atomic batched changes
Programs can also be pending_review or archived

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

Development
bashnpm run dev     # Start dev server
npm run build   # Production build
npm run lint    # ESLint
Environment variables needed: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY.