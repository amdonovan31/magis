-- Fix coach code lookup failing for multi-role users (coach + client).
--
-- Background: `profiles.role` is the *active* role (toggled by the role switcher).
-- `profiles.roles` is the array of granted roles. Migrations 043 (public read) and
-- 044 (backfill) both filtered on `role = 'coach'`, which excluded any coach who
-- was currently acting as a client when the signup lookup ran.
--
-- This migration:
--   1. Replaces the 043 public-read policy to permit reads when 'coach' is ANY role.
--   2. Re-runs the coach_code backfill against all users with 'coach' in roles[].
--   3. Adds an ensure_coach_code(uuid) RPC used by addRoleToProfile() when a user
--      upgrades into a coach role after initial signup.

-- 1. Replace the public-read policy.
DROP POLICY IF EXISTS "Anyone can view coach public info" ON public.profiles;

CREATE POLICY "Anyone can view coach public info"
  ON public.profiles FOR SELECT
  USING ('coach' = ANY(roles));

-- 2. Backfill any coaches missed by 044 because their active `role` was not 'coach'.
DO $$
DECLARE
  r RECORD;
  _prefix text;
  _code text;
  _len int;
  _exists boolean;
BEGIN
  FOR r IN
    SELECT id, full_name FROM public.profiles
    WHERE 'coach' = ANY(roles) AND coach_code IS NULL
  LOOP
    _prefix := UPPER(SUBSTRING(REPLACE(COALESCE(r.full_name, 'COACH'), ' ', ''), 1, 5));
    _len := 3;
    LOOP
      _code := _prefix || '-' || UPPER(SUBSTRING(MD5(r.id::text || _len::text), 1, _len));
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE coach_code = _code) INTO _exists;
      IF NOT _exists THEN
        UPDATE public.profiles SET coach_code = _code WHERE id = r.id;
        EXIT;
      END IF;
      _len := _len + 1;
      IF _len > 8 THEN
        _code := UPPER(SUBSTRING(MD5(random()::text), 1, 6));
        UPDATE public.profiles SET coach_code = _code WHERE id = r.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 3. RPC for post-signup coach-role upgrades. SECURITY DEFINER so it can write
-- even when the caller's RLS wouldn't allow updating the coach_code column.
-- Caller identity is verified via auth.uid() = target_id.
CREATE OR REPLACE FUNCTION public.ensure_coach_code(target_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _full_name text;
  _existing text;
  _prefix text;
  _code text;
  _len int;
  _exists boolean;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> target_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT coach_code, full_name
    INTO _existing, _full_name
  FROM public.profiles
  WHERE id = target_id;

  IF _existing IS NOT NULL THEN
    RETURN _existing;
  END IF;

  _prefix := UPPER(SUBSTRING(REPLACE(COALESCE(_full_name, 'COACH'), ' ', ''), 1, 5));
  _len := 3;
  LOOP
    _code := _prefix || '-' || UPPER(SUBSTRING(MD5(target_id::text || _len::text), 1, _len));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE coach_code = _code) INTO _exists;
    IF NOT _exists THEN
      UPDATE public.profiles SET coach_code = _code WHERE id = target_id;
      RETURN _code;
    END IF;
    _len := _len + 1;
    IF _len > 8 THEN
      _code := UPPER(SUBSTRING(MD5(random()::text), 1, 6));
      UPDATE public.profiles SET coach_code = _code WHERE id = target_id;
      RETURN _code;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_coach_code(uuid) TO authenticated;
