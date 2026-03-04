-- ============================================================
-- Migration 005: Exercise Library — schema additions + 150 seed exercises
-- Adds movement_pattern, difficulty, is_custom columns.
-- Seeds 150 exercises with proper tagging for AI program generation.
-- ============================================================

-- -------------------------------------------------------
-- 1. Add new columns to exercises table
-- -------------------------------------------------------
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS movement_pattern text,
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'intermediate'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.exercises.movement_pattern IS 'Movement category: push, pull, hinge, squat, lunge, carry, rotation, isolation, compound, plyometric';
COMMENT ON COLUMN public.exercises.difficulty IS 'beginner, intermediate, or advanced';
COMMENT ON COLUMN public.exercises.is_custom IS 'false = seeded library exercise, true = user-created';

-- -------------------------------------------------------
-- 2. Create a system profile for seeded exercises
--    (needed to satisfy the FK on exercises.created_by)
-- -------------------------------------------------------
-- Clean up any previous system user attempt (the trigger may have
-- created a profile with an invalid role like 'system').
DELETE FROM public.exercises WHERE created_by = '00000000-0000-0000-0000-000000000000';
DELETE FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000000';
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000';

-- Re-create the system user with role=coach so the handle_new_user
-- trigger creates a valid profile row.
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'system@magis.app',
  '',
  '{"provider":"email","providers":["email"],"role":"coach"}'::jsonb,
  '{"full_name":"Magis System","role":"coach"}'::jsonb,
  now(),
  now()
);

-- The trigger should have created the profile, but update it to
-- ensure onboarding_complete is set.
UPDATE public.profiles
  SET onboarding_complete = true
  WHERE id = '00000000-0000-0000-0000-000000000000';

-- Delete any previously seeded exercises so this migration is idempotent
DELETE FROM public.exercises
  WHERE created_by = '00000000-0000-0000-0000-000000000000';

-- -------------------------------------------------------
-- 3. Seed 150 exercises
--    created_by uses a system UUID that doesn't map to a
--    real user. RLS SELECT policies already allow coaches
--    to see exercises they created; we add a policy below
--    so everyone can see seeded exercises.
-- -------------------------------------------------------

INSERT INTO public.exercises
  (created_by, name, muscle_group, secondary_muscles, equipment, movement_pattern, difficulty, instructions, is_custom, is_archived)
VALUES

-- ============================================================
-- CHEST (14 exercises)
-- ============================================================
('00000000-0000-0000-0000-000000000000', 'Barbell Bench Press', 'Chest', ARRAY['Triceps','Shoulders'], 'Barbell', 'push', 'beginner', 'Lie on a flat bench, grip the bar slightly wider than shoulder-width. Lower to mid-chest with elbows at ~45 degrees, then press to lockout. Keep your feet flat, shoulder blades retracted, and maintain a slight arch.', false, false),
('00000000-0000-0000-0000-000000000000', 'Incline Barbell Bench Press', 'Chest', ARRAY['Shoulders','Triceps'], 'Barbell', 'push', 'intermediate', 'Set the bench to 30-45 degrees. Unrack and lower the bar to your upper chest, then press up. Keep shoulder blades pinched together throughout the lift.', false, false),
('00000000-0000-0000-0000-000000000000', 'Dumbbell Bench Press', 'Chest', ARRAY['Triceps','Shoulders'], 'Dumbbell', 'push', 'beginner', 'Lie flat with a dumbbell in each hand at chest level, palms forward. Press up until arms are extended, then lower with control. Allow a deeper stretch than the barbell variation.', false, false),
('00000000-0000-0000-0000-000000000000', 'Incline Dumbbell Press', 'Chest', ARRAY['Shoulders','Triceps'], 'Dumbbell', 'push', 'beginner', 'Set the bench to 30-45 degrees. Press the dumbbells from shoulder height to overhead, squeezing the chest at the top. Lower slowly to emphasise the upper pec stretch.', false, false),
('00000000-0000-0000-0000-000000000000', 'Dumbbell Flye', 'Chest', ARRAY['Shoulders'], 'Dumbbell', 'isolation', 'beginner', 'Lie flat and hold dumbbells above your chest with a slight elbow bend. Open your arms in an arc until you feel a stretch across the chest, then squeeze them back together.', false, false),
('00000000-0000-0000-0000-000000000000', 'Incline Dumbbell Flye', 'Chest', ARRAY['Shoulders'], 'Dumbbell', 'isolation', 'intermediate', 'Set the bench to 30-45 degrees. Perform flyes with a slight elbow bend, lowering the dumbbells until your upper chest stretches, then squeeze together at the top.', false, false),
('00000000-0000-0000-0000-000000000000', 'Cable Crossover', 'Chest', ARRAY['Shoulders'], 'Cable', 'isolation', 'intermediate', 'Set both pulleys high. Step forward and bring the handles together in front of your chest with a slight elbow bend. Squeeze the chest at the bottom of the arc.', false, false),
('00000000-0000-0000-0000-000000000000', 'Low Cable Flye', 'Chest', ARRAY['Shoulders'], 'Cable', 'isolation', 'intermediate', 'Set both pulleys low. Bring the handles upward and together at upper-chest height with a slight elbow bend. Focus on squeezing the upper pec fibres.', false, false),
('00000000-0000-0000-0000-000000000000', 'Machine Chest Press', 'Chest', ARRAY['Triceps','Shoulders'], 'Machine', 'push', 'beginner', 'Sit in the machine with handles at chest height. Press forward to full extension without locking out. Control the return to feel the stretch across the chest.', false, false),
('00000000-0000-0000-0000-000000000000', 'Pec Deck', 'Chest', ARRAY['Shoulders'], 'Machine', 'isolation', 'beginner', 'Sit upright and place your forearms against the pads. Squeeze the pads together in front of your chest, pause, then return slowly. Keep your back flat against the seat.', false, false),
('00000000-0000-0000-0000-000000000000', 'Push-Up', 'Chest', ARRAY['Triceps','Shoulders','Core'], 'Bodyweight', 'push', 'beginner', 'Place hands shoulder-width apart. Lower your body as one unit until your chest nearly touches the floor. Press back up, keeping your core tight and elbows at ~45 degrees.', false, false),
('00000000-0000-0000-0000-000000000000', 'Dip (Chest)', 'Chest', ARRAY['Triceps','Shoulders'], 'Bodyweight', 'push', 'intermediate', 'Use parallel bars. Lean your torso forward ~30 degrees. Lower until you feel a stretch across the chest, then press back up. Keep elbows flared slightly outward.', false, false),
('00000000-0000-0000-0000-000000000000', 'Decline Barbell Bench Press', 'Chest', ARRAY['Triceps','Shoulders'], 'Barbell', 'push', 'intermediate', 'Lie on a decline bench. Unrack and lower the bar to your lower chest, then press up. The decline angle targets the lower chest fibres.', false, false),
('00000000-0000-0000-0000-000000000000', 'Landmine Press', 'Chest', ARRAY['Shoulders','Triceps'], 'Barbell', 'push', 'intermediate', 'Kneel or stand, gripping the end of a landmine barbell. Press upward and forward in an arc. The angled path is easier on the shoulders than a strict overhead press.', false, false),

