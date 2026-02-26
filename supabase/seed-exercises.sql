-- Seed 150 common gym exercises
-- Usage: Replace the coach_id below with an actual profile UUID, then run in Supabase SQL editor
DO $$
DECLARE
  coach_id uuid := '00000000-0000-0000-0000-000000000000'; -- REPLACE with your coach profile ID
BEGIN

INSERT INTO public.exercises (created_by, name, muscle_group, instructions) VALUES
-- ============================================================
-- CHEST (14 exercises)
-- ============================================================
(coach_id, 'Barbell Bench Press', 'Chest', 'Equipment: Barbell. Secondary: Front Delts, Triceps. Lie on a flat bench, grip the bar slightly wider than shoulder-width, lower to mid-chest and press up to lockout.'),
(coach_id, 'Incline Barbell Bench Press', 'Chest', 'Equipment: Barbell. Secondary: Front Delts, Triceps. Set the bench to 30-45 degrees, lower the bar to the upper chest and press upward.'),
(coach_id, 'Decline Barbell Bench Press', 'Chest', 'Equipment: Barbell. Secondary: Triceps, Front Delts. Lie on a decline bench, lower the bar to the lower chest and press back up.'),
(coach_id, 'Dumbbell Bench Press', 'Chest', 'Equipment: Dumbbell. Secondary: Front Delts, Triceps. Lie flat and press two dumbbells upward from chest level, allowing a deeper stretch at the bottom.'),
(coach_id, 'Incline Dumbbell Press', 'Chest', 'Equipment: Dumbbell. Secondary: Front Delts, Triceps. Set the bench to 30-45 degrees and press dumbbells upward from the upper chest.'),
(coach_id, 'Dumbbell Flye', 'Chest', 'Equipment: Dumbbell. Secondary: Front Delts. Lie flat and lower dumbbells out to the sides with a slight elbow bend, then squeeze them back together over the chest.'),
(coach_id, 'Incline Dumbbell Flye', 'Chest', 'Equipment: Dumbbell. Secondary: Front Delts. Perform flyes on an incline bench to emphasize the upper chest fibers.'),
(coach_id, 'Cable Crossover', 'Chest', 'Equipment: Cable. Secondary: Front Delts. Set pulleys high, step forward and bring the handles together in front of the chest with a slight bend in the elbows.'),
(coach_id, 'Low Cable Flye', 'Chest', 'Equipment: Cable. Secondary: Front Delts. Set pulleys low and bring handles upward and together in front of the upper chest, targeting the upper pecs.'),
(coach_id, 'Machine Chest Press', 'Chest', 'Equipment: Machine. Secondary: Front Delts, Triceps. Sit in the machine, grip the handles at chest height and press forward to full extension.'),
(coach_id, 'Pec Deck Machine', 'Chest', 'Equipment: Machine. Secondary: Front Delts. Sit upright, place forearms against the pads and squeeze them together in front of the chest.'),
(coach_id, 'Push-Up', 'Chest', 'Equipment: Bodyweight. Secondary: Front Delts, Triceps, Core. Place hands shoulder-width apart on the floor, lower your body until your chest nearly touches, then push back up.'),
(coach_id, 'Dip (Chest Focused)', 'Chest', 'Equipment: Bodyweight. Secondary: Triceps, Front Delts. Lean forward on parallel bars, lower yourself until you feel a stretch in the chest, then press back up.'),
(coach_id, 'Landmine Press', 'Chest', 'Equipment: Landmine. Secondary: Front Delts, Triceps. Stand or kneel and press the end of a landmine barbell upward and forward with one or both hands.'),

