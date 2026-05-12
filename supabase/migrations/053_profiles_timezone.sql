-- Per-user IANA timezone, populated client-side on first authenticated load
-- with Intl.DateTimeFormat().resolvedOptions().timeZone. Nullable so existing
-- rows don't break; callers fall back to America/New_York when null.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone text;

COMMENT ON COLUMN public.profiles.timezone IS
  'IANA timezone name (e.g. America/New_York). Captured once from the browser on first authenticated load if null. User-editable later.';