-- ============================================================
-- BACK (16 exercises)
-- ============================================================
('00000000-0000-0000-0000-000000000000', 'Conventional Deadlift', 'Back', ARRAY['Glutes','Hamstrings','Core'], 'Barbell', 'hinge', 'intermediate', 'Stand hip-width, shins touching the bar. Hinge at the hips, grip just outside the knees, brace your core and drive through the floor. Lock out at the top with hips and knees simultaneously.', false, false),
('00000000-0000-0000-0000-000000000000', 'Barbell Bent-Over Row', 'Back', ARRAY['Biceps','Shoulders'], 'Barbell', 'pull', 'intermediate', 'Hinge forward to ~45 degrees. Pull the bar to your lower ribcage, squeezing the shoulder blades together. Lower under control. Keep the back flat throughout.', false, false),
('00000000-0000-0000-0000-000000000000', 'Pendlay Row', 'Back', ARRAY['Biceps','Shoulders'], 'Barbell', 'pull', 'advanced', 'Torso parallel to the floor, bar resting on the ground each rep. Explosively row to the lower chest, then lower back to the floor. Reset your brace between reps.', false, false),
('00000000-0000-0000-0000-000000000000', 'Pull-Up', 'Back', ARRAY['Biceps','Shoulders'], 'Bodyweight', 'pull', 'intermediate', 'Hang with an overhand grip, hands just outside shoulder-width. Pull your chin above the bar by driving elbows down and back. Lower with control to a dead hang.', false, false),
('00000000-0000-0000-0000-000000000000', 'Chin-Up', 'Back', ARRAY['Biceps'], 'Bodyweight', 'pull', 'intermediate', 'Hang with an underhand shoulder-width grip. Pull your chin above the bar, emphasising bicep engagement. Lower fully between reps for a complete lat stretch.', false, false),
('00000000-0000-0000-0000-000000000000', 'Lat Pulldown', 'Back', ARRAY['Biceps','Shoulders'], 'Cable', 'pull', 'beginner', 'Sit with thighs secured under the pad. Pull the wide bar to your upper chest, leading with your elbows. Squeeze shoulder blades together, then extend fully at the top.', false, false),
('00000000-0000-0000-0000-000000000000', 'Close-Grip Lat Pulldown', 'Back', ARRAY['Biceps'], 'Cable', 'pull', 'beginner', 'Use a V-handle or close-grip attachment. Pull to your chest, focusing on a full lat stretch at the top and a hard squeeze at the bottom.', false, false),
('00000000-0000-0000-0000-000000000000', 'Seated Cable Row', 'Back', ARRAY['Biceps','Shoulders'], 'Cable', 'pull', 'beginner', 'Sit upright with feet on the platform. Pull the handle to your midsection while retracting your shoulder blades. Extend arms fully forward to stretch the lats.', false, false),
('00000000-0000-0000-0000-000000000000', 'Single-Arm Dumbbell Row', 'Back', ARRAY['Biceps','Shoulders'], 'Dumbbell', 'pull', 'beginner', 'Place one hand and knee on a bench. Row the dumbbell to your hip, leading with the elbow. Keep your torso stable and avoid rotating your hips.', false, false),
('00000000-0000-0000-0000-000000000000', 'Chest-Supported Dumbbell Row', 'Back', ARRAY['Biceps','Shoulders'], 'Dumbbell', 'pull', 'beginner', 'Lie face-down on an incline bench set to ~30 degrees. Row dumbbells to your sides, squeezing shoulder blades together. This removes momentum entirely.', false, false),
('00000000-0000-0000-0000-000000000000', 'T-Bar Row', 'Back', ARRAY['Biceps','Shoulders'], 'Barbell', 'pull', 'intermediate', 'Straddle a landmine bar with a V-handle attachment. Row toward your chest with a flat back, squeezing at the top. Lower with control.', false, false),
('00000000-0000-0000-0000-000000000000', 'Straight-Arm Pulldown', 'Back', ARRAY['Core'], 'Cable', 'isolation', 'beginner', 'Stand facing a high pulley with a straight bar. Keep arms straight and pull the bar to your thighs using only your lats. Control the return to shoulder height.', false, false),
('00000000-0000-0000-0000-000000000000', 'Machine Row', 'Back', ARRAY['Biceps','Shoulders'], 'Machine', 'pull', 'beginner', 'Sit in the machine with your chest braced against the pad. Pull the handles to your midsection, squeezing the shoulder blades. Return under control.', false, false),
('00000000-0000-0000-0000-000000000000', 'Trap Bar Deadlift', 'Back', ARRAY['Glutes','Hamstrings','Quads'], 'Barbell', 'hinge', 'beginner', 'Stand inside the trap bar, grip the high or low handles. Brace your core and drive through the floor to stand up. Keep a neutral spine throughout.', false, false),
('00000000-0000-0000-0000-000000000000', 'Inverted Row', 'Back', ARRAY['Biceps','Core'], 'Bodyweight', 'pull', 'beginner', 'Set a barbell at hip height in a rack. Hang underneath with an overhand grip, body straight. Pull your chest to the bar, then lower with control.', false, false),
('00000000-0000-0000-0000-000000000000', 'Face Pull', 'Back', ARRAY['Shoulders','Biceps'], 'Cable', 'pull', 'beginner', 'Set a cable at face height with a rope. Pull toward your face, separating the rope ends and externally rotating your shoulders. Squeeze rear delts hard at the end.', false, false),

