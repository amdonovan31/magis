-- ============================================================
-- Migration 011: Coach Guidelines
-- Stores per-client coaching directives that feed into
-- AI program generation alongside the client_intake data.
-- ============================================================

create table public.coach_guidelines (
  id                     uuid primary key default gen_random_uuid(),
  client_id              uuid not null references public.profiles(id) on delete cascade,
  coach_id               uuid not null references public.profiles(id) on delete cascade,
  program_length_weeks   integer not null,
  intensity_level        text not null,
  periodization_style    text not null,
  exercises_to_include   uuid[],
  exercises_to_avoid     uuid[],
  additional_notes       text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Indexes
create index idx_coach_guidelines_client on public.coach_guidelines(client_id);
create index idx_coach_guidelines_coach  on public.coach_guidelines(coach_id);

-- Auto-update updated_at
create or replace function public.handle_coach_guidelines_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger coach_guidelines_updated_at
  before update on public.coach_guidelines
  for each row execute function public.handle_coach_guidelines_updated_at();

-- RLS
alter table public.coach_guidelines enable row level security;

create policy "Coaches can insert own guidelines"
  on public.coach_guidelines for insert
  with check (auth.uid() = coach_id);

create policy "Coaches can view own guidelines"
  on public.coach_guidelines for select
  using (auth.uid() = coach_id);

create policy "Coaches can update own guidelines"
  on public.coach_guidelines for update
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

-- Comments
comment on table public.coach_guidelines is 'Per-client coaching directives used as input for AI program generation';
comment on column public.coach_guidelines.exercises_to_include is 'Array of exercise UUIDs the coach wants included in the generated program';
comment on column public.coach_guidelines.exercises_to_avoid is 'Array of exercise UUIDs to exclude from the generated program';
