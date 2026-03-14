-- ============================================================
-- Migration 012: Client Notes
-- Stores notes tied to clients for AI program generation.
-- Notes can be post-session feedback, client messages, or
-- coach observations. Optionally linked to a workout session.
-- ============================================================

create table public.client_notes (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.profiles(id) on delete cascade,
  coach_id        uuid not null references public.profiles(id) on delete cascade,
  content         text not null,
  note_type       text not null check (note_type in (
    'post_session', 'client_message', 'coach_observation'
  )),
  session_log_id  uuid references public.workout_sessions(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- Indexes
create index idx_client_notes_client   on public.client_notes(client_id, created_at desc);
create index idx_client_notes_coach    on public.client_notes(coach_id);
create index idx_client_notes_session  on public.client_notes(session_log_id)
  where session_log_id is not null;

-- RLS
alter table public.client_notes enable row level security;

-- Coaches can insert notes for their own clients
create policy "Coaches can insert notes for own clients"
  on public.client_notes for insert
  with check (
    auth.uid() = coach_id
    and exists (
      select 1 from public.coach_client_relationships
      where coach_id = auth.uid()
        and client_id = client_notes.client_id
    )
  );

-- Clients can insert notes about themselves
create policy "Clients can insert own notes"
  on public.client_notes for insert
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.coach_client_relationships
      where client_id = auth.uid()
        and coach_id = client_notes.coach_id
    )
  );

-- Coaches can read notes for their own clients
create policy "Coaches can read notes for own clients"
  on public.client_notes for select
  using (
    auth.uid() = coach_id
    and exists (
      select 1 from public.coach_client_relationships
      where coach_id = auth.uid()
        and client_id = client_notes.client_id
    )
  );

-- Clients can read their own notes
create policy "Clients can read own notes"
  on public.client_notes for select
  using (auth.uid() = client_id);

-- Comments
comment on table public.client_notes is 'Client notes for AI context: post-session feedback, client messages, and coach observations';
comment on column public.client_notes.session_log_id is 'Links note to a specific workout session when applicable (e.g. post-session feedback)';
comment on column public.client_notes.note_type is 'Type of note: post_session (after workout), client_message (general client note), coach_observation (coach-authored)';
