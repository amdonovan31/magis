-- Add numeric weight columns to set_logs (additive, existing weight_used untouched)
ALTER TABLE public.set_logs
  ADD COLUMN IF NOT EXISTS weight_value numeric,
  ADD COLUMN IF NOT EXISTS weight_unit text CHECK (weight_unit IN ('lbs', 'kg'));

-- Add weight unit preference to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weight_unit text NOT NULL DEFAULT 'lbs'
  CHECK (weight_unit IN ('lbs', 'kg'));
