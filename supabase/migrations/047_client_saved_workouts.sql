-- Client-owned workout templates, independent of coach programs.
-- Extensible via `source` column for future shared/social workouts.

CREATE TABLE public.saved_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  source text NOT NULL DEFAULT 'custom',
  source_template_id uuid REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  source_program_title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  use_count int NOT NULL DEFAULT 0
);

CREATE TABLE public.saved_workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_workout_id uuid NOT NULL REFERENCES public.saved_workouts(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id),
  position int NOT NULL,
  default_sets int NOT NULL DEFAULT 3,
  default_reps text,
  default_weight text,
  rest_seconds int,
  notes text
);

ALTER TABLE public.saved_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY saved_workouts_client ON public.saved_workouts
  FOR ALL USING (client_id = auth.uid());

CREATE POLICY saved_workout_exercises_client ON public.saved_workout_exercises
  FOR ALL USING (
    saved_workout_id IN (SELECT id FROM public.saved_workouts WHERE client_id = auth.uid())
  );

CREATE POLICY saved_workouts_coach_read ON public.saved_workouts
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM public.coach_client_relationships WHERE coach_id = auth.uid()
    )
  );

CREATE POLICY saved_workout_exercises_coach_read ON public.saved_workout_exercises
  FOR SELECT USING (
    saved_workout_id IN (
      SELECT sw.id FROM public.saved_workouts sw
      JOIN public.coach_client_relationships ccr ON sw.client_id = ccr.client_id
      WHERE ccr.coach_id = auth.uid()
    )
  );
