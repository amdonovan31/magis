-- ============================================================
-- Magis — Seed Data (run after schema.sql)
-- This seeds example exercises. Profiles are created via auth triggers.
-- ============================================================

-- NOTE: You'll need a real coach profile UUID to use created_by.
-- Replace 'YOUR_COACH_UUID' with your actual coach user ID after signup.

-- Example exercises (insert after creating a coach account)
-- insert into public.exercises (created_by, name, muscle_group, instructions) values
--   ('YOUR_COACH_UUID', 'Barbell Back Squat', 'Legs', 'Stand with bar on upper back...'),
--   ('YOUR_COACH_UUID', 'Bench Press', 'Chest', 'Lie on bench, grip bar...'),
--   ('YOUR_COACH_UUID', 'Deadlift', 'Back', 'Stand with feet hip-width...'),
--   ('YOUR_COACH_UUID', 'Pull-Up', 'Back', 'Hang from bar with overhand grip...'),
--   ('YOUR_COACH_UUID', 'Overhead Press', 'Shoulders', 'Stand with bar at shoulder height...'),
--   ('YOUR_COACH_UUID', 'Romanian Deadlift', 'Hamstrings', 'Hold bar at hip level...'),
--   ('YOUR_COACH_UUID', 'Dumbbell Row', 'Back', 'Place one hand on bench...'),
--   ('YOUR_COACH_UUID', 'Leg Press', 'Legs', 'Sit in leg press machine...'),
--   ('YOUR_COACH_UUID', 'Tricep Dip', 'Triceps', 'Support body on parallel bars...'),
--   ('YOUR_COACH_UUID', 'Bicep Curl', 'Biceps', 'Stand with dumbbells at sides...');
