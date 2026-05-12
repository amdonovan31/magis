-- =============================================================================
-- PR 0 / pass 1: programs.ends_on as canonical lifecycle anchor
--
-- Adds a date-typed ends_on column to programs, backfills it from the latest
-- scheduled_workouts row per program, and installs a trigger on
-- scheduled_workouts so ends_on stays in sync when workouts are added,
-- moved, or deleted.
--
-- starts_on was previously nullable; this migration also normalises it to
-- NOT NULL by backfilling any null rows with created_at::date.
--
-- Pass 2 (migration 056) tightens ends_on to NOT NULL and adds the
-- ends_on >= starts_on CHECK constraint after this pass has been verified.
-- =============================================================================

-- 1. Backfill null starts_on (existing rows only)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, created_at FROM public.programs WHERE starts_on IS NULL LOOP
    RAISE NOTICE 'programs.starts_on backfilled from created_at for program %', r.id;
  END LOOP;
END $$;

UPDATE public.programs
   SET starts_on = created_at::date
 WHERE starts_on IS NULL;

ALTER TABLE public.programs
  ALTER COLUMN starts_on SET NOT NULL;

-- 2. Add ends_on column (nullable for now; constrained in pass 2)
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS ends_on date;

COMMENT ON COLUMN public.programs.ends_on IS
  'Last date the program covers. Set to MAX(scheduled_workouts.scheduled_date) for the program; falls back to starts_on when no scheduled workouts exist. Maintained by trigger on scheduled_workouts.';

-- 3. Backfill ends_on from scheduled_workouts (or starts_on as fallback)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.id
      FROM public.programs p
      LEFT JOIN public.scheduled_workouts sw ON sw.program_id = p.id
     WHERE sw.id IS NULL
  LOOP
    RAISE NOTICE 'programs.ends_on falling back to starts_on for program % (no scheduled_workouts)', r.id;
  END LOOP;
END $$;

UPDATE public.programs p
   SET ends_on = COALESCE(
     (SELECT MAX(scheduled_date) FROM public.scheduled_workouts WHERE program_id = p.id),
     p.starts_on
   );

-- 4. Sanity check before pass 2 ships: any ends_on < starts_on would block the CHECK constraint
DO $$
DECLARE bad_count int;
BEGIN
  SELECT COUNT(*) INTO bad_count FROM public.programs WHERE ends_on < starts_on;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Found % programs with ends_on < starts_on; pass 2 CHECK constraint will fail. Inspect with SELECT id, starts_on, ends_on FROM public.programs WHERE ends_on < starts_on. Resolve before applying migration 056.', bad_count;
  END IF;
END $$;

-- 5. Recompute function — the canonical ends_on derivation
CREATE OR REPLACE FUNCTION public.recompute_program_ends_on(p_program_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_max date;
  v_starts date;
BEGIN
  SELECT MAX(scheduled_date) INTO v_max
    FROM public.scheduled_workouts
   WHERE program_id = p_program_id;

  IF v_max IS NULL THEN
    SELECT starts_on INTO v_starts FROM public.programs WHERE id = p_program_id;
    UPDATE public.programs SET ends_on = v_starts WHERE id = p_program_id;
  ELSE
    UPDATE public.programs SET ends_on = v_max WHERE id = p_program_id;
  END IF;
END $$;

COMMENT ON FUNCTION public.recompute_program_ends_on(uuid) IS
  'Recompute programs.ends_on for a given program from MAX(scheduled_workouts.scheduled_date), falling back to starts_on. SECURITY DEFINER so it works from RLS-restricted contexts (e.g. client session completion).';

-- 6. Trigger function — fires on scheduled_workouts mutations and recomputes
CREATE OR REPLACE FUNCTION public.trg_scheduled_workouts_recompute_ends_on()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_program_ends_on(OLD.program_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only recompute when scheduled_date or program_id actually changed.
    -- Status flips (scheduled <-> completed) happen on every session completion
    -- and don't affect ends_on.
    IF NEW.scheduled_date IS DISTINCT FROM OLD.scheduled_date
       OR NEW.program_id IS DISTINCT FROM OLD.program_id THEN
      PERFORM public.recompute_program_ends_on(NEW.program_id);
      IF NEW.program_id IS DISTINCT FROM OLD.program_id THEN
        PERFORM public.recompute_program_ends_on(OLD.program_id);
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.recompute_program_ends_on(NEW.program_id);
    RETURN NEW;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS scheduled_workouts_recompute_ends_on ON public.scheduled_workouts;

CREATE TRIGGER scheduled_workouts_recompute_ends_on
  AFTER INSERT OR UPDATE OR DELETE ON public.scheduled_workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_scheduled_workouts_recompute_ends_on();
