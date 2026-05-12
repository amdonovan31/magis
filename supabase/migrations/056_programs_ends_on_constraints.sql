-- =============================================================================
-- PR 0 / pass 2: tighten programs.ends_on after pass 1's backfill is verified
-- and the publish_program RPC (migration 055) is in place to keep ends_on set
-- on every new published program.
-- =============================================================================

ALTER TABLE public.programs
  ALTER COLUMN ends_on SET NOT NULL;

ALTER TABLE public.programs
  ADD CONSTRAINT programs_ends_on_after_starts CHECK (ends_on >= starts_on);
