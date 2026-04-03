-- Denormalized, append-only AI context store for client exercise feedback.
-- One row per exercise note, all context inline — single query per client, no joins needed.
CREATE TABLE public.client_exercise_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  note text NOT NULL,
  session_id uuid REFERENCES workout_sessions(id) ON DELETE SET NULL,
  session_date timestamptz NOT NULL,
  program_title text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_exercise_feedback_client
  ON public.client_exercise_feedback (client_id, created_at DESC);

ALTER TABLE public.client_exercise_feedback ENABLE ROW LEVEL SECURITY;

-- Client reads own feedback
CREATE POLICY "Clients can view their exercise feedback"
  ON public.client_exercise_feedback FOR SELECT
  USING (client_id = auth.uid());

-- Coach reads their clients' feedback (via coach_client_relationships)
CREATE POLICY "Coaches can view client exercise feedback"
  ON public.client_exercise_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_client_relationships ccr
      WHERE ccr.client_id = client_exercise_feedback.client_id
        AND ccr.coach_id = auth.uid()
    )
  );

-- Client can insert their own feedback (completeSession uses authenticated client, not service role)
CREATE POLICY "Clients can insert their own exercise feedback"
  ON public.client_exercise_feedback FOR INSERT
  WITH CHECK (client_id = auth.uid());