-- ============================================================
-- BACK (16 exercises)
-- ============================================================
(coach_id, 'Conventional Deadlift', 'Back', 'Equipment: Barbell. Secondary: Glutes, Hamstrings, Core. Stand with feet hip-width, hinge at the hips to grip the bar and drive through the floor to stand up tall.'),
(coach_id, 'Barbell Bent-Over Row', 'Back', 'Equipment: Barbell. Secondary: Biceps, Rear Delts. Hinge forward at the hips, pull the barbell to your lower chest while keeping your back flat.'),
(coach_id, 'Pendlay Row', 'Back', 'Equipment: Barbell. Secondary: Biceps, Rear Delts. From a dead stop on the floor, explosively row the barbell to your lower chest while keeping your torso parallel to the ground.'),
(coach_id, 'Pull-Up', 'Back', 'Equipment: Bodyweight. Secondary: Biceps, Rear Delts. Hang from a bar with an overhand grip and pull your chin above the bar by driving your elbows down.'),
(coach_id, 'Chin-Up', 'Back', 'Equipment: Bodyweight. Secondary: Biceps. Hang from a bar with an underhand grip and pull your chin above the bar, emphasizing the lats and biceps.'),
(coach_id, 'Lat Pulldown', 'Back', 'Equipment: Cable. Secondary: Biceps, Rear Delts. Sit at the pulldown machine, pull the bar to your upper chest while squeezing your shoulder blades together.'),
(coach_id, 'Close-Grip Lat Pulldown', 'Back', 'Equipment: Cable. Secondary: Biceps. Use a V-handle or close-grip attachment and pull to your chest, focusing on a full lat stretch at the top.'),
(coach_id, 'Seated Cable Row', 'Back', 'Equipment: Cable. Secondary: Biceps, Rear Delts. Sit upright, pull the handle to your midsection while retracting your shoulder blades.'),
(coach_id, 'Single-Arm Dumbbell Row', 'Back', 'Equipment: Dumbbell. Secondary: Biceps, Rear Delts. Place one knee on a bench, row the dumbbell to your hip while keeping your torso stable.'),
(coach_id, 'Chest-Supported Dumbbell Row', 'Back', 'Equipment: Dumbbell. Secondary: Biceps, Rear Delts. Lie face down on an incline bench and row dumbbells to your sides, eliminating momentum.'),
(coach_id, 'T-Bar Row', 'Back', 'Equipment: Landmine. Secondary: Biceps, Rear Delts. Straddle a landmine bar, grip the V-handle and row the weight to your chest while keeping your back flat.'),
(coach_id, 'Meadows Row', 'Back', 'Equipment: Landmine. Secondary: Biceps, Rear Delts. Stand perpendicular to a landmine, grip the end of the bar and row it to your hip with one arm.'),
(coach_id, 'Straight-Arm Pulldown', 'Back', 'Equipment: Cable. Secondary: Core. Stand facing a high pulley, keep arms straight and pull the bar down to your thighs by engaging your lats.'),
(coach_id, 'Machine Row', 'Back', 'Equipment: Machine. Secondary: Biceps, Rear Delts. Sit in the machine, brace your chest against the pad and pull the handles toward your midsection.'),
(coach_id, 'Trap Bar Deadlift', 'Back', 'Equipment: Trap Bar. Secondary: Glutes, Hamstrings, Quads. Stand inside the trap bar, grip the handles and stand up by driving through the floor.'),
(coach_id, 'Inverted Row', 'Back', 'Equipment: Bodyweight. Secondary: Biceps, Rear Delts. Hang beneath a barbell set at hip height, pull your chest to the bar while keeping your body straight.'),

