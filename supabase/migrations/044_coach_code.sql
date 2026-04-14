-- Add coach_code column for shareable coach identification during client self-signup.
-- Format: XXXXX-YYY (name prefix + hex suffix). UNIQUE constraint enforced.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coach_code text UNIQUE;

-- Backfill existing coaches with collision-safe retry logic.
DO $$
DECLARE
  r RECORD;
  _prefix text;
  _code text;
  _len int;
  _exists boolean;
BEGIN
  FOR r IN SELECT id, full_name FROM public.profiles WHERE role = 'coach' AND coach_code IS NULL
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
        -- Fallback: fully random 6-char code
        _code := UPPER(SUBSTRING(MD5(random()::text), 1, 6));
        UPDATE public.profiles SET coach_code = _code WHERE id = r.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Update handle_new_user trigger to auto-generate coach_code for new coaches.
-- Preserves all existing behavior (profile insert, role mirroring, coach_client_relationships).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _role text;
  _prefix text;
  _code text;
  _len int;
  _exists boolean;
BEGIN
  _role := coalesce(new.raw_user_meta_data->>'role', 'client');

  INSERT INTO public.profiles (id, role, roles, full_name)
  VALUES (
    new.id,
    _role,
    ARRAY[_role],
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );

  -- Mirror role to app_metadata so it's available in JWT
  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('role', _role)
  WHERE id = new.id;

  -- Auto-generate coach_code for new coaches with collision retry
  IF _role = 'coach' THEN
    _prefix := UPPER(SUBSTRING(REPLACE(COALESCE(new.raw_user_meta_data->>'full_name', 'COACH'), ' ', ''), 1, 5));
    _len := 3;
    LOOP
      _code := _prefix || '-' || UPPER(SUBSTRING(MD5(new.id::text || _len::text), 1, _len));
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE coach_code = _code) INTO _exists;
      IF NOT _exists THEN
        UPDATE public.profiles SET coach_code = _code WHERE id = new.id;
        EXIT;
      END IF;
      _len := _len + 1;
      IF _len > 8 THEN
        _code := UPPER(SUBSTRING(MD5(random()::text), 1, 6));
        UPDATE public.profiles SET coach_code = _code WHERE id = new.id;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- If client was invited by a coach, create the relationship
  IF new.raw_user_meta_data->>'coach_id' IS NOT NULL THEN
    INSERT INTO public.coach_client_relationships (coach_id, client_id)
    VALUES ((new.raw_user_meta_data->>'coach_id')::uuid, new.id)
    ON CONFLICT (client_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;
