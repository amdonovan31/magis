-- =============================================================================
-- PR 2.1: coach Activity feed — four new event types.
--
-- PR 2 shipped coach_events with three types (workout_completed,
-- end_of_program_alert, client_comment). PR 2.1 splits the coach dashboard into
-- an Activity feed (passive log) and an Attention page (action-needed), and
-- adds four event types so each surface populates meaningfully:
--
--   Activity feed   : client_joined, client_left, client_intake_completed
--                     (+ the existing workout_completed)
--   Attention page  : client_inactive_alert (+ the existing end_of_program_alert)
--
-- client_joined / client_left / client_intake_completed are trigger-driven —
-- the source tables (coach_client_relationships, profiles) are the single
-- chokepoint. client_inactive_alert is DERIVED state (no last completed workout
-- for N days), materialized lazily by the RPC below, mirroring
-- end_of_program_alert / migration 063.
--
-- The workout_completed trigger is extended to clear any open
-- client_inactive_alert for that client — logging a workout resolves the alert.
--
-- Self-coached relationships (coach_id = client_id) are skipped by the three
-- new triggers and the inactive-alert RPC: a coach should not see feed items
-- about themselves. The existing workout_completed trigger is unchanged in this
-- regard (it already covered self-coached rows in PR 2).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Section 1: extend the event_type CHECK constraint to seven values.
--
-- Migration 062 declared event_type's CHECK inline, so Postgres auto-named it
-- coach_events_event_type_check (<table>_<column>_check) — deterministic.
-- DROP ... IF EXISTS keeps this re-runnable; the new value set is a superset of
-- the old, so ADD CONSTRAINT validates existing rows instantly.
-- -----------------------------------------------------------------------------
ALTER TABLE public.coach_events
  DROP CONSTRAINT IF EXISTS coach_events_event_type_check;

ALTER TABLE public.coach_events
  ADD CONSTRAINT coach_events_event_type_check
  CHECK (event_type IN (
    'workout_completed',
    'end_of_program_alert',
    'client_comment',
    'client_joined',
    'client_left',
    'client_intake_completed',
    'client_inactive_alert'
  ));

-- -----------------------------------------------------------------------------
-- Section 2: supporting index for the inactive-alert RPC.
--
-- The RPC does a per-client MAX(completed_at) over workout_sessions. No index
-- on workout_sessions exists today (only its primary key), so add one.
-- -----------------------------------------------------------------------------
CREATE INDEX workout_sessions_client_status_idx
  ON public.workout_sessions (client_id, status, completed_at);

-- -----------------------------------------------------------------------------
-- Section 3 — Trigger C: client_joined
--
-- Fires on coach_client_relationships INSERT. The relationship row IS the
-- event; coach_id / client_id / source_id all come straight off NEW. The
-- client's name is snapshotted into the payload for a stable feed label.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_coach_event_client_joined()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_client_name text;
BEGIN
  IF NEW.coach_id = NEW.client_id THEN
    RETURN NEW;  -- self-coached — no feed item about oneself
  END IF;

  SELECT full_name INTO v_client_name
    FROM public.profiles
   WHERE id = NEW.client_id;

  INSERT INTO public.coach_events
    (coach_id, client_id, event_type, source_id, occurred_at, payload)
  VALUES
    (NEW.coach_id, NEW.client_id, 'client_joined', NEW.id, NEW.created_at,
     jsonb_build_object('client_name', v_client_name))
  ON CONFLICT (event_type, source_id) WHERE cleared_at IS NULL DO NOTHING;

  RETURN NEW;
END $$;

CREATE TRIGGER coach_event_client_joined
  AFTER INSERT ON public.coach_client_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_coach_event_client_joined();

-- -----------------------------------------------------------------------------
-- Section 4 — Trigger D: client_left
--
-- Fires on coach_client_relationships DELETE. source_id = OLD.id. The name is
-- snapshotted: the profile may still exist but the relationship is gone.
--
-- NOTE: coach_events.coach_id / client_id reference profiles(id), NOT
-- coach_client_relationships — deleting the relationship does not cascade-
-- delete this event. It persists as history.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_coach_event_client_left()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_client_name text;
BEGIN
  IF OLD.coach_id = OLD.client_id THEN
    RETURN OLD;  -- self-coached — no feed item about oneself
  END IF;

  SELECT full_name INTO v_client_name
    FROM public.profiles
   WHERE id = OLD.client_id;

  INSERT INTO public.coach_events
    (coach_id, client_id, event_type, source_id, occurred_at, payload)
  VALUES
    (OLD.coach_id, OLD.client_id, 'client_left', OLD.id, now(),
     jsonb_build_object('client_name', v_client_name))
  ON CONFLICT (event_type, source_id) WHERE cleared_at IS NULL DO NOTHING;

  RETURN OLD;