-- ============================================================
-- SHOULDERS (14 exercises)
-- ============================================================
(coach_id, 'Overhead Press', 'Shoulders', 'Equipment: Barbell. Secondary: Triceps, Upper Chest. Stand with feet shoulder-width, press the barbell from your front delts overhead to lockout.'),
(coach_id, 'Seated Dumbbell Shoulder Press', 'Shoulders', 'Equipment: Dumbbell. Secondary: Triceps. Sit on an upright bench and press dumbbells from shoulder height to overhead.'),
(coach_id, 'Arnold Press', 'Shoulders', 'Equipment: Dumbbell. Secondary: Triceps, Upper Chest. Start with palms facing you at chin height, rotate the dumbbells outward as you press overhead.'),
(coach_id, 'Dumbbell Lateral Raise', 'Shoulders', 'Equipment: Dumbbell. Secondary: Traps. Stand and raise dumbbells out to the sides until your arms are parallel to the floor, then lower slowly.'),
(coach_id, 'Cable Lateral Raise', 'Shoulders', 'Equipment: Cable. Secondary: Traps. Stand beside a low pulley, raise the handle out to the side to shoulder height while keeping a slight elbow bend.'),
(coach_id, 'Dumbbell Front Raise', 'Shoulders', 'Equipment: Dumbbell. Secondary: Upper Chest. Stand and raise dumbbells in front of you to shoulder height with straight arms, alternating or together.'),
(coach_id, 'Rear Delt Flye', 'Shoulders', 'Equipment: Dumbbell. Secondary: Traps, Rhomboids. Bend forward at the hips and raise dumbbells out to the sides, squeezing your rear delts at the top.'),
(coach_id, 'Face Pull', 'Shoulders', 'Equipment: Cable. Secondary: Rear Delts, Traps, Rotator Cuff. Set a cable at face height with a rope, pull toward your face while externally rotating your shoulders.'),
(coach_id, 'Machine Shoulder Press', 'Shoulders', 'Equipment: Machine. Secondary: Triceps. Sit in the shoulder press machine, grip the handles and press overhead to full extension.'),
(coach_id, 'Reverse Pec Deck', 'Shoulders', 'Equipment: Machine. Secondary: Traps, Rhomboids. Sit facing the pec deck pad, grip the handles and open your arms to squeeze your rear delts.'),
(coach_id, 'Barbell Upright Row', 'Shoulders', 'Equipment: Barbell. Secondary: Traps, Biceps. Stand holding a barbell with a narrow grip and pull it up along your body to chin height, leading with your elbows.'),
(coach_id, 'Dumbbell Shrug', 'Shoulders', 'Equipment: Dumbbell. Secondary: Traps. Stand holding dumbbells at your sides and shrug your shoulders straight up toward your ears, pause, then lower.'),
(coach_id, 'Landmine Lateral Raise', 'Shoulders', 'Equipment: Landmine. Secondary: Traps. Grip the end of a landmine bar with one hand and raise it out to the side to shoulder height.'),
(coach_id, 'Band Pull-Apart', 'Shoulders', 'Equipment: Band. Secondary: Rear Delts, Rhomboids. Hold a resistance band at arm''s length in front of you and pull it apart by squeezing your shoulder blades together.'),

-- ============================================================
-- BICEPS (10 exercises)
-- ============================================================
(coach_id, 'Barbell Curl', 'Biceps', 'Equipment: Barbell. Secondary: Forearms. Stand and curl a barbell from hip level to shoulder height, keeping your elbows pinned to your sides.'),
(coach_id, 'Dumbbell Curl', 'Biceps', 'Equipment: Dumbbell. Secondary: Forearms. Stand and curl dumbbells with a supinated grip, alternating or together, keeping your elbows stationary.'),
(coach_id, 'EZ Bar Curl', 'Biceps', 'Equipment: EZ Bar. Secondary: Forearms. Grip the angled bar at the inner or outer camber and curl to shoulder height for reduced wrist strain.'),
(coach_id, 'Hammer Curl', 'Biceps', 'Equipment: Dumbbell. Secondary: Brachioradialis, Forearms. Curl dumbbells with a neutral (palms facing each other) grip to target the brachialis.'),
(coach_id, 'Incline Dumbbell Curl', 'Biceps', 'Equipment: Dumbbell. Secondary: Forearms. Sit on an incline bench and curl dumbbells from a fully stretched position, emphasizing the long head.'),
(coach_id, 'Preacher Curl', 'Biceps', 'Equipment: EZ Bar. Secondary: Forearms. Sit at a preacher bench, drape your upper arms over the pad and curl the bar up, isolating the biceps.'),
(coach_id, 'Cable Curl', 'Biceps', 'Equipment: Cable. Secondary: Forearms. Stand facing a low pulley, grip the bar or rope and curl to shoulder height with constant cable tension.'),
(coach_id, 'Concentration Curl', 'Biceps', 'Equipment: Dumbbell. Secondary: Forearms. Sit on a bench, brace your elbow against your inner thigh and curl the dumbbell to your shoulder.'),
(coach_id, 'Spider Curl', 'Biceps', 'Equipment: Dumbbell. Secondary: Forearms. Lie face down on an incline bench and curl dumbbells, letting gravity increase tension at the top.'),
(coach_id, 'Cable Rope Hammer Curl', 'Biceps', 'Equipment: Cable. Secondary: Brachioradialis, Forearms. Attach a rope to a low pulley and curl with a neutral grip, squeezing at the top.'),

