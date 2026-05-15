-- =============================================================================
-- PR 1.1: fix promote_scheduled_programs timezone fallback.
--
-- Migration 059 fell back to the literal 'America/New_York' when a client had
-- no stored timezone. Spec wants the fallback chain to be:
--   client timezone → coach timezone → 'America/New_York'.
--
-- Only the FOR loop's join + COALESCE change. Ownership filter, archive +
-- flip logic, and idempotency are unchanged from migration 059.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.promote_scheduled_programs(p_client_ids uuid[] DEFAULT NULL)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_promoted uuid[] := ARRAY[]::uuid[];
  r RECORD;
  v_today_in_client_tz date;
BEGIN
  FOR r IN
    SELECT p.id AS program_id,
           p.client_id,
           p.starts_on,
           COALESCE(client_prof.timezone, coach_prof.timezone, 'America/New_York') AS tz
      FROM public.programs p
      LEFT JOIN public.profiles client_prof ON client_prof.id = p.client_id
      LEFT JOIN public.profiles coach_prof  ON coach_prof.id  = p.coach_id
     WHERE p.status = 'scheduled'
       AND (p_client_ids IS NULL OR p.client_id = ANY(p_client_ids))
       -- Defense in depth: even though the TS wrapper scopes by client_ids,
       -- enforce ownership inline so a misuse can't promote programs the
       -- caller doesn't own.
       AND (p.coach_id = auth.uid() OR p.client_id = auth.uid())
  LOOP
    -- tz is never NULL — COALESCE guarantees the literal fallback.
    v_today_in_client_tz := (now() AT TIME ZONE r.tz)::date;

    IF r.starts_on <= v_today_in_client_tz THEN
      -- Archive any currently-published program for this client
      UPDATE public.programs
         SET status = 'archived', is_active = false
       WHERE client_id = r.client_id
         AND status = 'published'
         AND id != r.program_id;

      -- Flip the scheduled program to published. ends_on already set by trigger.
      UPDATE public.programs
         SET status = 'published'
       WHERE id = r.program_id;

      v_promoted := array_append(v_promoted, r.program_id);
    END IF;
  END LOOP;

  RETURN v_promoted;
END $$;

COMMENT ON FUNCTION public.promote_scheduled_programs(uuid[]) IS
  'Promote any programs in scheduled status whose starts_on has arrived in the client''s timezone (falling back to the coach''s timezone, then America/New_York). Archives the prior published program for that client in the same statement. Idempotent. Returns array of promoted program IDs.';
