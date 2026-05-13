-- =============================================================================
-- PR 1: promote_scheduled_programs RPC — fires lazily from coach dashboard load
-- and client home load (no cron in v1). Finds any programs in 'scheduled' status
-- whose starts_on has arrived in the client's timezone, archives the prior
-- published program for that client, and flips the scheduled program to
-- 'published' — all in the same statement per row.
--
-- Idempotent. Returns array of promoted program IDs (typically empty).
--
-- Auth model: SECURITY DEFINER so the function can update programs across
-- ownership boundaries (a coach loading their dashboard may need to promote
-- across multiple clients). Defense in depth: the FOR loop's WHERE clause
-- still enforces (coach_id = auth.uid() OR client_id = auth.uid()) so a
-- caller can't promote programs they don't own.
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
    SELECT p.id AS program_id, p.client_id, p.starts_on, prof.timezone
      FROM public.programs p
      LEFT JOIN public.profiles prof ON prof.id = p.client_id
     WHERE p.status = 'scheduled'
       AND (p_client_ids IS NULL OR p.client_id = ANY(p_client_ids))
       -- Defense in depth: even though the TS wrapper scopes by client_ids,
       -- enforce ownership inline so a misuse can't promote programs the
       -- caller doesn't own.
       AND (p.coach_id = auth.uid() OR p.client_id = auth.uid())
  LOOP
    v_today_in_client_tz := (now() AT TIME ZONE COALESCE(r.timezone, 'America/New_York'))::date;

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
  'Promote any programs in scheduled status whose starts_on has arrived in the client''s timezone. Archives the prior published program for that client in the same statement. Idempotent. Returns array of promoted program IDs.';
