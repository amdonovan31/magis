-- ============================================================
-- Magis — Personal Training App: Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- profiles: extends auth.users via trigger
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('coach', 'client')),
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- coach_client_relationships
create table public.coach_client_relationships (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  client_id  uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id)  -- one coach per client in Stage 1
);

-- exercises
create table public.exercises (
  id            uuid primary key default gen_random_uuid(),
  created_by    uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  muscle_group  text,
  instructions  text,
  video_url     text,
  is_archived   boolean not null default false,
  created_at    timestamptz not null default now()
);

-- GIN index on exercise name for full-text search
create index exercises_name_gin on public.exercises using gin (to_tsvector('english', name));

-- programs
create table public.programs (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  client_id   uuid references public.profiles(id) on delete set null,
  title       text not null,
  description text,
  is_active   boolean not null default true,
  starts_on   date,
  created_at  timestamptz not null default now()
);

-- workout_templates (a "day" within a program)
create table public.workout_templates (
  id                uuid primary key default gen_random_uuid(),
  program_id        uuid not null references public.programs(id) on delete cascade,
  title             text not null,
  day_number        int,
  notes             text,
  scheduled_days    int[],    -- [0..6] days of week (0=Sun, 1=Mon, ..., 6=Sat)
  scheduled_dates   date[],   -- specific dates (overrides scheduled_days)
  created_at        timestamptz not null default now()
);

-- workout_template_exercises
create table public.workout_template_exercises (
  id                    uuid primary key default gen_random_uuid(),
  workout_template_id   uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id           uuid not null references public.exercises(id) on delete restrict,
  position              int not null default 0,
  prescribed_sets       int,
  prescribed_reps       text,   -- supports "8-12", "AMRAP", etc.
  prescribed_weight     text,   -- supports "Bodyweight", "60kg", etc.
  rest_seconds          int,
  notes                 text
);

-- workout_sessions (a client actually performing a workout)
create table public.workout_sessions (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references public.profiles(id) on delete cascade,
  workout_template_id   uuid references public.workout_templates(id) on delete set null,
  program_id            uuid references public.programs(id) on delete set null,
  status                text not null default 'in_progress'
                          check (status in ('in_progress', 'completed', 'skipped')),
  started_at            timestamptz not null default now(),
  completed_at          timestamptz,
  notes                 text
);

-- set_logs (real-time per-set data)
create table public.set_logs (
  id                      uuid primary key default gen_random_uuid(),
  session_id              uuid not null references public.workout_sessions(id) on delete cascade,
  template_exercise_id    uuid references public.workout_template_exercises(id) on delete set null,
  set_number              int not null,
  reps_completed          int,
  weight_used             text,
  rpe                     int check (rpe >= 1 and rpe <= 10),
  is_completed            boolean not null default false,
  logged_at               timestamptz not null default now()
);

-- client_workout_schedules (client overrides for coach schedule)
create table public.client_workout_schedules (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references public.profiles(id) on delete cascade,
  workout_template_id   uuid not null references public.workout_templates(id) on delete cascade,
  scheduled_days        int[],    -- client's preferred days of week
  scheduled_dates       date[],   -- client's specific dates
  updated_at            timestamptz not null default now(),
  unique (client_id, workout_template_id)
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Updated_at trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger client_workout_schedules_updated_at
  before update on public.client_workout_schedules
  for each row execute function public.set_updated_at();

-- Mirror role to raw_app_meta_data on profile insert so role is in JWT
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  -- Insert profile from user metadata
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );

  -- Mirror role to app_metadata so it's available in JWT without a DB hit
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('role', coalesce(new.raw_user_meta_data->>'role', 'client'))
  where id = new.id;

  -- If client was invited by a coach, create the relationship
  if new.raw_user_meta_data->>'coach_id' is not null then
    insert into public.coach_client_relationships (coach_id, client_id)
    values (
      (new.raw_user_meta_data->>'coach_id')::uuid,
      new.id
    )
    on conflict (client_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.coach_client_relationships enable row level security;
alter table public.exercises enable row level security;
alter table public.programs enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.set_logs enable row level security;
alter table public.client_workout_schedules enable row level security;

-- Helper function to get current user role from JWT (no DB hit)
create or replace function public.get_my_role()
returns text language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

-- profiles RLS
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Coaches can view their clients profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.coach_client_relationships
      where coach_id = auth.uid() and client_id = id
    )
  );

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- coach_client_relationships RLS
create policy "Coaches can view their relationships"
  on public.coach_client_relationships for select
  using (coach_id = auth.uid());

