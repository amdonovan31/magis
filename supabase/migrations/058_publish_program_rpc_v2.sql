-- =============================================================================
-- PR 1: extend publish_program to support a target_status of 'scheduled' (queue
-- model) in addition to 'published' (immediate publish). Also accepts an
-- optional generation_instructions string captured at progression-mode entry.
--
-- Default args preserve backwards compatibility for existing callers — passing
-- only the original three (p_program_id, p_starts_on, p_scheduled_workouts)
-- still publishes immediately, which matches the prior PR 0 behavior.
--
-- Drops the prior 3-arg function before recreating with the wider signature.
-- =============================================================================

DROP FUNCTION IF EXISTS public.publish_program(uuid, date, jsonb);

CREATE OR REPLACE FUNCTION public.publish_program(
  p_program_id uuid,
  p_starts_on date,
  p_scheduled_workouts jsonb,
  p_target_status text DEFAULT 'published',
  p_generation_instructions text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_client_id uuid;
  v_archived_title text;
BEGIN
  -- Validate target_status — only 'published' or 'scheduled' allowed.
  IF p_target_status NOT IN ('published', 'scheduled') THEN
    RAISE EXCEPTION 'Invalid target_status: %; expected ''published'' or ''scheduled''', p_target_status;
  END IF;

  -- 1. Authorize and load client_id
  SELECT client_id INTO v_client_id
    FROM public.programs
   WHERE id = p_program_id AND coach_id = auth.uid();

  IF v_client_id IS NULL AND NOT EXISTS (
    SELECT 1 FROM public.programs WHERE id = p_program_id AND coach_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: you do not own this program';
  END IF;

  -- 2. Archive priors ONLY when going straight to published. When scheduling
  --    for a future date, the prior published program keeps running until
  --    promotion fires (handled by promote_scheduled_programs).
  IF p_target_status = 'published' AND v_client_id IS NOT NULL THEN
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

    -- Deactivate stale drafts for this client (matches previous JS behavior).
    -- Don't touch scheduled programs — those are intentional queue items.
    UPDATE public.programs
       SET is_active = false
     WHERE client_id = v_client_id
       AND status = 'draft'
       AND id != p_program_id;
  END IF;

  -- 3. Replace this program's scheduled_workouts with the rows TS computed.
  --    Trigger from migration 054 fires per row and sets ends_on on the program.
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

  -- 4. Flip this program to the requested status. is_active=true for both
  --    'published' and 'scheduled' so the program shows on coach dashboard
  --    listings. ends_on is already set by the trigger.
  UPDATE public.programs
     SET status = p_target_status,
         is_active = true,
         starts_on = p_starts_on,
         generation_instructions = COALESCE(p_generation_instructions, generation_instructions)
   WHERE id = p_program_id;

  RETURN jsonb_build_object(
    'success', true,
    'archived_program_title', v_archived_title
  );
END $$;

COMMENT ON FUNCTION public.publish_program(uuid, date, jsonb, text, text) IS
  'Atomically publish or schedule a program. target_status=''published'' archives priors and goes live now. target_status=''scheduled'' leaves priors running and queues for promotion when starts_on arrives. Returns { success, archived_program_title }.';
