-- ============================================================
-- Migration 009: Client Intake Form
-- Stores PAR-Q health screening and training preferences
-- collected during client onboarding.
-- ============================================================

-- -------------------------------------------------------
-- 1. Create client_intake table
-- -------------------------------------------------------
create table public.client_intake (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.profiles(id) on delete cascade,
  coach_id        uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- PAR-Q health screening (7 standard questions)
  parq_heart_condition       boolean not null default false,
  parq_chest_pain_activity   boolean not null default false,
  parq_chest_pain_rest       boolean not null default false,
  parq_dizziness             boolean not null default false,
  parq_bone_joint            boolean not null default false,
  parq_blood_pressure_meds   boolean not null default false,
  parq_other_reason          boolean not null default false,
  parq_notes                 text,

  -- Goals & preferences
  primary_goal           text,
  secondary_goal         text,
  days_per_week          integer check (days_per_week between 1 and 7),
  session_duration       integer, -- minutes
  training_focus         text[],
  equipment_available    text[],
  injuries_limitations   text,
  additional_notes       text
);

-- Index for fast lookups by client and coach
create index idx_client_intake_client on public.client_intake(client_id);
create index idx_client_intake_coach  on public.client_intake(coach_id);

-- Auto-update updated_at on row change
create or replace function public.handle_client_intake_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger client_intake_updated_at
  before update on public.client_intake
  for each row execute function public.handle_client_intake_updated_at();

-- -------------------------------------------------------
-- 2. Row-Level Security
-- -------------------------------------------------------
alter table public.client_intake enable row level security;

-- Clients can insert their own intake
create policy "Clients can insert own intake"
  on public.client_intake for insert
  with check (auth.uid() = client_id);

-- Clients can view their own intake
create policy "Clients can view own intake"
  on public.client_intake for select
  using (auth.uid() = client_id);

-- Clients can update their own intake
create policy "Clients can update own intake"
  on public.client_intake for update
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

-- Coaches can view intakes for their clients
create policy "Coaches can view client intakes"
  on public.client_intake for select
  using (
    auth.uid() = coach_id
    or exists (
      select 1 from public.programs p
      where p.coach_id = auth.uid()
        and p.client_id = client_intake.client_id
    )
  );

-- Comments
comment on table public.client_intake is 'Stores PAR-Q health screening and training preferences from client onboarding';
comment on column public.client_intake.parq_heart_condition     is 'PAR-Q Q1: Has your doctor ever said you have a heart condition?';
comment on column public.client_intake.parq_chest_pain_activity is 'PAR-Q Q2: Do you feel pain in your chest when doing physical activity?';
comment on column public.client_intake.parq_chest_pain_rest     is 'PAR-Q Q3: Have you had chest pain when not doing physical activity?';
comment on column public.client_intake.parq_dizziness           is 'PAR-Q Q4: Do you lose balance or consciousness?';
comment on column public.client_intake.parq_bone_joint          is 'PAR-Q Q5: Do you have a bone or joint problem that could worsen with exercise?';
comment on column public.client_intake.parq_blood_pressure_meds is 'PAR-Q Q6: Are you currently taking medication for blood pressure or heart condition?';
comment on column public.client_intake.parq_other_reason        is 'PAR-Q Q7: Do you know of any other reason you should not do physical activity?';
comment on column public.client_intake.session_duration         is 'Preferred session length in minutes';
comment on column public.client_intake.training_focus           is 'Array of focus areas: strength, hypertrophy, endurance, mobility, etc.';
comment on column public.client_intake.equipment_available      is 'Array of available equipment: barbell, dumbbells, cables, machines, etc.';