-- ============================================================
-- TRICEPS (10 exercises)
-- ============================================================
(coach_id, 'Close-Grip Bench Press', 'Triceps', 'Equipment: Barbell. Secondary: Chest, Front Delts. Lie flat and grip the bar with hands shoulder-width apart, lower to the chest and press up focusing on tricep contraction.'),
(coach_id, 'Tricep Pushdown', 'Triceps', 'Equipment: Cable. Secondary: None. Stand facing a high pulley with a straight bar, push the bar down by extending your elbows fully.'),
(coach_id, 'Rope Pushdown', 'Triceps', 'Equipment: Cable. Secondary: None. Attach a rope to a high pulley, push down and spread the rope ends apart at the bottom for peak contraction.'),
(coach_id, 'Overhead Tricep Extension', 'Triceps', 'Equipment: Dumbbell. Secondary: None. Hold a dumbbell overhead with both hands, lower it behind your head by bending your elbows, then extend back up.'),
(coach_id, 'Skull Crusher', 'Triceps', 'Equipment: EZ Bar. Secondary: None. Lie on a flat bench, lower the EZ bar toward your forehead by bending at the elbows, then extend back up.'),
(coach_id, 'Dumbbell Kickback', 'Triceps', 'Equipment: Dumbbell. Secondary: None. Hinge forward, pin your elbow at your side and extend the dumbbell back until your arm is straight.'),
(coach_id, 'Diamond Push-Up', 'Triceps', 'Equipment: Bodyweight. Secondary: Chest, Front Delts. Place your hands close together under your chest forming a diamond shape and perform push-ups.'),
(coach_id, 'Cable Overhead Tricep Extension', 'Triceps', 'Equipment: Cable. Secondary: None. Face away from a low pulley, grip the rope overhead and extend your arms by straightening your elbows.'),
(coach_id, 'Bench Dip', 'Triceps', 'Equipment: Bench. Secondary: Front Delts, Chest. Place hands on a bench behind you, lower your body by bending your elbows to 90 degrees, then press up.'),
(coach_id, 'Single-Arm Cable Pushdown', 'Triceps', 'Equipment: Cable. Secondary: None. Stand facing a high pulley, grip a single handle and push down with one arm, fully extending the elbow.'),

-- ============================================================
-- LEGS (20 exercises)
-- ============================================================
(coach_id, 'Barbell Back Squat', 'Legs', 'Equipment: Barbell. Secondary: Glutes, Core. Place the bar on your upper traps, squat down until your thighs are parallel, then stand back up.'),
(coach_id, 'Barbell Front Squat', 'Legs', 'Equipment: Barbell. Secondary: Core, Glutes. Rest the bar on your front delts, squat to depth keeping your torso upright, then stand.'),
(coach_id, 'Goblet Squat', 'Legs', 'Equipment: Dumbbell. Secondary: Core, Glutes. Hold a dumbbell at your chest, squat between your legs keeping your torso upright, then stand.'),
(coach_id, 'Leg Press', 'Legs', 'Equipment: Machine. Secondary: Glutes. Sit in the leg press, place feet shoulder-width on the platform and press until your legs are extended without locking out.'),
(coach_id, 'Hack Squat', 'Legs', 'Equipment: Machine. Secondary: Glutes. Stand in the hack squat machine with your back against the pad, squat down and drive back up.'),
(coach_id, 'Bulgarian Split Squat', 'Legs', 'Equipment: Dumbbell. Secondary: Glutes, Core. Elevate your rear foot on a bench, hold dumbbells and squat down on your front leg until the thigh is parallel.'),
(coach_id, 'Walking Lunge', 'Legs', 'Equipment: Dumbbell. Secondary: Glutes, Core. Step forward into a lunge, lower your back knee toward the floor, then step through into the next lunge.'),
(coach_id, 'Reverse Lunge', 'Legs', 'Equipment: Dumbbell. Secondary: Glutes, Core. Step backward into a lunge, lower your back knee toward the floor, then drive back to standing.'),
(coach_id, 'Step-Up', 'Legs', 'Equipment: Box. Secondary: Glutes, Core. Hold dumbbells and step onto a box or bench with one foot, driving through the heel to stand on top.'),
(coach_id, 'Leg Extension', 'Legs', 'Equipment: Machine. Secondary: None. Sit in the leg extension machine and extend your legs by straightening your knees, squeezing the quads at the top.'),
(coach_id, 'Smith Machine Squat', 'Legs', 'Equipment: Smith Machine. Secondary: Glutes, Core. Place the bar on your traps, step slightly forward and squat down along the guided track.'),
(coach_id, 'Sissy Squat', 'Legs', 'Equipment: Bodyweight. Secondary: Core. Lean back while bending your knees, keeping your hips extended, to deeply stretch and contract the quads.'),
(coach_id, 'Pistol Squat', 'Legs', 'Equipment: Bodyweight. Secondary: Glutes, Core. Stand on one leg, extend the other in front of you and squat all the way down, then stand back up.'),
(coach_id, 'Leg Press Calf Raise', 'Legs', 'Equipment: Machine. Secondary: Calves. Place only the balls of your feet on the leg press platform and push by extending your ankles.'),
(coach_id, 'Wall Sit', 'Legs', 'Equipment: Bodyweight. Secondary: Core. Lean against a wall and slide down until your thighs are parallel to the floor, hold the position.'),
(coach_id, 'Barbell Lunge', 'Legs', 'Equipment: Barbell. Secondary: Glutes, Core. Place a barbell on your upper back and perform alternating forward lunges with controlled steps.'),
(coach_id, 'Landmine Squat', 'Legs', 'Equipment: Landmine. Secondary: Core, Glutes. Hold the end of a landmine bar at your chest and squat down, keeping your torso upright.'),
(coach_id, 'Belt Squat', 'Legs', 'Equipment: Machine. Secondary: Glutes. Attach weight to a belt around your hips and squat, removing spinal loading entirely.'),
(coach_id, 'Kettlebell Swing (Quad Emphasis)', 'Legs', 'Equipment: Kettlebell. Secondary: Glutes, Core. Perform a partial swing with a deeper knee bend to increase quad involvement.'),
(coach_id, 'Spanish Squat', 'Legs', 'Equipment: Band. Secondary: Core. Loop a band behind your knees anchored to a post, lean back and squat with an upright torso for quad isolation.'),

