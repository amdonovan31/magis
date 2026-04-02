-- Drop the legacy weight_unit column from profiles.
-- The canonical unit preference is now profiles.preferred_unit (migration 034).
-- set_logs.weight_unit is unaffected — it records the unit each set was logged in.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS weight_unit;
