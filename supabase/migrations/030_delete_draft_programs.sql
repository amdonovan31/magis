-- Delete all draft programs. CASCADE on workout_templates.program_id
-- and workout_template_exercises.workout_template_id handles child rows.
DELETE FROM public.programs WHERE status = 'draft';
