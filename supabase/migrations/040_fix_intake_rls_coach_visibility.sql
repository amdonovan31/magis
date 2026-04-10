-- Fix: Coach cannot see client intake when:
--   1. The intake row has coach_id = NULL (client submitted before being linked, or was manually created)
--   2. No program exists yet for this coach→client pair
--
-- Root cause: The original RLS SELECT policy only checked coach_id on the intake row
-- or a join through programs. It never checked coach_client_relationships, which is
-- the actual source of truth for the coaching link.
--
-- This replaces the policy with one that also checks coach_client_relationships.

DROP POLICY IF EXISTS "Coaches can view client intakes" ON public.client_intake;

CREATE POLICY "Coaches can view client intakes"
  ON public.client_intake FOR SELECT
  USING (
    auth.uid() = coach_id
    OR EXISTS (
      SELECT 1 FROM public.coach_client_relationships ccr
      WHERE ccr.coach_id = auth.uid()
        AND ccr.client_id = client_intake.client_id
    )
    OR EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.coach_id = auth.uid()
        AND p.client_id = client_intake.client_id
    )
  );
