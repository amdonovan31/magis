-- Rename "Flye" → "Fly" in exercise names and instructions
UPDATE public.exercises
SET name = REPLACE(name, 'Flye', 'Fly')
WHERE name LIKE '%Flye%';

UPDATE public.exercises
SET instructions = REPLACE(instructions, 'flyes', 'flys')
WHERE instructions LIKE '%flyes%';

UPDATE public.exercises
SET instructions = REPLACE(instructions, 'Flyes', 'Flys')
WHERE instructions LIKE '%Flyes%';
