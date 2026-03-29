-- Backfill self-coaching relationships for dual-role users (coach + client)
-- who are not already assigned to another coach.
INSERT INTO public.coach_client_relationships (coach_id, client_id)
SELECT p.id, p.id
FROM public.profiles p
WHERE p.roles @> ARRAY['coach', 'client']::text[]
  AND NOT EXISTS (
    SELECT 1 FROM public.coach_client_relationships ccr
    WHERE ccr.client_id = p.id
  )
ON CONFLICT (client_id) DO NOTHING;
