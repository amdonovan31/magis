-- ============================================================
-- Migration 019: Add biometric fields to profiles
-- Birthdate, gender, height (cm), weight (kg), training age
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birthdate date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS weight_kg numeric,
  ADD COLUMN IF NOT EXISTS training_age_years integer;
