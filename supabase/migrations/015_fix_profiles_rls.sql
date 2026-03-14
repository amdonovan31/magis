-- ============================================================
-- Migration 015: Allow coaches to read their clients' profiles
-- The dashboard joins profiles via coach_client_relationships
-- but RLS only allowed users to read their own profile.
-- ============================================================

-- Coaches can read profiles of their linked clients
create policy "Coaches can read client profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.coach_client_relationships
      where coach_id = auth.uid()
        and client_id = profiles.id
    )
  );
