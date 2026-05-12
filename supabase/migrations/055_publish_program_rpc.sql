-- =============================================================================
-- publish_program RPC — atomic program publish.
--
-- Light RPC: TypeScript computes the scheduled_workouts rows from
-- workout_templates and passes them in as a jsonb array. The RPC handles
-- atomicity only — archive prior published programs, replace this program's
-- scheduled_workouts, flip status to 'published'. The trigger installed in
-- migration 054 fires on the INSERT and sets ends_on automatically.
--
-- Auth model: caller must own the program (coach_id = auth.uid()). Solo users
-- create programs with coach_id = client_id = their own user_id, so the same
-- check works for them.
--
-- Returns: { success: bool, archived_program_title: text | null }
-- =============================================================================

CREATE OR REPLACE FUNCTION public.publish_program(
  p_program_id uuid,
  p_starts_on date,
  p_scheduled_workouts jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_client_id uuid;
  v_archived_title text;
BEGIN
  -- 1. Authorize and load client_id
  SELECT client_id INTO v_client_id
    FROM public.programs
   WHERE id = p_program_id AND coach_id = auth.uid();

  IF v_client_id IS NULL AND NOT EXISTS (
    SELECT 1 FROM public.programs WHERE id = p_program_id AND coach_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: you do not own this program';
  END IF;

  -- 2. Archive any other published programs for this client. Capture the title
  --    of the first one for return-shape parity with the previous JS impl.
  --    Skip when the program is unassigned (no client to archive against).
  IF v_client_id IS NOT NULL THEN
    SELECT title INTO v_archived_title
      FROM public.programs
     WHERE client_id = v_client_id
       AND status = 'published'
       AND id != p_program_id
     LIMIT 1;

    UPDATE public.programs
       SET status = 'archived', is_active = false
     WHERE client_id = v_client_id
       AND status = 'published'
       AND id != p_program_id;

    -- Deactivate stale drafts for this client (matches previous JS behavior)
    UPDATE public.programs
       SET is_active = false
     WHERE client_id = v_client_id
       AND status = 'draft'
       AND id != p_program_id;
  END IF;

  -- 3. Replace this program's scheduled_workouts with the rows TS computed
  DELETE FROM public.scheduled_workouts WHERE program_id = p_program_id;

  INSERT INTO public.scheduled_workouts
    (client_id, program_id, workout_template_id, scheduled_date, status)
  SELECT
    s.client_id,
    s.program_id,
    s.workout_template_id,
    s.scheduled_date,
    s.status
  FROM jsonb_to_recordset(p_scheduled_workouts) AS s(
    client_id uuid,
    program_id uuid,
    workout_template_id uuid,
    scheduled_date date,
    status text
  );
  -- Trigger from migration 054 fires per row and sets ends_on on the program.

  -- 4. Flip this program to published. ends_on is already set by the trigger.
  UPDATE public.programs
     SET status = 'published',
         is_active = true,
         starts_on = p_starts_on
   WHERE id = p_program_id;

  RETURN jsonb_build_object(
    'success', true,
    'archived_program_title', v_archived_title
  );
END $$;

COMMENT ON FUNCTION public.publish_program(uuid, date, jsonb) IS
  'Atomically publish a program: archive priors (status=archived, is_active=false), replace scheduled_workouts with the rows the caller computed, flip this program to published. Trigger on scheduled_workouts sets ends_on. Returns { success, archived_program_title }.';