-- ============================================================
-- SHOULDERS (14 exercises)
-- ============================================================
('00000000-0000-0000-0000-000000000000', 'Overhead Press', 'Shoulders', ARRAY['Triceps','Core'], 'Barbell', 'push', 'intermediate', 'Stand with feet shoulder-width. Press the barbell from your front delts overhead to lockout. Keep your core tight and avoid excessive back lean.', false, false),
('00000000-0000-0000-0000-000000000000', 'Seated Dumbbell Shoulder Press', 'Shoulders', ARRAY['Triceps'], 'Dumbbell', 'push', 'beginner', 'Sit on an upright bench with dumbbells at shoulder height, palms forward. Press to overhead lockout. Lower to ear level under control.', false, false),
('00000000-0000-0000-0000-000000000000', 'Arnold Press', 'Shoulders', ARRAY['Triceps','Chest'], 'Dumbbell', 'push', 'intermediate', 'Start with palms facing you at chin height. Rotate outward as you press overhead. Reverse the rotation on the way down. This hits all three delt heads.', false, false),
('00000000-0000-0000-0000-000000000000', 'Dumbbell Lateral Raise', 'Shoulders', ARRAY['Traps'], 'Dumbbell', 'isolation', 'beginner', 'Stand with dumbbells at your sides. Raise them out to the sides until arms are parallel to the floor, leading with your elbows. Lower slowly.', false, false),
('00000000-0000-0000-0000-000000000000', 'Cable Lateral Raise', 'Shoulders', ARRAY['Traps'], 'Cable', 'isolation', 'beginner', 'Stand beside a low pulley. Raise the handle out to the side to shoulder height, keeping a slight bend in the elbow. Constant cable tension is the advantage.', false, false),
('00000000-0000-0000-0000-000000000000', 'Dumbbell Front Raise', 'Shoulders', ARRAY['Chest'], 'Dumbbell', 'isolation', 'beginner', 'Stand holding dumbbells in front of your thighs. Raise one or both to shoulder height with straight arms. Lower under control. Avoid swinging.', false, false),
('00000000-0000-0000-0000-000000000000', 'Rear Delt Flye', 'Shoulders', ARRAY['Traps','Back'], 'Dumbbell', 'isolation', 'beginner', 'Hinge forward at the hips with dumbbells hanging below. Raise out to the sides by squeezing your rear delts. Pause at the top and lower slowly.', false, false),
('00000000-0000-0000-0000-000000000000', 'Reverse Pec Deck', 'Shoulders', ARRAY['Traps','Back'], 'Machine', 'isolation', 'beginner', 'Sit facing the pec deck pad. Grip the handles and open your arms to squeeze your rear delts. Keep a slight bend in the elbows throughout.', false, false),
('00000000-0000-0000-0000-000000000000', 'Machine Shoulder Press', 'Shoulders', ARRAY['Triceps'], 'Machine', 'push', 'beginner', 'Sit in the machine with handles at shoulder height. Press overhead to full extension. Lower with control. Good for beginners building pressing strength.', false, false),
('00000000-0000-0000-0000-000000000000', 'Barbell Upright Row', 'Shoulders', ARRAY['Traps','Biceps'], 'Barbell', 'pull', 'intermediate', 'Stand holding a barbell with a shoulder-width grip. Pull straight up along your body to collarbone height, leading with elbows. Avoid going above shoulder height.', false, false),
('00000000-0000-0000-0000-000000000000', 'Dumbbell Shrug', 'Shoulders', ARRAY['Traps'], 'Dumbbell', 'isolation', 'beginner', 'Stand holding heavy dumbbells at your sides. Shrug your shoulders straight up toward your ears. Pause at the top, then lower slowly. Avoid rolling.', false, false),
('00000000-0000-0000-0000-000000000000', 'Band Pull-Apart', 'Shoulders', ARRAY['Back','Traps'], 'Resistance Band', 'isolation', 'beginner', 'Hold a band at arm''s length in front of you, hands shoulder-width. Pull the band apart by squeezing your shoulder blades together. Control the return.', false, false),
('00000000-0000-0000-0000-000000000000', 'Handstand Push-Up', 'Shoulders', ARRAY['Triceps','Core'], 'Bodyweight', 'push', 'advanced', 'Kick up into a handstand against a wall. Lower your head toward the floor by bending your elbows, then press back up. Keep your core tight and body straight.', false, false),
('00000000-0000-0000-0000-000000000000', 'Kettlebell Halo', 'Shoulders', ARRAY['Core','Traps'], 'Kettlebell', 'rotation', 'beginner', 'Hold a kettlebell by the horns at chest height. Circle it around your head, alternating directions. Keep your core braced and head still throughout.', false, false),

-- ============================================================
-- BICEPS (10 exercises)
-- ============================================================
('00000000-0000-0000-0000-000000000000', 'Barbell Curl', 'Biceps', ARRAY['Forearms'], 'Barbell', 'isolation', 'beginner', 'Stand with feet shoulder-width. Curl the barbell from hip level to shoulder height, keeping elbows pinned to your sides. Lower under control without swinging.', false, false),
('00000000-0000-0000-0000-000000000000', 'Dumbbell Curl', 'Biceps', ARRAY['Forearms'], 'Dumbbell', 'isolation', 'beginner', 'Stand with dumbbells at your sides, palms forward. Curl to shoulder height, keeping elbows stationary. You can alternate or curl both simultaneously.', false, false),
('00000000-0000-0000-0000-000000000000', 'Hammer Curl', 'Biceps', ARRAY['Forearms'], 'Dumbbell', 'isolation', 'beginner', 'Curl dumbbells with palms facing each other (neutral grip). This targets the brachialis and brachioradialis in addition to the biceps. Keep elbows still.', false, false),
('00000000-0000-0000-0000-000000000000', 'Incline Dumbbell Curl', 'Biceps', ARRAY['Forearms'], 'Dumbbell', 'isolation', 'intermediate', 'Sit on a bench set to 45-60 degrees. Let dumbbells hang with arms fully extended. Curl up while keeping upper arms perpendicular to the floor. The stretch is the key.', false, false),
('00000000-0000-0000-0000-000000000000', 'Preacher Curl', 'Biceps', ARRAY['Forearms'], 'Barbell', 'isolation', 'intermediate', 'Drape your upper arms over the preacher pad. Curl the bar up, pausing at the top. Lower all the way down slowly. The pad prevents cheating.', false, false),
('00000000-0000-0000-0000-000000000000', 'Cable Curl', 'Biceps', ARRAY['Forearms'], 'Cable', 'isolation', 'beginner', 'Stand facing a low pulley with a straight or EZ-bar attachment. Curl to shoulder height. Cable provides constant tension through the full range of motion.', false, false),
('00000000-0000-0000-0000-000000000000', 'Concentration Curl', 'Biceps', ARRAY['Forearms'], 'Dumbbell', 'isolation', 'beginner', 'Sit on a bench, brace your elbow against your inner thigh. Curl the dumbbell to your shoulder, squeezing at the top. This isolates the biceps completely.', false, false),
('00000000-0000-0000-0000-000000000000', 'Spider Curl', 'Biceps', ARRAY['Forearms'], 'Dumbbell', 'isolation', 'intermediate', 'Lie face-down on an incline bench with arms hanging straight. Curl the dumbbells up, fighting gravity the entire way. Peak contraction is intense at the top.', false, false),
('00000000-0000-0000-0000-000000000000', 'Cable Rope Hammer Curl', 'Biceps', ARRAY['Forearms'], 'Cable', 'isolation', 'beginner', 'Attach a rope to a low pulley. Curl with a neutral grip, squeezing the brachialis at the top. The cable keeps tension on during the entire rep.', false, false),
('00000000-0000-0000-0000-000000000000', 'Resistance Band Curl', 'Biceps', ARRAY['Forearms'], 'Resistance Band', 'isolation', 'beginner', 'Stand on a resistance band, grip the ends with palms up. Curl toward your shoulders. Band resistance increases at the top where biceps are strongest.', false, false),