END $$;

CREATE TRIGGER coach_event_client_left
  AFTER DELETE ON public.coach_client_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_coach_event_client_left();

-- -----------------------------------------------------------------------------
-- Section 5 — Trigger E: client_intake_completed
--
-- Fires on profiles UPDATE, but only on the onboarding_complete false->true
-- transition. profiles is written often, so the CREATE TRIGGER WHEN clause
-- keeps the function from being entered on unrelated updates; the function body
-- re-guards the same condition defensively.
--
-- coach_id is resolved from coach_client_relationships; an uncoached user
-- (solo) finishing intake produces no event. Self-coached users are skipped
-- too. source_id = NEW.id (the profile uuid).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_coach_event_client_intake_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_coach_id uuid;
BEGIN
  -- Defensive re-guard (mirrors the CREATE TRIGGER WHEN clause).
  IF NEW.onboarding_complete IS NOT TRUE
     OR OLD.onboarding_complete IS NOT DISTINCT FROM NEW.onboarding_complete THEN
    RETURN NEW;
  END IF;

  SELECT coach_id INTO v_coach_id
    FROM public.coach_client_relationships
   WHERE client_id = NEW.id;

  IF v_coach_id IS NULL OR v_coach_id = NEW.id THEN
    RETURN NEW;  -- solo / uncoached, or self-coached — no coach feed to write to
  END IF;

  INSERT INTO public.coach_events
    (coach_id, client_id, event_type, source_id, occurred_at, payload)
  VALUES
    (v_coach_id, NEW.id, 'client_intake_completed', NEW.id, now(),
     jsonb_build_object('client_name', NEW.full_name))
  ON CONFLICT (event_type, source_id) WHERE cleared_at IS NULL DO NOTHING;

  RETURN NEW;
END $$;

CREATE TRIGGER coach_event_client_intake_completed
  AFTER UPDATE OF onboarding_complete ON public.profiles
  FOR EACH ROW
  WHEN (NEW.onboarding_complete IS TRUE
        AND OLD.onboarding_complete IS DISTINCT FROM NEW.onboarding_complete)
  EXECUTE FUNCTION public.trg_coach_event_client_intake_completed();

-- -----------------------------------------------------------------------------
-- Section 6 — extend Trigger A: workout_completed
--
-- Unchanged behavior PLUS: a completed workout clears any open
-- client_inactive_alert for that client. The clear runs regardless of whether a
-- workout_completed event was just inserted (ON CONFLICT may have absorbed the
-- insert on a reopen+recomplete) — the client is active either way. The trigger
-- itself is unchanged from migration 062; only the function body is replaced.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_coach_event_workout_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_coach_id uuid;
BEGIN
  -- Only when the row is (newly) completed.
  IF NEW.status <> 'completed' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT coach_id INTO v_coach_id
    FROM public.coach_client_relationships
   WHERE client_id = NEW.client_id;

  IF v_coach_id IS NULL THEN
    RETURN NEW;  -- solo / uncoached client — no coach feed to write to
  END IF;

  INSERT INTO public.coach_events (coach_id, client_id, event_type, source_id, occurred_at, payload)
  VALUES (v_coach_id, NEW.client_id, 'workout_completed', NEW.id,
          COALESCE(NEW.completed_at, now()), '{}'::jsonb)
  ON CONFLICT (event_type, source_id) WHERE cleared_at IS NULL DO NOTHING;

  -- A completed workout resolves any open inactivity alert for this client.
  UPDATE public.coach_events
     SET cleared_at = now()
   WHERE event_type = 'client_inactive_alert'
     AND client_id  = NEW.client_id
     AND cleared_at IS NULL;

  RETURN NEW;
END $$;