-- ============================================================
-- HAMSTRINGS (10 exercises)
-- ============================================================
(coach_id, 'Romanian Deadlift', 'Hamstrings', 'Equipment: Barbell. Secondary: Glutes, Lower Back. Hold the barbell at hip height, hinge forward with a slight knee bend until you feel a deep hamstring stretch, then return.'),
(coach_id, 'Stiff-Leg Deadlift', 'Hamstrings', 'Equipment: Barbell. Secondary: Glutes, Lower Back. Keep your legs nearly straight and hinge at the hips to lower the bar, stretching the hamstrings fully.'),
(coach_id, 'Lying Leg Curl', 'Hamstrings', 'Equipment: Machine. Secondary: Calves. Lie face down on the leg curl machine and curl the pad toward your glutes by bending your knees.'),
(coach_id, 'Seated Leg Curl', 'Hamstrings', 'Equipment: Machine. Secondary: Calves. Sit in the machine with the pad on your lower calves and curl your legs underneath you.'),
(coach_id, 'Dumbbell Romanian Deadlift', 'Hamstrings', 'Equipment: Dumbbell. Secondary: Glutes, Lower Back. Hold dumbbells in front of your thighs, hinge at the hips and lower them along your legs.'),
(coach_id, 'Single-Leg Romanian Deadlift', 'Hamstrings', 'Equipment: Dumbbell. Secondary: Glutes, Core. Stand on one leg, hinge forward while extending the other leg behind you for balance.'),
(coach_id, 'Nordic Hamstring Curl', 'Hamstrings', 'Equipment: Bodyweight. Secondary: Calves. Kneel with your ankles secured, slowly lower your torso toward the floor by extending at the knees, then pull yourself back up.'),
(coach_id, 'Good Morning', 'Hamstrings', 'Equipment: Barbell. Secondary: Glutes, Lower Back. Place a barbell on your upper back, hinge forward at the hips with a slight knee bend, then return upright.'),
(coach_id, 'Glute-Ham Raise', 'Hamstrings', 'Equipment: Machine. Secondary: Glutes, Calves. Lock your feet in a GHD machine, lower your torso and pull yourself back up using your hamstrings.'),
(coach_id, 'Kettlebell Swing', 'Hamstrings', 'Equipment: Kettlebell. Secondary: Glutes, Core. Hinge at the hips and swing the kettlebell between your legs, then drive your hips forward to propel it to chest height.'),