-- ============================================================
-- TRICEPS (10 exercises)
-- ============================================================
('00000000-0000-0000-0000-000000000000', 'Close-Grip Bench Press', 'Triceps', ARRAY['Chest','Shoulders'], 'Barbell', 'push', 'intermediate', 'Lie flat with hands shoulder-width apart on the bar. Lower to the chest keeping elbows tucked close to your body, then press up. Focus on tricep contraction at lockout.', false, false),
('00000000-0000-0000-0000-000000000000', 'Tricep Pushdown', 'Triceps', ARRAY[]::text[], 'Cable', 'isolation', 'beginner', 'Stand facing a high pulley with a straight bar attachment. Push the bar down by extending your elbows fully. Keep upper arms pinned to your sides throughout.', false, false),
('00000000-0000-0000-0000-000000000000', 'Rope Pushdown', 'Triceps', ARRAY[]::text[], 'Cable', 'isolation', 'beginner', 'Attach a rope to a high pulley. Push down and spread the rope ends apart at the bottom for peak contraction. Keep elbows locked at your sides.', false, false),
('00000000-0000-0000-0000-000000000000', 'Overhead Tricep Extension', 'Triceps', ARRAY[]::text[], 'Dumbbell', 'isolation', 'beginner', 'Hold a dumbbell overhead with both hands. Lower it behind your head by bending your elbows to ~90 degrees, then extend back up. Keep upper arms vertical.', false, false),
('00000000-0000-0000-0000-000000000000', 'Skull Crusher', 'Triceps', ARRAY[]::text[], 'Barbell', 'isolation', 'intermediate', 'Lie flat holding an EZ bar with arms extended above your chest. Lower toward your forehead by bending only at the elbows, then extend back up. Keep upper arms still.', false, false),
('00000000-0000-0000-0000-000000000000', 'Dumbbell Kickback', 'Triceps', ARRAY[]::text[], 'Dumbbell', 'isolation', 'beginner', 'Hinge forward with one hand on a bench. Pin your elbow at your side and extend the dumbbell back until your arm is fully straight. Squeeze at the top.', false, false),
('00000000-0000-0000-0000-000000000000', 'Diamond Push-Up', 'Triceps', ARRAY['Chest','Shoulders'], 'Bodyweight', 'push', 'intermediate', 'Place your hands close together under your chest, forming a diamond shape. Perform push-ups, keeping elbows close to your body. This maximises tricep activation.', false, false),
('00000000-0000-0000-0000-000000000000', 'Cable Overhead Tricep Extension', 'Triceps', ARRAY[]::text[], 'Cable', 'isolation', 'intermediate', 'Face away from a low pulley, grip the rope overhead. Step forward and extend your arms overhead by straightening the elbows. Constant cable tension is the advantage.', false, false),
('00000000-0000-0000-0000-000000000000', 'Bench Dip', 'Triceps', ARRAY['Shoulders','Chest'], 'Bodyweight', 'push', 'beginner', 'Place hands on a bench behind you, legs extended. Lower your body by bending elbows to ~90 degrees, then press back up. Keep your back close to the bench.', false, false),
('00000000-0000-0000-0000-000000000000', 'Dip (Tricep)', 'Triceps', ARRAY['Chest','Shoulders'], 'Bodyweight', 'push', 'intermediate', 'Use parallel bars with an upright torso. Lower until elbows reach ~90 degrees, then press back up. Keeping your torso vertical shifts emphasis to the triceps.', false, false),

-- ============================================================
-- FOREARMS (4 exercises)
-- ============================================================
('00000000-0000-0000-0000-000000000000', 'Barbell Wrist Curl', 'Forearms', ARRAY[]::text[], 'Barbell', 'isolation', 'beginner', 'Sit with forearms resting on your thighs, palms up, wrists over the edge. Curl the barbell up by flexing your wrists. Lower slowly for a full stretch.', false, false),
('00000000-0000-0000-0000-000000000000', 'Reverse Barbell Wrist Curl', 'Forearms', ARRAY[]::text[], 'Barbell', 'isolation', 'beginner', 'Same position but palms facing down. Extend your wrists upward against the barbell. This targets the wrist extensors on the top of the forearm.', false, false),
('00000000-0000-0000-0000-000000000000', 'Farmer''s Carry', 'Forearms', ARRAY['Core','Traps'], 'Dumbbell', 'carry', 'beginner', 'Hold heavy dumbbells at your sides with a firm grip. Walk with upright posture for distance or time. Grip endurance and core stability are the primary challenges.', false, false),
('00000000-0000-0000-0000-000000000000', 'Plate Pinch Hold', 'Forearms', ARRAY[]::text[], 'Barbell', 'isolation', 'intermediate', 'Pinch two weight plates together smooth-side-out. Hold for as long as possible. This builds crushing grip strength in the fingers and thumb.', false, false),

