-- =============================================================================
-- PR 1: end-of-program → next program flow
--
-- 1. Add 'scheduled' to programs.status CHECK so the queue model is supported.
--    PR 0's lifecycle utility already whitelists scheduled as a soft-promotion
--    view; this migration makes it a real allowed value.
-- 2. Add programs.generation_instructions for the per-generation free-text
--    coach instructions captured on the progression entry screen. Read-only on
--    the regen screen disclosure; does not auto-carry into regen feedback.
-- =============================================================================

ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_status_check;
ALTER TABLE public.programs
  ADD CONSTRAINT programs_status_check
  CHECK (status IN ('draft', 'published', 'archived', 'pending_review', 'scheduled'));

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS generation_instructions text;

COMMENT ON COLUMN public.programs.generation_instructions IS
  'Free-text instructions the coach typed before generating this program (progression mode only). Surfaced read-only on the regeneration screen. Does not auto-carry into regeneration feedback.';
