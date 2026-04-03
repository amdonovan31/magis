-- Extra work: unplanned exercises logged during a workout session.
-- Separate from set_logs (which requires template_exercise_id for its unique constraint).
-- client_id denormalized for direct per-client querying (AI context).
-- group_id is a client-generated UUID grouping sets of the same extra exercise.
CREATE TABLE public.session_extra_work (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id uuid NOT NULL,
  exercise_name text NOT NULL,
  set_number int NOT NULL,
  reps_completed int,
  weight_value numeric,
  weight_unit text,
  logged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, group_id, set_number)
);

CREATE INDEX idx_session_extra_work_session ON public.session_extra_work (session_id);
CREATE INDEX idx_session_extra_work_client ON public.session_extra_work (client_id, logged_at DESC);

ALTER TABLE public.session_extra_work ENABLE ROW LEVEL SECURITY;

-- Client manages their own extra work
CREATE POLICY "Clients can manage their extra work"
  ON public.session_extra_work FOR ALL
  USING (client_id = auth.uid());

-- Coach can view their clients' extra work
CREATE POLICY "Coaches can view client extra work"
  ON public.session_extra_work FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_client_relationships ccr
      WHERE ccr.client_id = session_extra_work.client_id
        AND ccr.coach_id = auth.uid()
    )
  );
