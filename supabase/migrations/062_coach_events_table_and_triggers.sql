-- =============================================================================
-- PR 2: coach_events — shared event log behind the coach Activity feed.
--
-- Three event types in v1: workout_completed, end_of_program_alert,
-- client_comment. The future bell-icon notification work will read the same
-- table (read-state will be added then; not part of v1).
--
-- workout_completed and client_comment are fired by DB triggers (the source
-- tables have multiple write paths each; a trigger is the single chokepoint
-- no code path can forget). end_of_program_alert is derived state,
-- materialized lazily by the RPC in migration 063.
-- =============================================================================

CREATE TABLE public.coach_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type  text NOT NULL CHECK (event_type IN
                ('workout_completed','end_of_program_alert','client_comment')),
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_id   uuid NOT NULL,            -- session_id / note_id / program_id
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  cleared_at  timestamptz              -- set on end_of_program_alert when a next program is scheduled
);

CREATE INDEX coach_events_feed_idx
  ON public.coach_events (coach_id, occurred_at DESC);

-- Idempotency for ACTIVE rows only: one un-cleared row per (type, source).
-- A cleared end-of-program alert no longer blocks a fresh one — so the alert
-- re-raises after a scheduled program is cancelled, matching PR 1's dashboard
-- "Next Program" badge reappear-on-cancellation behavior.
CREATE UNIQUE INDEX coach_events_type_source_active_idx
  ON public.coach_events (event_type, source_id)
  WHERE cleared_at IS NULL;

-- Non-unique index for the clear-side UPDATE lookup.
CREATE INDEX coach_events_type_source_idx
  ON public.coach_events (event_type, source_id);

ALTER TABLE public.coach_events ENABLE ROW LEVEL SECURITY;

-- SELECT only. All inserts come from SECURITY DEFINER functions (the two
-- triggers below + the materialization RPC in 063), which bypass RLS — so no
-- INSERT policy is needed. The UPDATE policy covers the coach-side "clear"
-- in scheduleProgram.
CREATE POLICY "Coaches read their own events"
  ON public.coach_events FOR SELECT
  USING (
    auth.uid() = coach_id
    AND EXISTS (
      SELECT 1 FROM public.coach_client_relationships
      WHERE coach_id = auth.uid() AND client_id = coach_events.client_id
    )
  );

CREATE POLICY "Coaches clear their own events"
  ON public.coach_events FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- -----------------------------------------------------------------------------
-- Trigger A: workout_completed
--
-- Fires on workout_sessions when a row lands in status='completed' — covers
-- all three completion paths (completeSession UPDATE, saveRetroLog INSERT,
-- completeCardioSession UPDATE). reopen+recomplete is absorbed by the partial
-- unique index (ON CONFLICT DO NOTHING). Solo / uncoached clients have no
-- coach_client_relationships row → coach_id resolves NULL → no event.
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

  RETURN NEW;
END $$;

CREATE TRIGGER coach_event_workout_completed
  AFTER INSERT OR UPDATE ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_coach_event_workout_completed();

-- -----------------------------------------------------------------------------
-- Trigger B: client_comment
--
-- Fires on session_exercise_notes INSERT (set-level notes the client writes
-- during a workout — two write paths: saveExerciseNote + saveRetroLog).
-- Skips empty content. content is snapshotted into the payload at comment
-- time (correct for a log). Solo / uncoached clients are skipped as above.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_coach_event_client_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_client_id uuid;
  v_coach_id uuid;
BEGIN
  IF NEW.content IS NULL OR btrim(NEW.content) = '' THEN
    RETURN NEW;
  END IF;

  SELECT client_id INTO v_client_id
    FROM public.workout_sessions
   WHERE id = NEW.session_id;

  IF v_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT coach_id INTO v_coach_id
    FROM public.coach_client_relationships
   WHERE client_id = v_client_id;

  IF v_coach_id IS NULL THEN
    RETURN NEW;  -- solo / uncoached client
  END IF;

  INSERT INTO public.coach_events (coach_id, client_id, event_type, source_id, occurred_at, payload)
  VALUES (v_coach_id, v_client_id, 'client_comment', NEW.id, NEW.created_at,
          jsonb_build_object(
            'content', NEW.content,
            'session_id', NEW.session_id,
            'template_exercise_id', NEW.template_exercise_id
          ))
  ON CONFLICT (event_type, source_id) WHERE cleared_at IS NULL DO NOTHING;

  RETURN NEW;
END $$;

CREATE TRIGGER coach_event_client_comment
  AFTER INSERT ON public.session_exercise_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_coach_event_client_comment();