create policy "Clients can view their own relationship"
  on public.coach_client_relationships for select
  using (client_id = auth.uid());

create policy "Coaches can manage relationships"
  on public.coach_client_relationships for all
  using (coach_id = auth.uid());

-- exercises RLS
create policy "Anyone authenticated can view non-archived exercises"
  on public.exercises for select
  to authenticated
  using (is_archived = false);

create policy "Coaches can manage their own exercises"
  on public.exercises for all
  using (
    created_by = auth.uid() and public.get_my_role() = 'coach'
  );

-- programs RLS
create policy "Coaches can manage their programs"
  on public.programs for all
  using (coach_id = auth.uid() and public.get_my_role() = 'coach');

create policy "Clients can view their assigned programs"
  on public.programs for select
  using (client_id = auth.uid());

-- workout_templates RLS
create policy "Coaches can manage workout templates in their programs"
  on public.workout_templates for all
  using (
    exists (
      select 1 from public.programs
      where id = program_id and coach_id = auth.uid()
    )
    and public.get_my_role() = 'coach'
  );

create policy "Clients can view workout templates in their programs"
  on public.workout_templates for select
  using (
    exists (
      select 1 from public.programs
      where id = program_id and client_id = auth.uid()
    )
  );

-- workout_template_exercises RLS
create policy "Coaches can manage template exercises in their programs"
  on public.workout_template_exercises for all
  using (
    exists (
      select 1 from public.workout_templates wt
      join public.programs p on p.id = wt.program_id
      where wt.id = workout_template_id and p.coach_id = auth.uid()
    )
    and public.get_my_role() = 'coach'
  );

create policy "Clients can view template exercises in their programs"
  on public.workout_template_exercises for select
  using (
    exists (
      select 1 from public.workout_templates wt
      join public.programs p on p.id = wt.program_id
      where wt.id = workout_template_id and p.client_id = auth.uid()
    )
  );

-- workout_sessions RLS
create policy "Clients can manage their own sessions"
  on public.workout_sessions for all
  using (client_id = auth.uid());

create policy "Coaches can view their clients sessions"
  on public.workout_sessions for select
  using (
    exists (
      select 1 from public.coach_client_relationships
      where coach_id = auth.uid() and client_id = workout_sessions.client_id
    )
  );

-- set_logs RLS
create policy "Clients can manage their own set logs"
  on public.set_logs for all
  using (
    exists (
      select 1 from public.workout_sessions
      where id = session_id and client_id = auth.uid()
    )
  );

create policy "Coaches can view their clients set logs"
  on public.set_logs for select
  using (
    exists (
      select 1 from public.workout_sessions ws
      join public.coach_client_relationships ccr on ccr.client_id = ws.client_id
      where ws.id = session_id and ccr.coach_id = auth.uid()
    )
  );

-- client_workout_schedules RLS
create policy "Clients can manage their own schedules"
  on public.client_workout_schedules for all
  using (client_id = auth.uid());

create policy "Coaches can view their clients schedules"
  on public.client_workout_schedules for select
  using (
    exists (
      select 1 from public.coach_client_relationships
      where coach_id = auth.uid() and client_id = client_workout_schedules.client_id
    )
  );
