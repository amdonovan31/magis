-- Add cardio programming fields to coach_guidelines.
-- When include_cardio is true, the AI generates mixed strength + cardio programs.

ALTER TABLE public.coach_guidelines
  ADD COLUMN IF NOT EXISTS include_cardio boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cardio_days_per_week int,
  ADD COLUMN IF NOT EXISTS cardio_modalities text[],
  ADD COLUMN IF NOT EXISTS cardio_zone_focus int,
  ADD COLUMN IF NOT EXISTS cardio_notes text;
