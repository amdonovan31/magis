-- Add alternate exercise IDs to workout template exercises
-- Stores 1-2 exercise UUIDs that can substitute for the primary exercise
ALTER TABLE public.workout_template_exercises
  ADD COLUMN IF NOT EXISTS alternate_exercise_ids jsonb DEFAULT NULL;
