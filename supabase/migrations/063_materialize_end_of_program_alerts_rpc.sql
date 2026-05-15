-- =============================================================================
-- PR 2: materialize_end_of_program_alerts — lazy materialization of
-- end_of_program_alert rows into coach_events.
--
-- end-of-program is DERIVED state (a program crossing into its final week),
-- not a row mutation, so it has no trigger. This RPC is called on coach
-- Activity-tab load (via maybeMaterializeEndOfProgramAlerts), mirroring PR 1's
-- maybePromoteScheduled. Idempotent: the partial unique index on coach_events
-- (event_type, source_id) WHERE cleared_at IS NULL means a program with an
-- open alert is skipped; a program whose prior alert was cleared (next program
-- scheduled then cancelled) gets a fresh one.
--
-- Window matches PR 1's dashboard "Next Program" badge: ends_on within 7 days
-- (or already past) AND no scheduled successor for that client.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.materialize_end_of_program_alerts(p_client_ids uuid[] DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_inserted integer := 0;
  r RECORD;
  v_today_in_client_tz date;
BEGIN
  FOR r IN
    SELECT p.id AS program_id,
           p.coach_id,
           p.client_id,
           p.title,
           p.ends_on,
           COALESCE(client_prof.timezone, coach_prof.timezone, 'America/New_York') AS tz
      FROM public.programs p
      LEFT JOIN public.profiles client_prof ON client_prof.id = p.client_id
      LEFT JOIN public.profiles coach_prof  ON coach_prof.id  = p.coach_id
     WHERE p.status = 'published'
       AND p.client_id IS NOT NULL
       AND (p_client_ids IS NULL OR p.client_id = ANY(p_client_ids))
       -- Defense in depth: only the caller's own programs.
       AND (p.coach_id = auth.uid() OR p.client_id = auth.uid())
       -- No scheduled successor already queued for this client.
       AND NOT EXISTS (
         SELECT 1 FROM public.programs s
          WHERE s.client_id = p.client_id AND s.status = 'scheduled'
       )
  LOOP
    v_today_in_client_tz := (now() AT TIME ZONE r.tz)::date;

    IF r.ends_on <= v_today_in_client_tz + 7 THEN
      INSERT INTO public.coach_events
        (coach_id, client_id, event_type, source_id, occurred_at, payload)
      VALUES
        (r.coach_id, r.client_id, 'end_of_program_alert', r.program_id, now(),
         jsonb_build_object('program_title', r.title, 'ends_on', r.ends_on))
      ON CONFLICT (event_type, source_id) WHERE cleared_at IS NULL DO NOTHING;

      IF FOUND THEN
        v_inserted := v_inserted + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN v_inserted;
END $$;

COMMENT ON FUNCTION public.materialize_end_of_program_alerts(uuid[]) IS
  'Lazily insert end_of_program_alert rows into coach_events for published programs within 7 days of ends_on (client timezone) with no scheduled successor. Idempotent via the partial unique index. Returns count inserted.';
