-- Migration: Solo user support
-- Adds onboarding_complete to profiles and RLS policies for solo users

-- Add onboarding_complete column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false;

-- Backfill existing profiles
UPDATE profiles SET onboarding_complete = true WHERE onboarding_complete = false;

-- Solo users can view and update their own profile (already covered by existing policies)

-- Solo users can manage their own exercises (mirrors coach policies)
CREATE POLICY "Solo users can view their own exercises"
  ON exercises FOR SELECT
  USING (
    created_by = auth.uid() AND (SELECT get_my_role()) = 'solo'
  );

CREATE POLICY "Solo users can insert their own exercises"
  ON exercises FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND (SELECT get_my_role()) = 'solo'
  );

CREATE POLICY "Solo users can update their own exercises"
  ON exercises FOR UPDATE
  USING (
    created_by = auth.uid() AND (SELECT get_my_role()) = 'solo'
  );

-- Solo users can manage their own programs (they are both coach_id and client_id)
CREATE POLICY "Solo users can view their own programs"
  ON programs FOR SELECT
  USING (
    coach_id = auth.uid() AND (SELECT get_my_role()) = 'solo'
  );

CREATE POLICY "Solo users can insert their own programs"
  ON programs FOR INSERT
  WITH CHECK (
    coach_id = auth.uid() AND (SELECT get_my_role()) = 'solo'
  );

CREATE POLICY "Solo users can update their own programs"
  ON programs FOR UPDATE
  USING (
    coach_id = auth.uid() AND (SELECT get_my_role()) = 'solo'
  );

-- Solo users can manage workout templates via their programs
CREATE POLICY "Solo users can view their workout templates"
  ON workout_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = workout_templates.program_id
        AND programs.coach_id = auth.uid()
        AND (SELECT get_my_role()) = 'solo'
    )
  );

CREATE POLICY "Solo users can insert workout templates"
  ON workout_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = workout_templates.program_id
        AND programs.coach_id = auth.uid()
        AND (SELECT get_my_role()) = 'solo'
    )
  );

-- Solo users can manage template exercises
CREATE POLICY "Solo users can view their template exercises"
  ON workout_template_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_templates
      JOIN programs ON programs.id = workout_templates.program_id
      WHERE workout_templates.id = workout_template_exercises.workout_template_id
        AND programs.coach_id = auth.uid()
        AND (SELECT get_my_role()) = 'solo'
    )
  );

CREATE POLICY "Solo users can insert template exercises"
  ON workout_template_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_templates
      JOIN programs ON programs.id = workout_templates.program_id
      WHERE workout_templates.id = workout_template_exercises.workout_template_id
        AND programs.coach_id = auth.uid()
        AND (SELECT get_my_role()) = 'solo'
    )
  );

-- Solo users can manage their own workout sessions
CREATE POLICY "Solo users can view their sessions"
  ON workout_sessions FOR SELECT
  USING (
    client_id = auth.uid() AND (SELECT get_my_role()) = 'solo'
  );

CREATE POLICY "Solo users can insert their sessions"
  ON workout_sessions FOR INSERT
  WITH CHECK (
    client_id = auth.uid() AND (SELECT get_my_role()) = 'solo'
  );

CREATE POLICY "Solo users can update their sessions"
  ON workout_sessions FOR UPDATE
  USING (
    client_id = auth.uid() AND (SELECT get_my_role()) = 'solo'
  );

-- Solo users can manage their set logs
CREATE POLICY "Solo users can view their set logs"
  ON set_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = set_logs.session_id
        AND workout_sessions.client_id = auth.uid()
        AND (SELECT get_my_role()) = 'solo'
    )
  );

CREATE POLICY "Solo users can insert their set logs"
  ON set_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = set_logs.session_id
        AND workout_sessions.client_id = auth.uid()
        AND (SELECT get_my_role()) = 'solo'
    )
  );

CREATE POLICY "Solo users can update their set logs"
  ON set_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = set_logs.session_id
        AND workout_sessions.client_id = auth.uid()
        AND (SELECT get_my_role()) = 'solo'
    )
  );

-- Solo users can manage personal records
CREATE POLICY "Solo users can view their personal records"
  ON personal_records FOR SELECT
  USING (
    user_id = auth.uid() AND (SELECT get_my_role()) = 'solo'
  );

CREATE POLICY "Solo users can insert their personal records"
  ON personal_records FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND (SELECT get_my_role()) = 'solo'
  );

-- Solo users can manage client workout schedules
CREATE POLICY "Solo users can view their schedules"
  ON client_workout_schedules FOR SELECT
  USING (
    client_id = auth.uid() AND (SELECT get_my_role()) = 'solo'
  );

CREATE POLICY "Solo users can upsert their schedules"
  ON client_workout_schedules FOR INSERT
  WITH CHECK (
    client_id = auth.uid() AND (SELECT get_my_role()) = 'solo'
  );

CREATE POLICY "Solo users can update their schedules"
  ON client_workout_schedules FOR UPDATE
  USING (
    client_id = auth.uid() AND (SELECT get_my_role()) = 'solo'
  );

-- Solo users can insert agent activity logs (for AI program generation)
CREATE POLICY "Solo users can insert their agent logs"
  ON agent_activity_log FOR INSERT
  WITH CHECK (
    client_id = auth.uid() AND (SELECT get_my_role()) = 'solo'
  );
