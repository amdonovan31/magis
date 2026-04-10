-- Allow anonymous reads of coach profiles for the public invite link page.
-- The /invite/[coachId] route is fully public — unauthenticated visitors must
-- be able to see the coach's name and avatar before signing up.
--
-- This intentionally exposes only profiles where role = 'coach'. Client and
-- solo profiles remain restricted to the user themselves and their coach.
-- Exposed fields are application-level (no RLS at column level): full_name,
-- avatar_url, role, id. The page only renders these.
CREATE POLICY "Anyone can view coach public info"
  ON public.profiles FOR SELECT
  USING (role = 'coach');
