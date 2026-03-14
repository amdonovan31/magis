-- ============================================================
-- Migration 014: Add missing RLS policies for coach_client_relationships
-- Coaches need to read their own relationships for the dashboard query.
-- ============================================================

-- Coaches can read their own relationships
create policy "Coaches can read own relationships"
  on public.coach_client_relationships for select
  using (coach_id = auth.uid());

-- Clients can read their own relationships
create policy "Clients can read own relationships"
  on public.coach_client_relationships for select
  using (client_id = auth.uid());