-- ============================================================
-- GLUTES (12 exercises)
-- ============================================================
(coach_id, 'Barbell Hip Thrust', 'Glutes', 'Equipment: Barbell. Secondary: Hamstrings, Core. Sit with your upper back against a bench, roll a barbell over your hips and thrust upward until your hips are fully extended.'),
(coach_id, 'Glute Bridge', 'Glutes', 'Equipment: Bodyweight. Secondary: Hamstrings, Core. Lie on your back with knees bent, drive through your heels to lift your hips until your body forms a straight line.'),
(coach_id, 'Single-Leg Glute Bridge', 'Glutes', 'Equipment: Bodyweight. Secondary: Hamstrings, Core. Perform a glute bridge with one leg extended in the air, driving through the planted heel.'),
(coach_id, 'Cable Pull-Through', 'Glutes', 'Equipment: Cable. Secondary: Hamstrings, Lower Back. Face away from a low cable, hinge at the hips and pull the rope through your legs by driving your hips forward.'),
(coach_id, 'Sumo Deadlift', 'Glutes', 'Equipment: Barbell. Secondary: Quads, Hamstrings, Core. Stand with a wide stance and toes pointed out, grip the bar between your legs and stand up.'),
(coach_id, 'Cable Kickback', 'Glutes', 'Equipment: Cable. Secondary: Hamstrings. Attach an ankle strap to a low cable, face the machine and kick one leg straight back, squeezing the glute at the top.'),
(coach_id, 'Dumbbell Sumo Squat', 'Glutes', 'Equipment: Dumbbell. Secondary: Quads, Adductors. Stand wide with toes out, hold a dumbbell between your legs and squat, emphasizing the glutes.'),
(coach_id, 'Banded Clamshell', 'Glutes', 'Equipment: Band. Secondary: Hip Abductors. Lie on your side with a band around your knees, open your top knee like a clamshell while keeping your feet together.'),
(coach_id, 'Lateral Band Walk', 'Glutes', 'Equipment: Band. Secondary: Hip Abductors. Place a band around your ankles or above your knees, adopt a quarter squat and step sideways.'),
(coach_id, 'Frog Pump', 'Glutes', 'Equipment: Bodyweight. Secondary: Adductors. Lie on your back with the soles of your feet together and knees out, thrust your hips upward.'),
(coach_id, 'Smith Machine Hip Thrust', 'Glutes', 'Equipment: Smith Machine. Secondary: Hamstrings, Core. Set up for a hip thrust using the Smith Machine bar for a guided movement path.'),
(coach_id, 'Reverse Hyperextension', 'Glutes', 'Equipment: Machine. Secondary: Hamstrings, Lower Back. Lie face down on a reverse hyper machine, swing your legs up by contracting your glutes and hamstrings.'),

