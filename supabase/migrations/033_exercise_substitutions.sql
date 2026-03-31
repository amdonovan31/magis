-- Exercise substitutions: tracks when a client swaps an exercise during a session
CREATE TABLE public.exercise_substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  template_exercise_id uuid NOT NULL REFERENCES workout_template_exercises(id) ON DELETE CASCADE,
  original_exercise_id uuid NOT NULL REFERENCES exercises(id),
  substitute_exercise_id uuid NOT NULL REFERENCES exercises(id),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, template_exercise_id)
);

CREATE INDEX idx_exercise_subs_session ON public.exercise_substitutions (session_id);
CREATE INDEX idx_exercise_subs_substitute ON public.exercise_substitutions (substitute_exercise_id);

ALTER TABLE public.exercise_substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage their substitutions"
  ON public.exercise_substitutions FOR ALL
  USING (EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = session_id AND ws.client_id = auth.uid()));

CREATE POLICY "Coaches can view client substitutions"
  ON public.exercise_substitutions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workout_sessions ws
    JOIN coach_client_relationships ccr ON ccr.client_id = ws.client_id
    WHERE ws.id = session_id AND ccr.coach_id = auth.uid()
  ));
