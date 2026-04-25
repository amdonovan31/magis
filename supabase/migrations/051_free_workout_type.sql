-- Add type tracking for free workouts (null = legacy strength session).

ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS free_workout_type text,
  ADD COLUMN IF NOT EXISTS free_workout_modality text;

ALTER TABLE public.workout_sessions
  ADD CONSTRAINT chk_free_modality
  CHECK (
    free_workout_type IS NULL
    OR free_workout_type = 'strength'
    OR (free_workout_type = 'cardio' AND free_workout_modality IS NOT NULL)
  );