-- ============================================================
-- QUADS (14 exercises)
-- ============================================================
('00000000-0000-0000-0000-000000000000', 'Barbell Back Squat', 'Quads', ARRAY['Glutes','Core','Hamstrings'], 'Barbell', 'squat', 'intermediate', 'Place the bar on your upper traps. Brace your core, push your hips back and squat until thighs are at least parallel. Drive through the whole foot to stand.', false, false),
('00000000-0000-0000-0000-000000000000', 'Barbell Front Squat', 'Quads', ARRAY['Core','Glutes'], 'Barbell', 'squat', 'intermediate', 'Rest the bar in a front rack on your front delts. Keep elbows high, squat to depth with an upright torso, then stand. Demands good mobility.', false, false),
('00000000-0000-0000-0000-000000000000', 'Goblet Squat', 'Quads', ARRAY['Core','Glutes'], 'Dumbbell', 'squat', 'beginner', 'Hold a dumbbell vertically at your chest. Squat between your legs with an upright torso, elbows inside your knees. Great for learning squat mechanics.', false, false),
('00000000-0000-0000-0000-000000000000', 'Leg Press', 'Quads', ARRAY['Glutes','Hamstrings'], 'Machine', 'squat', 'beginner', 'Sit with your back flat against the pad. Place feet shoulder-width on the platform. Press until legs extend without locking the knees. Lower with control.', false, false),
('00000000-0000-0000-0000-000000000000', 'Hack Squat', 'Quads', ARRAY['Glutes'], 'Machine', 'squat', 'intermediate', 'Stand in the machine with back against the pad and shoulders under the pads. Squat down, keeping knees tracking over toes, then drive back up.', false, false),
('00000000-0000-0000-0000-000000000000', 'Bulgarian Split Squat', 'Quads', ARRAY['Glutes','Core'], 'Dumbbell', 'lunge', 'intermediate', 'Elevate your rear foot on a bench. Hold dumbbells and squat down on the front leg until the thigh is parallel. Drive through the front heel to stand.', false, false),
('00000000-0000-0000-0000-000000000000', 'Walking Lunge', 'Quads', ARRAY['Glutes','Core'], 'Dumbbell', 'lunge', 'beginner', 'Hold dumbbells at your sides. Step forward into a lunge until both knees reach ~90 degrees, then step through into the next lunge. Keep your torso upright.', false, false),
('00000000-0000-0000-0000-000000000000', 'Reverse Lunge', 'Quads', ARRAY['Glutes','Core'], 'Dumbbell', 'lunge', 'beginner', 'Hold dumbbells at your sides. Step backward, lowering your rear knee toward the floor. Drive through the front foot to return to standing. Easier on the knees than forward lunges.', false, false),
('00000000-0000-0000-0000-000000000000', 'Step-Up', 'Quads', ARRAY['Glutes','Core'], 'Dumbbell', 'lunge', 'beginner', 'Hold dumbbells and step onto a knee-height box. Drive through the lead heel to stand fully on top. Step down with control. Minimise push-off from the trailing leg.', false, false),
('00000000-0000-0000-0000-000000000000', 'Leg Extension', 'Quads', ARRAY[]::text[], 'Machine', 'isolation', 'beginner', 'Sit in the machine with the pad on your shins. Extend your legs fully by straightening your knees. Squeeze the quads at the top and lower slowly.', false, false),
('00000000-0000-0000-0000-000000000000', 'Sissy Squat', 'Quads', ARRAY['Core'], 'Bodyweight', 'squat', 'advanced', 'Hold a support for balance. Lean back and bend your knees, keeping your hips extended and torso in line with your thighs. Rise by contracting the quads hard.', false, false),
('00000000-0000-0000-0000-000000000000', 'Pistol Squat', 'Quads', ARRAY['Glutes','Core'], 'Bodyweight', 'squat', 'advanced', 'Stand on one leg, extend the other in front. Squat all the way down under control, then stand back up. Requires significant strength and balance.', false, false),
('00000000-0000-0000-0000-000000000000', 'Kettlebell Goblet Squat', 'Quads', ARRAY['Core','Glutes'], 'Kettlebell', 'squat', 'beginner', 'Hold a kettlebell by the horns at your chest. Squat between your legs keeping an upright torso. The offset load forces good posture naturally.', false, false),
('00000000-0000-0000-0000-000000000000', 'Spanish Squat', 'Quads', ARRAY['Core'], 'Resistance Band', 'squat', 'intermediate', 'Loop a band behind your knees anchored to a post. Lean back and squat with an upright torso. The band pulls you forward, shifting all load to the quads.', false, false),

-- ============================================================
-- HAMSTRINGS (12 exercises)
-- ============================================================
('00000000-0000-0000-0000-000000000000', 'Romanian Deadlift', 'Hamstrings', ARRAY['Glutes','Back'], 'Barbell', 'hinge', 'intermediate', 'Hold the bar at hip height. Push hips back with a slight knee bend, lowering until you feel a deep hamstring stretch. Drive hips forward to stand. Keep the bar close to your legs.', false, false),
('00000000-0000-0000-0000-000000000000', 'Stiff-Leg Deadlift', 'Hamstrings', ARRAY['Glutes','Back'], 'Barbell', 'hinge', 'intermediate', 'Keep legs nearly straight (soft knees). Hinge at the hips to lower the bar, stretching the hamstrings fully. Stand by driving hips forward. Slower descent than RDL.', false, false),
('00000000-0000-0000-0000-000000000000', 'Dumbbell Romanian Deadlift', 'Hamstrings', ARRAY['Glutes','Back'], 'Dumbbell', 'hinge', 'beginner', 'Hold dumbbells in front of your thighs. Push hips back, sliding the dumbbells along your legs until you feel a hamstring stretch. Drive hips forward to return.', false, false),
('00000000-0000-0000-0000-000000000000', 'Single-Leg Romanian Deadlift', 'Hamstrings', ARRAY['Glutes','Core'], 'Dumbbell', 'hinge', 'intermediate', 'Stand on one leg holding a dumbbell. Hinge forward, extending the free leg behind you for balance. Return to standing by contracting the glute and hamstring.', false, false),
('00000000-0000-0000-0000-000000000000', 'Lying Leg Curl', 'Hamstrings', ARRAY['Calves'], 'Machine', 'isolation', 'beginner', 'Lie face-down with the pad above your ankles. Curl toward your glutes by bending your knees. Squeeze at the top and lower slowly. Don''t let hips rise off the pad.', false, false),
('00000000-0000-0000-0000-000000000000', 'Seated Leg Curl', 'Hamstrings', ARRAY['Calves'], 'Machine', 'isolation', 'beginner', 'Sit with the pad on your lower calves and thighs secured. Curl your legs underneath you, squeezing the hamstrings. Extend slowly back to start.', false, false),
('00000000-0000-0000-0000-000000000000', 'Nordic Hamstring Curl', 'Hamstrings', ARRAY['Calves','Glutes'], 'Bodyweight', 'isolation', 'advanced', 'Kneel with ankles secured. Slowly lower your torso toward the floor, resisting with your hamstrings. Use your hands to catch yourself, then pull back up.', false, false),
('00000000-0000-0000-0000-000000000000', 'Good Morning', 'Hamstrings', ARRAY['Glutes','Back'], 'Barbell', 'hinge', 'intermediate', 'Place a barbell on your upper back. Hinge forward at the hips with a slight knee bend until your torso is near parallel. Return upright by driving hips forward.', false, false),
('00000000-0000-0000-0000-000000000000', 'Glute-Ham Raise', 'Hamstrings', ARRAY['Glutes','Calves'], 'Machine', 'isolation', 'advanced', 'Lock feet in a GHD. Start with torso upright, lower by extending at the knees (not hips), then pull back up using hamstrings. Extremely demanding.', false, false),
('00000000-0000-0000-0000-000000000000', 'Kettlebell Swing', 'Hamstrings', ARRAY['Glutes','Core'], 'Kettlebell', 'hinge', 'beginner', 'Hinge at the hips and swing the kettlebell between your legs. Drive hips explosively forward to propel it to chest height. Arms are just along for the ride.', false, false),
('00000000-0000-0000-0000-000000000000', 'Cable Pull-Through', 'Hamstrings', ARRAY['Glutes'], 'Cable', 'hinge', 'beginner', 'Face away from a low cable with a rope between your legs. Hinge forward, then drive hips forward to stand tall. Squeeze glutes and hamstrings at the top.', false, false),
('00000000-0000-0000-0000-000000000000', 'Resistance Band Good Morning', 'Hamstrings', ARRAY['Glutes','Back'], 'Resistance Band', 'hinge', 'beginner', 'Stand on a band with it looped behind your neck. Hinge forward with a flat back, then stand by driving hips forward. Band tension increases at the top.', false, false),

