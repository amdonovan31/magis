-- ============================================================
-- Migration 017: Allow coaches to update their clients' profiles
-- Needed for sendIntakeRequest to set intake_requested = true
-- ============================================================

create policy "Coaches can update client profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.coach_client_relationships
      where coach_id = auth.uid()
        and client_id = profiles.id
    )
  );
