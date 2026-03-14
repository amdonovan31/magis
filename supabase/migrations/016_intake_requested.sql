-- ============================================================
-- Migration 016: Add intake_requested flag to profiles
-- Coaches set this to true when they want a client to fill
-- out the detailed intake form. Cleared on submission.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN intake_requested boolean NOT NULL DEFAULT false;
