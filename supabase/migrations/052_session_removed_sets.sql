-- Track prescribed sets the client removed mid-workout, so the coach has visibility.
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS removed_sets jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.workout_sessions.removed_sets IS
  'Array of {templateExerciseId, setNumber} objects flagging prescribed sets the client removed mid-workout';

-- Atomic delete + renumber. Without this RPC, a client-side loop UPDATEing each
-- remaining row could leave a "set 1, 2, 4" gap if the connection drops mid-loop.
-- Wrapping it in a plpgsql function gives us single-transaction atomicity.
--
-- Ascending-order renumber is safe: each UPDATE fills the slot the previous one
-- freed, so the unique (session_id, template_exercise_id, set_number) constraint
-- never collides.
CREATE OR REPLACE FUNCTION public.delete_set_log_with_renumber(
  p_session_id uuid,
  p_template_exercise_id uuid,
  p_exercise_id uuid,
  p_set_number int
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  r record;
BEGIN
  IF p_template_exercise_id IS NOT NULL THEN
    DELETE FROM public.set_logs
    WHERE session_id = p_session_id
      AND template_exercise_id = p_template_exercise_id
      AND set_number = p_set_number;

    FOR r IN
      SELECT id, set_number FROM public.set_logs
      WHERE session_id = p_session_id
        AND template_exercise_id = p_template_exercise_id
        AND set_number > p_set_number
      ORDER BY set_number ASC
    LOOP
      UPDATE public.set_logs SET set_number = r.set_number - 1 WHERE id = r.id;
    END LOOP;
  ELSE
    DELETE FROM public.set_logs
    WHERE session_id = p_session_id
      AND exercise_id = p_exercise_id
      AND template_exercise_id IS NULL
      AND set_number = p_set_number;

    FOR r IN
      SELECT id, set_number FROM public.set_logs
      WHERE session_id = p_session_id
        AND exercise_id = p_exercise_id
        AND template_exercise_id IS NULL
        AND set_number > p_set_number
      ORDER BY set_number ASC
    LOOP
      UPDATE public.set_logs SET set_number = r.set_number - 1 WHERE id = r.id;
    END LOOP;
  END IF;
END;
$$;