-- -----------------------------------------------------------------------------
-- Section 7 — RPC: materialize_client_inactive_alerts
--
-- Mirrors materialize_end_of_program_alerts (063). Called on coach dashboard /
-- Attention-page load. The inactivity clock starts at the LATER of "last
-- completed workout" and "relationship created" — a brand-new client with no
-- workouts is NOT flagged until 10 days after joining. last_workout_at in the
-- payload stays the raw MAX(completed_at) (may be null); the join-date fallback
-- is only the threshold anchor.
--
-- Idempotent via the partial unique index. Timezone chain identical to 063.
-- Defense in depth: only relationships where the caller is the coach; self-
-- coached rows (coach_id = client_id) are excluded.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.materialize_client_inactive_alerts(p_client_ids uuid[] DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_inserted integer := 0;
  r RECORD;
  v_last_workout_at timestamptz;
  v_today_in_client_tz date;
  v_effective_date date;
BEGIN
  FOR r IN
    SELECT rel.coach_id,
           rel.client_id,
           rel.created_at AS relationship_created_at,
           client_prof.full_name AS client_name,
           COALESCE(client_prof.timezone, coach_prof.timezone, 'America/New_York') AS tz
      FROM public.coach_client_relationships rel
      LEFT JOIN public.profiles client_prof ON client_prof.id = rel.client_id
      LEFT JOIN public.profiles coach_prof  ON coach_prof.id  = rel.coach_id
     WHERE (p_client_ids IS NULL OR rel.client_id = ANY(p_client_ids))
       -- Defense in depth: only the caller's own relationships.
       AND rel.coach_id = auth.uid()
       -- Self-coached relationships fire no feed items about oneself.
       AND rel.coach_id <> rel.client_id
  LOOP
    SELECT MAX(ws.completed_at)
      INTO v_last_workout_at
      FROM public.workout_sessions ws
     WHERE ws.client_id = r.client_id
       AND ws.status = 'completed';

    v_today_in_client_tz := (now() AT TIME ZONE r.tz)::date;

    -- Clock starts at the later of last workout / join date (see plan Q8).
    v_effective_date :=
      (COALESCE(v_last_workout_at, r.relationship_created_at) AT TIME ZONE r.tz)::date;

    IF v_effective_date < v_today_in_client_tz - 10 THEN
      INSERT INTO public.coach_events
        (coach_id, client_id, event_type, source_id, occurred_at, payload)
      VALUES
        (r.coach_id, r.client_id, 'client_inactive_alert', r.client_id, now(),
         jsonb_build_object(
           'client_name', r.client_name,
           'last_workout_at', v_last_workout_at
         ))
      ON CONFLICT (event_type, source_id) WHERE cleared_at IS NULL DO NOTHING;

      IF FOUND THEN
        v_inserted := v_inserted + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN v_inserted;
END $$;

COMMENT ON FUNCTION public.materialize_client_inactive_alerts(uuid[]) IS
  'Lazily insert client_inactive_alert rows into coach_events for coached clients whose last completed workout (or join date, whichever is later) is more than 10 days ago in the client timezone. Idempotent via the partial unique index. Returns count inserted.';

-- -----------------------------------------------------------------------------
-- Section 8 — backfill recent workout_completed events.
--
-- Seeds the feed for completions in the last 7 days so a coach opening the
-- Activity tab right after deploy is not staring at an empty feed. occurred_at
-- is the completion time (not now()) so backfilled rows sort correctly against
-- live trigger-inserted rows; the WHERE predicate already guarantees
-- completed_at is non-null in every matched row. ON CONFLICT DO NOTHING makes
-- the backfill re-runnable and harmless against any events the trigger already
-- produced during the deploy gap. Not self-coached-filtered — mirrors the
-- existing workout_completed trigger.
--
-- client_joined is intentionally NOT backfilled for existing
-- coach_client_relationships rows: those clients are already known to the
-- coach, and inserting client_joined events with occurred_at =
-- relationship.created_at would flood the feed with months-old history.
-- client_joined fires only going forward, on new relationship inserts.
-- -----------------------------------------------------------------------------
INSERT INTO public.coach_events
  (coach_id, client_id, event_type, source_id, occurred_at, payload)
SELECT rel.coach_id,
       ws.client_id,
       'workout_completed',
       ws.id,
       ws.completed_at,
       '{}'::jsonb
  FROM public.workout_sessions ws
  JOIN public.coach_client_relationships rel ON rel.client_id = ws.client_id
 WHERE ws.status = 'completed'
   AND ws.completed_at >= now() - interval '7 days'
ON CONFLICT (event_type, source_id) WHERE cleared_at IS NULL DO NOTHING;
