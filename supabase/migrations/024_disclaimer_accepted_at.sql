ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS disclaimer_accepted_at timestamptz;
