-- Fix false positive date conflicts when shifting multiple workouts.
-- The old Phase 1c excluded only the single row being moved; now it
-- excludes ALL rows in the batch so swapping adjacent dates works.

CREATE OR REPLACE FUNCTION public.apply_program_edits(
  p_program_id uuid,
  p_exercise_updates jsonb DEFAULT '[]'::jsonb,
  p_exercise_swaps jsonb DEFAULT '[]'::jsonb,
  p_exercise_adds jsonb DEFAULT '[]'::jsonb,
  p_exercise_removes jsonb DEFAULT '[]'::jsonb,
  p_template_updates jsonb DEFAULT '[]'::jsonb,
  p_date_changes jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_remove record;
  v_log_count int;
  v_exercise_name text;
  v_swap record;
  v_add record;
  v_update record;
  v_tmpl record;
  v_date record;
  v_max_pos int;
  v_new_dates text[];
  v_dup text;
  v_conflict_id uuid;
  v_program_client_id uuid;
  v_moving_ids uuid[];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM programs
    WHERE id = p_program_id AND coach_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: you do not own this program';
  END IF;

  SELECT client_id INTO v_program_client_id
  FROM programs WHERE id = p_program_id;

  -- PHASE 1: VALIDATIONS

  -- 1a. Validate exercise removes
  FOR v_remove IN SELECT * FROM jsonb_array_elements_text(p_exercise_removes)
  LOOP
    SELECT count(*) INTO v_log_count
    FROM set_logs WHERE template_exercise_id = v_remove.value::uuid;
    IF v_log_count > 0 THEN
      SELECT e.name INTO v_exercise_name
      FROM workout_template_exercises wte
      JOIN exercises e ON e.id = wte.exercise_id
      WHERE wte.id = v_remove.value::uuid;
      RAISE EXCEPTION 'Cannot remove "%" — it has % logged set(s). Swap it instead.',
        COALESCE(v_exercise_name, 'Unknown'), v_log_count;
    END IF;
  END LOOP;

  -- 1b. Validate date changes — check intra-edit duplicates
  v_new_dates := ARRAY(
    SELECT dc->>'new_date' FROM jsonb_array_elements(p_date_changes) dc
  );
  SELECT d INTO v_dup FROM unnest(v_new_dates) d GROUP BY d HAVING count(*) > 1 LIMIT 1;
  IF v_dup IS NOT NULL THEN
    RAISE EXCEPTION 'Date conflict: multiple workouts scheduled for %', v_dup;
  END IF;

  -- 1c. Validate date changes — check database conflicts
  -- Exclude ALL rows being moved (not just the current one) from conflict detection
  v_moving_ids := ARRAY(
    SELECT (dc->>'scheduled_workout_id')::uuid FROM jsonb_array_elements(p_date_changes) dc
  );

  FOR v_date IN SELECT * FROM jsonb_array_elements(p_date_changes)
  LOOP
    SELECT id INTO v_conflict_id FROM scheduled_workouts
    WHERE client_id = v_program_client_id
      AND scheduled_date = (v_date.value->>'new_date')::date
      AND id != ALL(v_moving_ids)
    LIMIT 1;
    IF v_conflict_id IS NOT NULL THEN
      RAISE EXCEPTION 'Date conflict: another workout is already scheduled for %',
        v_date.value->>'new_date';
    END IF;
  END LOOP;

  -- PHASE 2: APPLY WRITES

  -- Template updates (title, notes, scheduled_days, cardio fields)
  FOR v_tmpl IN SELECT * FROM jsonb_array_elements(p_template_updates)
  LOOP
    UPDATE workout_templates SET
      title = COALESCE(v_tmpl.value->>'title', title),
      notes = CASE WHEN v_tmpl.value ? 'notes' THEN v_tmpl.value->>'notes' ELSE notes END,
      scheduled_days = CASE
        WHEN v_tmpl.value ? 'scheduled_days' THEN
          ARRAY(SELECT jsonb_array_elements_text(v_tmpl.value->'scheduled_days'))::int[]
        ELSE scheduled_days
      END,
      cardio_modality = CASE WHEN v_tmpl.value ? 'cardio_modality' THEN v_tmpl.value->>'cardio_modality' ELSE cardio_modality END,
      cardio_duration_minutes = CASE WHEN v_tmpl.value ? 'cardio_duration_minutes' THEN (v_tmpl.value->>'cardio_duration_minutes')::int ELSE cardio_duration_minutes END,
      cardio_distance_target = CASE WHEN v_tmpl.value ? 'cardio_distance_target' THEN (v_tmpl.value->>'cardio_distance_target')::numeric ELSE cardio_distance_target END,
      cardio_distance_unit = CASE WHEN v_tmpl.value ? 'cardio_distance_unit' THEN v_tmpl.value->>'cardio_distance_unit' ELSE cardio_distance_unit END,
      cardio_hr_zone = CASE WHEN v_tmpl.value ? 'cardio_hr_zone' THEN (v_tmpl.value->>'cardio_hr_zone')::int ELSE cardio_hr_zone END,
      cardio_notes = CASE WHEN v_tmpl.value ? 'cardio_notes' THEN v_tmpl.value->>'cardio_notes' ELSE cardio_notes END
    WHERE id = (v_tmpl.value->>'id')::uuid;
  END LOOP;

  -- Exercise removes
  FOR v_remove IN SELECT * FROM jsonb_array_elements_text(p_exercise_removes)
  LOOP
    DELETE FROM workout_template_exercises WHERE id = v_remove.value::uuid;
  END LOOP;
  FOR v_remove IN
    SELECT DISTINCT wte.workout_template_id
    FROM jsonb_array_elements_text(p_exercise_removes) r
    JOIN workout_template_exercises wte ON wte.id = r.value::uuid
  LOOP
    NULL;
  END LOOP;

  -- Exercise swaps
  FOR v_swap IN SELECT * FROM jsonb_array_elements(p_exercise_swaps)
  LOOP
    UPDATE workout_template_exercises
    SET exercise_id = (v_swap.value->>'new_exercise_id')::uuid
    WHERE id = (v_swap.value->>'id')::uuid;
  END LOOP;

  -- Exercise adds
  FOR v_add IN SELECT * FROM jsonb_array_elements(p_exercise_adds)
  LOOP
    SELECT COALESCE(max(position), 0) INTO v_max_pos
    FROM workout_template_exercises
    WHERE workout_template_id = (v_add.value->>'workout_template_id')::uuid;
    INSERT INTO workout_template_exercises (
      workout_template_id, exercise_id, position,
      prescribed_sets, prescribed_reps, rest_seconds
    ) VALUES (
      (v_add.value->>'workout_template_id')::uuid,
      (v_add.value->>'exercise_id')::uuid,
      v_max_pos + 1,
      COALESCE((v_add.value->>'prescribed_sets')::int, 3),
      COALESCE(v_add.value->>'prescribed_reps', '8-12'),
      COALESCE((v_add.value->>'rest_seconds')::int, 90)
    );
  END LOOP;

  -- Exercise field updates
  FOR v_update IN SELECT * FROM jsonb_array_elements(p_exercise_updates)
  LOOP
    UPDATE workout_template_exercises SET
      prescribed_sets = COALESCE((v_update.value->>'prescribed_sets')::int, prescribed_sets),
      prescribed_reps = COALESCE(v_update.value->>'prescribed_reps', prescribed_reps),
      prescribed_weight = CASE
        WHEN v_update.value ? 'prescribed_weight' THEN v_update.value->>'prescribed_weight'
        ELSE prescribed_weight
      END,
      rest_seconds = COALESCE((v_update.value->>'rest_seconds')::int, rest_seconds)
    WHERE id = (v_update.value->>'id')::uuid;
  END LOOP;

  -- Date changes
  FOR v_date IN SELECT * FROM jsonb_array_elements(p_date_changes)
  LOOP
    UPDATE scheduled_workouts
    SET scheduled_date = (v_date.value->>'new_date')::date
    WHERE id = (v_date.value->>'scheduled_workout_id')::uuid;
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;