-- ============================================================
-- CORE (16 exercises)
-- ============================================================
(coach_id, 'Plank', 'Core', 'Equipment: Bodyweight. Secondary: Shoulders, Glutes. Hold a push-up position on your forearms, keeping your body in a straight line from head to heels.'),
(coach_id, 'Side Plank', 'Core', 'Equipment: Bodyweight. Secondary: Obliques, Shoulders. Lie on your side and prop yourself up on one forearm, keeping your body straight and hips elevated.'),
(coach_id, 'Ab Wheel Rollout', 'Core', 'Equipment: Bodyweight. Secondary: Lats, Shoulders. Kneel and grip an ab wheel, roll forward as far as you can while keeping your core tight, then pull back.'),
(coach_id, 'Hanging Leg Raise', 'Core', 'Equipment: Bodyweight. Secondary: Hip Flexors. Hang from a pull-up bar and raise your legs to 90 degrees or higher by flexing at the hips.'),
(coach_id, 'Hanging Knee Raise', 'Core', 'Equipment: Bodyweight. Secondary: Hip Flexors. Hang from a bar and bring your knees to your chest, curling your pelvis for maximum ab engagement.'),
(coach_id, 'Cable Crunch', 'Core', 'Equipment: Cable. Secondary: None. Kneel in front of a high cable, hold the rope behind your head and crunch downward by flexing your spine.'),
(coach_id, 'Pallof Press', 'Core', 'Equipment: Cable. Secondary: Obliques. Stand perpendicular to a cable machine, press the handle straight out in front of you and resist the rotational pull.'),
(coach_id, 'Russian Twist', 'Core', 'Equipment: Medicine Ball. Secondary: Obliques. Sit with your torso leaned back slightly, hold a medicine ball and rotate side to side.'),
(coach_id, 'Dead Bug', 'Core', 'Equipment: Bodyweight. Secondary: Hip Flexors. Lie on your back with arms and legs raised, slowly extend opposite arm and leg while pressing your lower back into the floor.'),
(coach_id, 'Bird Dog', 'Core', 'Equipment: Bodyweight. Secondary: Glutes, Lower Back. From all fours, extend your opposite arm and leg simultaneously while keeping your core stable.'),
(coach_id, 'Mountain Climber', 'Core', 'Equipment: Bodyweight. Secondary: Hip Flexors, Shoulders. Hold a push-up position and rapidly alternate driving each knee toward your chest.'),
(coach_id, 'Bicycle Crunch', 'Core', 'Equipment: Bodyweight. Secondary: Obliques, Hip Flexors. Lie on your back and alternate bringing each elbow to the opposite knee in a pedaling motion.'),
(coach_id, 'V-Up', 'Core', 'Equipment: Bodyweight. Secondary: Hip Flexors. Lie flat and simultaneously raise your legs and torso to touch your toes at the top, forming a V shape.'),
(coach_id, 'Cable Woodchop', 'Core', 'Equipment: Cable. Secondary: Obliques, Shoulders. Set a cable high, pull it diagonally across your body to the opposite hip in a chopping motion.'),
(coach_id, 'Farmer''s Carry', 'Core', 'Equipment: Dumbbell. Secondary: Traps, Forearms, Full Body. Hold heavy dumbbells at your sides and walk with an upright posture for distance or time.'),
(coach_id, 'Suitcase Carry', 'Core', 'Equipment: Dumbbell. Secondary: Obliques, Traps, Forearms. Hold a heavy dumbbell in one hand and walk while resisting the lateral lean.'),

-- ============================================================
-- CALVES (6 exercises)
-- ============================================================
(coach_id, 'Standing Calf Raise', 'Calves', 'Equipment: Machine. Secondary: None. Stand in a calf raise machine with the pads on your shoulders, rise onto your toes and lower slowly for a full stretch.'),
(coach_id, 'Seated Calf Raise', 'Calves', 'Equipment: Machine. Secondary: None. Sit in the calf raise machine with the pad on your knees, rise onto your toes to target the soleus muscle.'),
(coach_id, 'Dumbbell Calf Raise', 'Calves', 'Equipment: Dumbbell. Secondary: None. Stand on the edge of a step holding dumbbells, rise onto your toes and lower your heels below the step for a deep stretch.'),
(coach_id, 'Smith Machine Calf Raise', 'Calves', 'Equipment: Smith Machine. Secondary: None. Stand on a block under the Smith Machine bar, rise onto your toes and lower with control.'),
(coach_id, 'Donkey Calf Raise', 'Calves', 'Equipment: Machine. Secondary: None. Bend forward at the hips on a donkey calf raise machine and rise onto your toes with the weight on your lower back.'),
(coach_id, 'Single-Leg Calf Raise', 'Calves', 'Equipment: Bodyweight. Secondary: None. Stand on one foot on the edge of a step, rise onto your toes and lower for a full range of motion.'),