-- ============================================================
-- GLUTES (12 exercises)
-- ============================================================
('00000000-0000-0000-0000-000000000000', 'Barbell Hip Thrust', 'Glutes', ARRAY['Hamstrings','Core'], 'Barbell', 'hinge', 'intermediate', 'Sit with upper back against a bench. Roll a barbell over your hips. Drive through your heels to thrust upward until hips are fully extended. Squeeze glutes hard at the top.', false, false),
('00000000-0000-0000-0000-000000000000', 'Glute Bridge', 'Glutes', ARRAY['Hamstrings','Core'], 'Bodyweight', 'hinge', 'beginner', 'Lie on your back with knees bent and feet flat. Drive through heels to lift hips until your body forms a straight line from shoulders to knees. Squeeze glutes at the top.', false, false),
('00000000-0000-0000-0000-000000000000', 'Single-Leg Glute Bridge', 'Glutes', ARRAY['Hamstrings','Core'], 'Bodyweight', 'hinge', 'intermediate', 'Lie on your back, extend one leg in the air. Drive through the planted heel to lift hips. Focus on keeping hips level. Great for fixing imbalances.', false, false),
('00000000-0000-0000-0000-000000000000', 'Sumo Deadlift', 'Glutes', ARRAY['Quads','Hamstrings','Core'], 'Barbell', 'hinge', 'intermediate', 'Take a wide stance with toes pointed out. Grip the bar between your legs and stand up by driving hips forward. Emphasises glutes and adductors more than conventional.', false, false),
('00000000-0000-0000-0000-000000000000', 'Cable Kickback', 'Glutes', ARRAY['Hamstrings'], 'Cable', 'isolation', 'beginner', 'Attach an ankle strap to a low cable. Face the machine and kick one leg straight back, squeezing the glute at full extension. Control the return. Avoid arching your back.', false, false),
('00000000-0000-0000-0000-000000000000', 'Dumbbell Sumo Squat', 'Glutes', ARRAY['Quads','Core'], 'Dumbbell', 'squat', 'beginner', 'Stand wide with toes turned out. Hold a dumbbell between your legs. Squat down, keeping torso upright, then drive up through your heels squeezing glutes.', false, false),
('00000000-0000-0000-0000-000000000000', 'Banded Clamshell', 'Glutes', ARRAY[]::text[], 'Resistance Band', 'isolation', 'beginner', 'Lie on your side with a band above your knees, knees bent. Open your top knee like a clamshell while keeping feet together. Control the close. Targets the gluteus medius.', false, false),
('00000000-0000-0000-0000-000000000000', 'Lateral Band Walk', 'Glutes', ARRAY[]::text[], 'Resistance Band', 'isolation', 'beginner', 'Place a band above your knees or around ankles. Adopt a quarter-squat and step sideways, maintaining tension in the band. Keep toes pointed forward.', false, false),
('00000000-0000-0000-0000-000000000000', 'Frog Pump', 'Glutes', ARRAY[]::text[], 'Bodyweight', 'isolation', 'beginner', 'Lie on your back with soles of feet together and knees out. Thrust hips upward by squeezing glutes. The externally rotated position isolates the glutes effectively.', false, false),
('00000000-0000-0000-0000-000000000000', 'Reverse Hyperextension', 'Glutes', ARRAY['Hamstrings','Back'], 'Machine', 'hinge', 'intermediate', 'Lie face-down on a reverse hyper machine. Swing your legs up by contracting glutes and hamstrings. Lower with control. Decompresses the spine.', false, false),
('00000000-0000-0000-0000-000000000000', 'Kettlebell Sumo Deadlift', 'Glutes', ARRAY['Quads','Hamstrings'], 'Kettlebell', 'hinge', 'beginner', 'Stand wide over a kettlebell. Hinge to grip it, then stand by driving hips forward. Squeeze glutes at the top. The wide stance emphasises glute activation.', false, false),
('00000000-0000-0000-0000-000000000000', 'Barbell Glute Bridge', 'Glutes', ARRAY['Hamstrings','Core'], 'Barbell', 'hinge', 'intermediate', 'Lie flat on the floor with a barbell across your hips. Drive through heels to lift hips until fully extended. Shorter range of motion but allows heavier loading than hip thrust.', false, false),

-- ============================================================
-- CALVES (6 exercises)
-- ============================================================
('00000000-0000-0000-0000-000000000000', 'Standing Calf Raise', 'Calves', ARRAY[]::text[], 'Machine', 'isolation', 'beginner', 'Stand in a calf raise machine with pads on your shoulders. Rise onto your toes as high as possible. Lower slowly below the platform for a full stretch.', false, false),
('00000000-0000-0000-0000-000000000000', 'Seated Calf Raise', 'Calves', ARRAY[]::text[], 'Machine', 'isolation', 'beginner', 'Sit with the pad on your lower thighs, balls of feet on the platform. Rise onto your toes, pause at the top, then lower for a deep stretch. Targets the soleus.', false, false),
('00000000-0000-0000-0000-000000000000', 'Dumbbell Calf Raise', 'Calves', ARRAY[]::text[], 'Dumbbell', 'isolation', 'beginner', 'Stand on the edge of a step holding dumbbells. Rise onto your toes, pause, then lower heels below the step. The elevated position allows a greater range of motion.', false, false),
('00000000-0000-0000-0000-000000000000', 'Single-Leg Calf Raise', 'Calves', ARRAY[]::text[], 'Bodyweight', 'isolation', 'intermediate', 'Stand on one foot on the edge of a step. Rise onto your toes and lower below the step. Use a wall for balance. Bodyweight on one leg is surprisingly challenging.', false, false),
('00000000-0000-0000-0000-000000000000', 'Donkey Calf Raise', 'Calves', ARRAY[]::text[], 'Machine', 'isolation', 'intermediate', 'Bend forward at the hips on a donkey calf raise machine. Rise onto your toes with the weight on your lower back. The hip-flexed position stretches the gastrocnemius more.', false, false),
('00000000-0000-0000-0000-000000000000', 'Leg Press Calf Raise', 'Calves', ARRAY[]::text[], 'Machine', 'isolation', 'beginner', 'Sit in the leg press with only the balls of your feet on the bottom edge of the platform. Push by extending your ankles. Control both the rise and the stretch.', false, false),

