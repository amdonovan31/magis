-- Allow 'pending_review' and 'archived' as valid program statuses
ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_status_check;
ALTER TABLE public.programs
  ADD CONSTRAINT programs_status_check
  CHECK (status IN ('draft', 'published', 'archived', 'pending_review'));