-- ============================================================
-- FULL BODY (12 exercises)
-- ============================================================
(coach_id, 'Barbell Clean', 'Full Body', 'Equipment: Barbell. Secondary: Traps, Shoulders, Legs, Core. Pull the bar from the floor and catch it at your shoulders in a front rack position in one explosive movement.'),
(coach_id, 'Barbell Clean and Press', 'Full Body', 'Equipment: Barbell. Secondary: Shoulders, Legs, Core. Clean the bar to your shoulders, then press it overhead in one fluid sequence.'),
(coach_id, 'Barbell Snatch', 'Full Body', 'Equipment: Barbell. Secondary: Shoulders, Traps, Legs, Core. Pull the bar from the floor and catch it overhead in one explosive movement with a wide grip.'),
(coach_id, 'Thruster', 'Full Body', 'Equipment: Barbell. Secondary: Quads, Shoulders, Core. Perform a front squat and use the upward momentum to press the barbell overhead in one continuous motion.'),
(coach_id, 'Dumbbell Thruster', 'Full Body', 'Equipment: Dumbbell. Secondary: Quads, Shoulders, Core. Hold dumbbells at your shoulders, squat down and press them overhead as you stand.'),
(coach_id, 'Burpee', 'Full Body', 'Equipment: Bodyweight. Secondary: Chest, Legs, Core, Shoulders. Drop to the floor into a push-up, jump your feet to your hands and leap into the air.'),
(coach_id, 'Turkish Get-Up', 'Full Body', 'Equipment: Kettlebell. Secondary: Shoulders, Core, Legs. Lie on the floor holding a kettlebell overhead, stand up through a series of controlled movements while keeping the weight overhead.'),
(coach_id, 'Man Maker', 'Full Body', 'Equipment: Dumbbell. Secondary: Chest, Back, Shoulders, Legs, Core. Perform a push-up on dumbbells, row each one, jump to your feet and press them overhead.'),
(coach_id, 'Devil Press', 'Full Body', 'Equipment: Dumbbell. Secondary: Chest, Shoulders, Legs, Core. Perform a burpee with hands on dumbbells, then swing the dumbbells overhead in one motion as you stand.'),
(coach_id, 'Battle Rope Slam', 'Full Body', 'Equipment: Bodyweight. Secondary: Shoulders, Core, Legs. Hold the ends of battle ropes and slam them to the ground with full-body power repeatedly.'),
(coach_id, 'Kettlebell Clean and Press', 'Full Body', 'Equipment: Kettlebell. Secondary: Shoulders, Core, Legs. Clean a kettlebell to your shoulder, then press it overhead, engaging your full body.'),
(coach_id, 'Bear Crawl', 'Full Body', 'Equipment: Bodyweight. Secondary: Shoulders, Core, Quads. Crawl on all fours with knees hovering just above the ground, moving opposite hand and foot together.'),

-- ============================================================
-- CARDIO (10 exercises)
-- ============================================================
(coach_id, 'Treadmill Run', 'Cardio', 'Equipment: Machine. Secondary: Legs, Core. Run on a treadmill at your desired pace and incline for steady-state or interval cardio.'),
(coach_id, 'Rowing Machine', 'Cardio', 'Equipment: Machine. Secondary: Back, Legs, Core. Sit on the rower, drive with your legs, lean back and pull the handle to your chest in a fluid motion.'),
(coach_id, 'Assault Bike', 'Cardio', 'Equipment: Machine. Secondary: Legs, Arms, Core. Pedal and push-pull the handles simultaneously for a high-intensity full-body cardio session.'),
(coach_id, 'Stair Climber', 'Cardio', 'Equipment: Machine. Secondary: Legs, Glutes. Step continuously on the stair climber machine at a steady or varied pace.'),
(coach_id, 'Jump Rope', 'Cardio', 'Equipment: Bodyweight. Secondary: Calves, Shoulders, Core. Swing a jump rope and jump over it with both feet, maintaining a consistent rhythm.'),
(coach_id, 'Box Jump', 'Cardio', 'Equipment: Box. Secondary: Quads, Glutes, Calves. Stand in front of a box, swing your arms and jump onto the box, landing softly with both feet.'),
(coach_id, 'Sled Push', 'Cardio', 'Equipment: Machine. Secondary: Quads, Glutes, Core. Lean into a weighted sled and drive it forward with powerful leg strides.'),
(coach_id, 'Ski Erg', 'Cardio', 'Equipment: Machine. Secondary: Lats, Core, Triceps. Stand and pull both handles down simultaneously in a skiing motion for upper-body dominant cardio.'),
(coach_id, 'Cycling (Stationary Bike)', 'Cardio', 'Equipment: Machine. Secondary: Quads, Hamstrings, Calves. Pedal at a steady or interval pace on a stationary bike for low-impact cardiovascular training.'),
(coach_id, 'Sprints', 'Cardio', 'Equipment: Bodyweight. Secondary: Quads, Hamstrings, Glutes, Core. Run at maximum effort for short distances (20-100 meters) with full recovery between reps.');

END $$;
