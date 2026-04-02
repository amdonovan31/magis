-- One-time data patch: relabel unit fields for Alex Donovan.
-- All values were entered in lbs but stored with kg labels.
-- No numeric conversion — labels only.

-- 1. Set preferred_unit on profile
UPDATE public.profiles
SET preferred_unit = 'lbs'
WHERE full_name = 'Alex Donovan';

-- 2. Relabel set_logs.weight_unit from kg to lbs
UPDATE public.set_logs
SET weight_unit = 'lbs'
WHERE weight_unit = 'kg'
  AND session_id IN (
    SELECT id FROM public.workout_sessions
    WHERE client_id = (SELECT id FROM public.profiles WHERE full_name = 'Alex Donovan')
  );

-- 3. Relabel personal_records.unit from kg to lbs
UPDATE public.personal_records
SET unit = 'lbs'
WHERE unit = 'kg'
  AND user_id = (SELECT id FROM public.profiles WHERE full_name = 'Alex Donovan');
