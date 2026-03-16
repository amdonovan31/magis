-- Add draft/published status to programs table
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'published'));

-- Backfill: existing programs were already visible to clients
UPDATE public.programs SET status = 'published' WHERE status = 'draft';
