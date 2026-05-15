-- =============================================================================
-- PR 1.1: capture a frozen copy of the client's intake row at program
-- generation time. Forward-looking infrastructure — a future intake-edit flow
-- will diff PAR-Q against this snapshot. The diff itself is NOT built yet:
-- client_intake is currently insert-only (no post-onboarding edit UI), so a
-- diff would be structurally empty today.
-- =============================================================================

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS intake_snapshot jsonb;

COMMENT ON COLUMN public.programs.intake_snapshot IS
  'Frozen copy of the client_intake row at program generation time. Forward-looking: a future intake-edit flow will diff PAR-Q against this. NULL for programs generated before PR 1.1.';
