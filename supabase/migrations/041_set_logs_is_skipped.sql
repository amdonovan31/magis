-- Add per-set skip flag to set_logs.
-- Skipped sets are excluded from volume, PRs, and completion counts
-- but remain visible to coaches on session review.
ALTER TABLE public.set_logs
  ADD COLUMN IF NOT EXISTS is_skipped boolean NOT NULL DEFAULT false;
