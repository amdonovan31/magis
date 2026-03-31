-- Per-exercise per-session notes for client comments during workout logging
CREATE TABLE public.session_exercise_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  template_exercise_id uuid NOT NULL REFERENCES workout_template_exercises(id) ON DELETE CASCADE,
  content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, template_exercise_id)
);

CREATE INDEX idx_session_exercise_notes_session ON public.session_exercise_notes (session_id);

ALTER TABLE public.session_exercise_notes ENABLE ROW LEVEL SECURITY;

-- Client owns their notes (via session ownership)
CREATE POLICY "Clients can manage their exercise notes"
  ON public.session_exercise_notes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = session_id AND ws.client_id = auth.uid())
  );

-- Coach can view their clients' notes
CREATE POLICY "Coaches can view client exercise notes"
  ON public.session_exercise_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      JOIN coach_client_relationships ccr ON ccr.client_id = ws.client_id
      WHERE ws.id = session_id AND ccr.coach_id = auth.uid()
    )
  );
