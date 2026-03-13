-- ============================================================
-- Migration 010: Scheduled Workouts
-- Individual workout instances with a mutable scheduled_date,
-- designed for AI-agent rescheduling support.
-- ============================================================

create table public.scheduled_workouts (
  id                   uuid primary key default gen_random_uuid(),
  client_id            uuid not null references public.profiles(id) on delete cascade,
  program_id           uuid not null references public.programs(id) on delete cascade,
  workout_template_id  uuid not null references public.workout_templates(id) on delete cascade,
  scheduled_date       date not null,
  status               text not null default 'scheduled'
                       check (status in ('scheduled', 'completed', 'skipped', 'rescheduled')),
  session_id           uuid references public.workout_sessions(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Indexes for calendar queries
create index idx_scheduled_workouts_client_date
  on public.scheduled_workouts(client_id, scheduled_date);

create index idx_scheduled_workouts_template
  on public.scheduled_workouts(workout_template_id);

-- Auto-update updated_at
create or replace function public.handle_scheduled_workouts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger scheduled_workouts_updated_at
  before update on public.scheduled_workouts
  for each row execute function public.handle_scheduled_workouts_updated_at();

-- RLS
alter table public.scheduled_workouts enable row level security;

-- Clients can view their own scheduled workouts
create policy "Clients can view own scheduled workouts"
  on public.scheduled_workouts for select
  using (auth.uid() = client_id);

-- Clients can update their own (e.g. mark completed)
create policy "Clients can update own scheduled workouts"
  on public.scheduled_workouts for update
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

-- Coaches can view scheduled workouts for their clients
create policy "Coaches can view client scheduled workouts"
  on public.scheduled_workouts for select
  using (
    exists (
      select 1 from public.programs p
      where p.id = scheduled_workouts.program_id
        and p.coach_id = auth.uid()
    )
  );

-- Coaches can insert scheduled workouts for their clients
create policy "Coaches can insert scheduled workouts"
  on public.scheduled_workouts for insert
  with check (
    exists (
      select 1 from public.programs p
      where p.id = program_id
        and p.coach_id = auth.uid()
    )
  );

-- Coaches can update scheduled workouts for their clients
create policy "Coaches can update client scheduled workouts"
  on public.scheduled_workouts for update
  using (
    exists (
      select 1 from public.programs p
      where p.id = scheduled_workouts.program_id
        and p.coach_id = auth.uid()
    )
  );

-- Service role / AI agent can insert for any client
create policy "Service role can insert scheduled workouts"
  on public.scheduled_workouts for insert
  with check (auth.role() = 'service_role');

create policy "Service role can update scheduled workouts"
  on public.scheduled_workouts for update
  using (auth.role() = 'service_role');

-- Comments
comment on table public.scheduled_workouts is 'Individual workout instances with mutable scheduled_date for calendar display and AI rescheduling';
comment on column public.scheduled_workouts.scheduled_date is 'The date this workout is scheduled for. Can be updated by AI agent or coach to reschedule.';
comment on column public.scheduled_workouts.status is 'scheduled | completed | skipped | rescheduled';
comment on column public.scheduled_workouts.session_id is 'Links to the actual workout_session once the client starts the workout';
