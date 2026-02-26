-- ============================================================
-- Migration 002: Stage 2 — AI & Progress Tables
-- Personal records, body measurements, and AI agent activity log.
-- ============================================================

-- -------------------------------------------------------
-- 1. personal_records
--    Auto-detected PRs per exercise per user.
--    Types: weight (heaviest single), volume (most total volume),
--    reps (most reps at a given weight), estimated_1rm.
-- -------------------------------------------------------
create table public.personal_records (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  exercise_id     uuid not null references public.exercises(id) on delete cascade,
  pr_type         text not null check (pr_type in ('weight', 'volume', 'reps', 'estimated_1rm')),
  value           numeric not null,
  unit            text not null default 'kg',
  reps            int,                       -- reps at which this PR was set (for weight PRs)
  set_log_id      uuid references public.set_logs(id) on delete set null,
  session_id      uuid references public.workout_sessions(id) on delete set null,
  achieved_at     timestamptz not null default now(),
  previous_value  numeric,                   -- what they beat — for celebration UI
  created_at      timestamptz not null default now()
);

create index personal_records_user_exercise on public.personal_records (user_id, exercise_id, pr_type);

-- -------------------------------------------------------
-- 2. body_measurements
--    Log and track weight, body fat %, and custom metrics.
--    Supports GDPR export (personal health data).
-- -------------------------------------------------------
create table public.body_measurements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  measured_at     timestamptz not null default now(),
  metric_type     text not null,             -- 'weight', 'body_fat', 'chest', 'waist', 'hips', etc.
  value           numeric not null,
  unit            text not null default 'kg', -- 'kg', 'lbs', '%', 'cm', 'in'
  notes           text,
  created_at      timestamptz not null default now()
);

create index body_measurements_user_date on public.body_measurements (user_id, measured_at desc);

-- -------------------------------------------------------
-- 3. agent_activity_log
--    Every AI substitution or session change, surfaced in
--    coach dashboard. Creates the feedback loop described
--    in the spec: coach sees patterns, refines programming.
-- -------------------------------------------------------
create table public.agent_activity_log (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.profiles(id) on delete cascade,
  coach_id        uuid references public.profiles(id) on delete set null,
  session_id      uuid references public.workout_sessions(id) on delete set null,
  action_type     text not null check (action_type in (
    'exercise_swap', 'session_shorten', 'injury_route',
    'load_adjustment', 'rep_adjustment', 'rest_adjustment',
    'program_generation', 'check_in_draft', 'other'
  )),
  description     text not null,             -- human-readable summary
  details         jsonb,                     -- structured data: original exercise, replacement, reason, etc.
  ai_model        text,                      -- 'sonnet', 'haiku' — for cost tracking
  created_at      timestamptz not null default now()
);

create index agent_activity_log_client on public.agent_activity_log (client_id, created_at desc);
create index agent_activity_log_coach on public.agent_activity_log (coach_id, created_at desc);

-- -------------------------------------------------------
-- RLS for new tables
-- -------------------------------------------------------

-- personal_records
alter table public.personal_records enable row level security;

create policy "Users can view their own PRs"
  on public.personal_records for select
  using (user_id = auth.uid());

create policy "Users can manage their own PRs"
  on public.personal_records for all
  using (user_id = auth.uid());

create policy "Coaches can view their clients PRs"
  on public.personal_records for select
  using (
    exists (
      select 1 from public.coach_client_relationships
      where coach_id = auth.uid() and client_id = personal_records.user_id
    )
  );

-- body_measurements
alter table public.body_measurements enable row level security;

create policy "Users can manage their own measurements"
  on public.body_measurements for all
  using (user_id = auth.uid());

create policy "Coaches can view their clients measurements"
  on public.body_measurements for select
  using (
    exists (
      select 1 from public.coach_client_relationships
      where coach_id = auth.uid() and client_id = body_measurements.user_id
    )
  );

-- agent_activity_log
alter table public.agent_activity_log enable row level security;

create policy "Clients can view their own agent activity"
  on public.agent_activity_log for select
  using (client_id = auth.uid());

create policy "Coaches can view their clients agent activity"
  on public.agent_activity_log for select
  using (
    coach_id = auth.uid()
    or exists (
      select 1 from public.coach_client_relationships
      where coach_id = auth.uid() and client_id = agent_activity_log.client_id
    )
  );

create policy "System can insert agent activity"
  on public.agent_activity_log for insert
  to authenticated
  with check (true);
