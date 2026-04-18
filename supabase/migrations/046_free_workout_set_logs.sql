-- Partial unique index for free workout set logs.
-- The existing constraint (session_id, template_exercise_id, set_number) doesn't
-- work when template_exercise_id IS NULL (SQL NULL != NULL). This index enables
-- upsert by (session_id, exercise_id, set_number) for free workout sets.

CREATE UNIQUE INDEX IF NOT EXISTS set_logs_free_workout_unique
  ON public.set_logs (session_id, exercise_id, set_number)
  WHERE template_exercise_id IS NULL;
