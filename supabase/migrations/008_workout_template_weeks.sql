-- Add week_number and is_deload to workout_templates for multi-week program support
ALTER TABLE public.workout_templates
  ADD COLUMN IF NOT EXISTS week_number INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_deload BOOLEAN NOT NULL DEFAULT false;
