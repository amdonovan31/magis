-- Add roles array column to support multi-role users
ALTER TABLE public.profiles
  ADD COLUMN roles text[] NOT NULL DEFAULT '{}';

-- Backfill from existing single role
UPDATE public.profiles SET roles = ARRAY[role];

-- Validate array values
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_roles_check
  CHECK (roles <@ ARRAY['coach', 'client', 'solo']::text[]);

-- Update handle_new_user() trigger to populate both role and roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _role text;
BEGIN
  _role := coalesce(new.raw_user_meta_data->>'role', 'client');

  INSERT INTO public.profiles (id, role, roles, full_name)
  VALUES (
    new.id,
    _role,
    ARRAY[_role],
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );

  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('role', _role)
  WHERE id = new.id;

  IF new.raw_user_meta_data->>'coach_id' IS NOT NULL THEN
    INSERT INTO public.coach_client_relationships (coach_id, client_id)
    VALUES ((new.raw_user_meta_data->>'coach_id')::uuid, new.id)
    ON CONFLICT (client_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;
