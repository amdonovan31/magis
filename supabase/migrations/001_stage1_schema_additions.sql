-- ============================================================
-- Migration 001: Stage 1 Schema Additions
-- Adds missing columns to existing tables without rebuilding them.
-- Run after schema.sql in your Supabase SQL editor.
-- ============================================================

-- -------------------------------------------------------
-- 1. profiles: allow 'solo' role alongside coach/client
-- -------------------------------------------------------
alter table public.profiles
  drop constraint profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('coach', 'client', 'solo'));

-- -------------------------------------------------------
-- 2. exercises: structured equipment + secondary muscles
--    (supplements the free-text instructions field)
-- -------------------------------------------------------
alter table public.exercises
  add column if not exists equipment text,
  add column if not exists secondary_muscles text[];

comment on column public.exercises.equipment is 'Primary equipment type: Barbell, Dumbbell, Cable, Machine, Bodyweight, Kettlebell, Band, Smith Machine, etc.';
comment on column public.exercises.secondary_muscles is 'Array of secondary muscle groups worked';

-- -------------------------------------------------------
-- 3. set_logs: sync_status for offline-first architecture
--    Local-first writes; syncs to Supabase on reconnect.
-- -------------------------------------------------------
alter table public.set_logs
  add column if not exists sync_status text not null default 'synced'
    check (sync_status in ('pending', 'synced', 'conflict'));

comment on column public.set_logs.sync_status is 'Offline sync state: pending (local only), synced (confirmed on server), conflict (needs resolution)';

-- -------------------------------------------------------
-- 4. workout_sessions: duration tracking for summaries
-- -------------------------------------------------------
alter table public.workout_sessions
  add column if not exists duration_seconds int;

comment on column public.workout_sessions.duration_seconds is 'Total session duration in seconds, calculated on completion';
