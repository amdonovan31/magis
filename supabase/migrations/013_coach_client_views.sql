-- ============================================================
-- Migration 013: Coach Client Views
-- Tracks when a coach last viewed a client's profile,
-- used to determine unread note counts on the dashboard.
-- ============================================================

create table public.coach_client_views (
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  client_id   uuid not null references public.profiles(id) on delete cascade,
  viewed_at   timestamptz not null default now(),
  primary key (coach_id, client_id)
);

-- RLS
alter table public.coach_client_views enable row level security;

create policy "Coaches can upsert own views"
  on public.coach_client_views for insert
  with check (auth.uid() = coach_id);

create policy "Coaches can update own views"
  on public.coach_client_views for update
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

create policy "Coaches can read own views"
  on public.coach_client_views for select
  using (auth.uid() = coach_id);
