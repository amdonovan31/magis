-- Add exercise_id to set_logs for exercise swap tracking.
-- When null, the exercise is inferred from template_exercise_id.
-- When set, it overrides the template exercise (i.e., the user swapped to an alternate).
ALTER TABLE set_logs
  ADD COLUMN IF NOT EXISTS exercise_id uuid REFERENCES exercises(id) ON DELETE SET NULL;