-- ============================================================
-- CORE — ABS (12 exercises)
-- ============================================================
('00000000-0000-0000-0000-000000000000', 'Plank', 'Core', ARRAY['Shoulders','Glutes'], 'Bodyweight', 'isolation', 'beginner', 'Hold a push-up position on your forearms. Keep your body in a straight line from head to heels. Squeeze your glutes and brace your abs. Don''t let your hips sag or pike.', false, false),
('00000000-0000-0000-0000-000000000000', 'Ab Wheel Rollout', 'Core', ARRAY['Shoulders','Back'], 'Bodyweight', 'isolation', 'intermediate', 'Kneel holding an ab wheel. Roll forward as far as you can while keeping your core braced and lower back flat. Pull back by contracting your abs, not your hip flexors.', false, false),
('00000000-0000-0000-0000-000000000000', 'Hanging Leg Raise', 'Core', ARRAY[]::text[], 'Bodyweight', 'isolation', 'intermediate', 'Hang from a bar with straight arms. Raise your legs to 90 degrees or higher by curling your pelvis upward. Lower with control. Avoid swinging.', false, false),
('00000000-0000-0000-0000-000000000000', 'Hanging Knee Raise', 'Core', ARRAY[]::text[], 'Bodyweight', 'isolation', 'beginner', 'Hang from a bar. Bring your knees to your chest by curling your pelvis. Lower with control. Easier progression than straight-leg raises.', false, false),
('00000000-0000-0000-0000-000000000000', 'Cable Crunch', 'Core', ARRAY[]::text[], 'Cable', 'isolation', 'intermediate', 'Kneel in front of a high cable with a rope behind your head. Crunch downward by flexing your spine, not your hips. Squeeze your abs at the bottom.', false, false),
('00000000-0000-0000-0000-000000000000', 'Dead Bug', 'Core', ARRAY[]::text[], 'Bodyweight', 'isolation', 'beginner', 'Lie on your back, arms up, knees at 90 degrees. Extend opposite arm and leg simultaneously while pressing your lower back into the floor. Alternate sides.', false, false),
('00000000-0000-0000-0000-000000000000', 'Bird Dog', 'Core', ARRAY['Glutes','Back'], 'Bodyweight', 'isolation', 'beginner', 'From all fours, extend opposite arm and leg simultaneously. Hold briefly, then return. Keep your hips level and core braced. Don''t rotate your torso.', false, false),
('00000000-0000-0000-0000-000000000000', 'V-Up', 'Core', ARRAY[]::text[], 'Bodyweight', 'isolation', 'intermediate', 'Lie flat. Simultaneously raise your legs and torso to touch your toes, forming a V shape. Lower with control. Requires both ab strength and hip flexor flexibility.', false, false),
('00000000-0000-0000-0000-000000000000', 'Mountain Climber', 'Core', ARRAY['Shoulders'], 'Bodyweight', 'compound', 'beginner', 'Hold a push-up position. Rapidly alternate driving each knee toward your chest. Keep hips level and core tight. Can be done slowly for control or fast for cardio.', false, false),
('00000000-0000-0000-0000-000000000000', 'Bicycle Crunch', 'Core', ARRAY[]::text[], 'Bodyweight', 'rotation', 'beginner', 'Lie on your back, hands behind your head. Alternate bringing each elbow to the opposite knee in a pedalling motion. Fully extend the non-working leg.', false, false),
('00000000-0000-0000-0000-000000000000', 'Dragon Flag', 'Core', ARRAY[]::text[], 'Bodyweight', 'isolation', 'advanced', 'Lie on a bench gripping behind your head. Raise your entire body into a straight line, then lower slowly while keeping only your shoulders on the bench. Extremely demanding.', false, false),
('00000000-0000-0000-0000-000000000000', 'L-Sit Hold', 'Core', ARRAY['Shoulders'], 'Bodyweight', 'isolation', 'advanced', 'Support yourself on parallel bars or the floor with arms straight. Hold your legs out in front at 90 degrees to your torso. Requires significant ab and hip flexor strength.', false, false),

-- ============================================================
-- CORE — OBLIQUES / ANTI-ROTATION (8 exercises)
-- ============================================================
('00000000-0000-0000-0000-000000000000', 'Side Plank', 'Core', ARRAY['Shoulders'], 'Bodyweight', 'isolation', 'beginner', 'Lie on your side and prop yourself up on one forearm. Keep your body in a straight line with hips elevated. Hold. Don''t let your hips drop toward the floor.', false, false),
('00000000-0000-0000-0000-000000000000', 'Pallof Press', 'Core', ARRAY[]::text[], 'Cable', 'rotation', 'intermediate', 'Stand perpendicular to a cable set at chest height. Press the handle straight out in front of you and resist the rotational pull. Hold briefly, then return. Anti-rotation at its finest.', false, false),
('00000000-0000-0000-0000-000000000000', 'Russian Twist', 'Core', ARRAY[]::text[], 'Dumbbell', 'rotation', 'beginner', 'Sit with torso leaned back ~45 degrees, feet off the floor. Hold a weight at chest height and rotate side to side. Move from the thoracic spine, not the arms.', false, false),
('00000000-0000-0000-0000-000000000000', 'Cable Woodchop', 'Core', ARRAY['Shoulders'], 'Cable', 'rotation', 'intermediate', 'Set a cable high. Pull diagonally across your body to the opposite hip in a chopping motion. Rotate from the hips and core, not just the arms.', false, false),
('00000000-0000-0000-0000-000000000000', 'Cable Low-to-High Woodchop', 'Core', ARRAY['Shoulders'], 'Cable', 'rotation', 'intermediate', 'Set a cable low. Pull diagonally upward across your body to the opposite shoulder. Reverse woodchop targets obliques from a different angle.', false, false),
('00000000-0000-0000-0000-000000000000', 'Suitcase Carry', 'Core', ARRAY['Forearms','Traps'], 'Dumbbell', 'carry', 'intermediate', 'Hold a heavy dumbbell in one hand. Walk while resisting the lateral lean, keeping your torso perfectly upright. Switch hands after each set.', false, false),
('00000000-0000-0000-0000-000000000000', 'Landmine Rotation', 'Core', ARRAY['Shoulders'], 'Barbell', 'rotation', 'intermediate', 'Hold the end of a landmine barbell at chest height. Rotate the bar from one hip to the other in an arc, pivoting through your feet. Control the movement.', false, false),
('00000000-0000-0000-0000-000000000000', 'Copenhagen Plank', 'Core', ARRAY['Glutes'], 'Bodyweight', 'isolation', 'advanced', 'Side plank with top leg supported on a bench and bottom leg hanging. Hold the position, bracing your adductors and obliques. Very demanding on the adductors and core.', false, false),

-- ============================================================
-- ADDITIONAL EXERCISES (18) — fill coverage gaps
-- ============================================================

