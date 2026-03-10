-- ============================================================
-- Migration 006: Add unique constraint to set_logs
-- Required for the upsert in logSet() to work correctly.
-- Without this, ON CONFLICT cannot resolve and every set
-- log will throw a database error.
-- ============================================================

ALTER TABLE public.set_logs
  ADD CONSTRAINT set_logs_session_exercise_set_unique
  UNIQUE (session_id, template_exercise_id, set_number);