-- Forearms +4
('00000000-0000-0000-0000-000000000000', 'Reverse Curl', 'Forearms', ARRAY['Biceps'], 'Barbell', 'isolation', 'beginner', 'Stand holding a barbell with an overhand (pronated) grip. Curl to shoulder height, keeping elbows at your sides. Targets the brachioradialis and wrist extensors.', false, false),
('00000000-0000-0000-0000-000000000000', 'Towel Hang', 'Forearms', ARRAY['Back'], 'Bodyweight', 'isolation', 'advanced', 'Drape two towels over a pull-up bar and grip one in each hand. Hang for as long as possible. The thick, unstable grip crushes grip endurance.', false, false),
('00000000-0000-0000-0000-000000000000', 'Kettlebell Bottom-Up Hold', 'Forearms', ARRAY['Shoulders','Core'], 'Kettlebell', 'carry', 'intermediate', 'Clean a kettlebell to shoulder height and hold it bottom-up (bell pointing to the ceiling). Walk or hold for time. Demands crushing grip and stabilisation.', false, false),
('00000000-0000-0000-0000-000000000000', 'Wrist Roller', 'Forearms', ARRAY[]::text[], 'Barbell', 'isolation', 'intermediate', 'Hold a wrist roller at arm''s length. Roll the weight up by alternating wrist extensions, then lower it back down slowly. Burns the forearm flexors and extensors.', false, false),

-- Calves +2
('00000000-0000-0000-0000-000000000000', 'Barbell Calf Raise', 'Calves', ARRAY[]::text[], 'Barbell', 'isolation', 'intermediate', 'Place a barbell on your upper back as if squatting. Stand on a raised edge and perform calf raises. Allows heavier loading than dumbbells or bodyweight.', false, false),
('00000000-0000-0000-0000-000000000000', 'Jumping Calf Raise', 'Calves', ARRAY[]::text[], 'Bodyweight', 'plyometric', 'intermediate', 'Stand on flat ground and bounce on your toes with minimal knee bend. Focus on explosive ankle extension and quick ground contact. Builds calf power and reactivity.', false, false),

-- Biceps +2
('00000000-0000-0000-0000-000000000000', 'EZ Bar Curl', 'Biceps', ARRAY['Forearms'], 'Barbell', 'isolation', 'beginner', 'Grip the angled EZ bar at the inner or outer camber. Curl to shoulder height. The angled grip reduces wrist strain compared to a straight barbell.', false, false),
('00000000-0000-0000-0000-000000000000', 'Bayesian Cable Curl', 'Biceps', ARRAY['Forearms'], 'Cable', 'isolation', 'intermediate', 'Face away from a low cable, arm behind you. Curl forward against cable resistance. The stretched position at the start makes this an excellent long-head exercise.', false, false),

-- Triceps +2
('00000000-0000-0000-0000-000000000000', 'Single-Arm Cable Pushdown', 'Triceps', ARRAY[]::text[], 'Cable', 'isolation', 'beginner', 'Stand facing a high pulley. Grip a single handle and push down with one arm, fully extending the elbow. Keep your upper arm still. Great for fixing imbalances.', false, false),
('00000000-0000-0000-0000-000000000000', 'JM Press', 'Triceps', ARRAY['Chest'], 'Barbell', 'push', 'advanced', 'A hybrid of close-grip bench and skull crusher. Lower the bar toward your chin/upper chest by bending elbows to ~90 degrees, then press up. Elbows travel forward more than in a bench press.', false, false),

-- Back +2 (more equipment variety)
('00000000-0000-0000-0000-000000000000', 'Meadows Row', 'Back', ARRAY['Biceps','Shoulders'], 'Barbell', 'pull', 'advanced', 'Stand perpendicular to a landmine. Grip the end of the bar overhand and row to your hip. The unique angle hits the upper lats and teres major differently than standard rows.', false, false),
('00000000-0000-0000-0000-000000000000', 'Resistance Band Pull-Apart', 'Back', ARRAY['Shoulders'], 'Resistance Band', 'pull', 'beginner', 'Hold a band at arm''s length in front of you. Pull it apart by squeezing your shoulder blades together until the band touches your chest. Control the return slowly.', false, false),

-- Quads +1 (barbell lunge)
('00000000-0000-0000-0000-000000000000', 'Barbell Lunge', 'Quads', ARRAY['Glutes','Core'], 'Barbell', 'lunge', 'intermediate', 'Place a barbell on your upper back. Step forward into a lunge until both knees reach ~90 degrees, then drive back to standing. The barbell allows heavier loading.', false, false),

-- Shoulders +1 (kettlebell)
('00000000-0000-0000-0000-000000000000', 'Kettlebell Press', 'Shoulders', ARRAY['Triceps','Core'], 'Kettlebell', 'push', 'intermediate', 'Clean a kettlebell to the rack position. Press it overhead to lockout, rotating your wrist at the top. The offset load demands more core stabilisation than dumbbells.', false, false),

-- Glutes +1 (machine)
('00000000-0000-0000-0000-000000000000', 'Hip Abduction Machine', 'Glutes', ARRAY[]::text[], 'Machine', 'isolation', 'beginner', 'Sit in the machine with pads on the outside of your knees. Push outward against the resistance, squeezing the glute medius. Control the return slowly.', false, false),

-- Hamstrings +1 (stability ball)
('00000000-0000-0000-0000-000000000000', 'Stability Ball Hamstring Curl', 'Hamstrings', ARRAY['Glutes','Core'], 'Bodyweight', 'isolation', 'intermediate', 'Lie on your back with heels on a stability ball. Lift hips into a bridge, then curl the ball toward your glutes by bending your knees. Extend back out with control.', false, false),

-- Chest +1 (resistance band)
('00000000-0000-0000-0000-000000000000', 'Resistance Band Chest Flye', 'Chest', ARRAY['Shoulders'], 'Resistance Band', 'isolation', 'beginner', 'Anchor a band at chest height behind you. Step forward and bring handles together in front of your chest with a slight elbow bend. Band tension peaks at the squeeze.', false, false),

-- Core +1 (kettlebell carry)
('00000000-0000-0000-0000-000000000000', 'Kettlebell Turkish Get-Up', 'Core', ARRAY['Shoulders','Glutes'], 'Kettlebell', 'compound', 'advanced', 'Lie on the floor holding a kettlebell overhead. Stand up through a controlled sequence of movements — roll, post, kneel, stand — while keeping the weight locked out above you. Reverse to return.', false, false);

-- -------------------------------------------------------
-- 4. Allow all authenticated users to see seeded exercises
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exercises' AND policyname = 'Everyone can view seeded exercises'
  ) THEN
    CREATE POLICY "Everyone can view seeded exercises"
      ON exercises FOR SELECT
      USING (created_by = '00000000-0000-0000-0000-000000000000');
  END IF;
END $$;
