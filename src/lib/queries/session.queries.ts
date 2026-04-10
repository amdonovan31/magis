import { createClient } from "@/lib/supabase/server";
import { getTodayISO } from "@/lib/utils/date";
import { getExercisesByIds } from "@/lib/queries/exercise.queries";
import type { TodayWorkout, WorkoutSession, Exercise } from "@/types/app.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveAlternateExercises(exercises: any[]) {
  const allAltIds = exercises
    .flatMap((e) => (e.alternate_exercise_ids as string[]) ?? []);
  const uniqueIds = Array.from(new Set(allAltIds));
  if (uniqueIds.length === 0) return exercises;

  const altExercises = await getExercisesByIds(uniqueIds);
  const altMap = new Map(altExercises.map((e: Exercise) => [e.id, e]));

  return exercises.map((e) => ({
    ...e,
    alternateExercises: ((e.alternate_exercise_ids as string[]) ?? [])
      .map((id: string) => altMap.get(id))
      .filter(Boolean),
  }));
}

export async function getTodayWorkout(): Promise<TodayWorkout> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = getTodayISO();

  // Mark any past scheduled workouts still in "scheduled" status as "skipped"
  await supabase
    .from("scheduled_workouts")
    .update({ status: "skipped" })
    .eq("client_id", user.id)
    .eq("status", "scheduled")
    .lt("scheduled_date", today);

  // Check for a completed scheduled workout today first — this takes priority
  const { data: completedRow } = await supabase
    .from("scheduled_workouts")
    .select(`
      id,
      session_id,
      program_id,
      workout_template_id,
      program:programs!inner(
        *
      ),
      template:workout_templates!inner(
        *,
        exercises:workout_template_exercises(
          *,
          exercise:exercises(*)
        )
      )
    `)
    .eq("client_id", user.id)
    .eq("scheduled_date", today)
    .eq("status", "completed")
    .limit(1)
    .maybeSingle();

  if (completedRow) {
    const program = completedRow.program as unknown as import("@/types/app.types").Program;
    const template = completedRow.template as unknown as import("@/types/app.types").WorkoutTemplateWithExercises;

    const sortedExercises = (template.exercises ?? []).sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    );
    const exercisesWithAlternates = await resolveAlternateExercises(sortedExercises);

    let coachName: string | null = null;
    if (program.coach_id && program.coach_id !== user.id) {
      const { data: coachProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", program.coach_id)
        .single();
      coachName = coachProfile?.full_name ?? null;
    }

    return {
      template: { ...template, exercises: exercisesWithAlternates } as unknown as import("@/types/app.types").WorkoutTemplateWithExercises,
      activeSession: null,
      completedSessionId: completedRow.session_id,
      program,
      coachName,
    };
  }

  // Find today's scheduled workout (not yet completed)
  const { data: scheduledRow } = await supabase
    .from("scheduled_workouts")
    .select(`
      id,
      program_id,
      workout_template_id,
      program:programs!inner(
        *
      ),
      template:workout_templates!inner(
        *,
        exercises:workout_template_exercises(
          *,
          exercise:exercises(*)
        )
      )
    `)
    .eq("client_id", user.id)
    .eq("scheduled_date", today)
    .eq("status", "scheduled")
    .limit(1)
    .maybeSingle();

  if (!scheduledRow) return null;

  const program = scheduledRow.program as unknown as import("@/types/app.types").Program;
  const template = scheduledRow.template as unknown as import("@/types/app.types").WorkoutTemplateWithExercises;

  // Sort exercises by position and resolve alternates
  const sortedExercises = (template.exercises ?? []).sort(
    (a: { position: number }, b: { position: number }) => a.position - b.position
  );
  const exercisesWithAlternates = await resolveAlternateExercises(sortedExercises);
  const templateWithSortedExercises = {
    ...template,
    exercises: exercisesWithAlternates,
  };

  // Check for an in-progress session
  const { data: activeSession } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("client_id", user.id)
    .eq("workout_template_id", template.id)
    .eq("status", "in_progress")
    .maybeSingle();

  // Fetch coach name if the program has a coach_id different from the user
  let coachName: string | null = null;
  if (program.coach_id && program.coach_id !== user.id) {
    const { data: coachProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", program.coach_id)
      .single();
    coachName = coachProfile?.full_name ?? null;
  }

  return {
    template: templateWithSortedExercises as unknown as import("@/types/app.types").WorkoutTemplateWithExercises,
    activeSession: activeSession as WorkoutSession | null,
    completedSessionId: null,
    program,
    coachName,
  };
}

export async function getSession(sessionId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("workout_sessions")
    .select(`
      *,
      workout_template:workout_templates(
        *,
        exercises:workout_template_exercises(
          *,
          exercise:exercises(*)
        )
      ),
      set_logs(*),
      session_exercise_notes(*),
      session_extra_work(*)
    `)
    .eq("id", sessionId)
    .single();

  if (!data) return data;

  // Resolve alternate exercises
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wt = data.workout_template as any;
  if (wt?.exercises) {
    wt.exercises = await resolveAlternateExercises(wt.exercises);
  }

  return data;
}

export type LastPerformance = {
  reps: number;
  weight_value: number;
  weight_unit: "kg" | "lbs";
  logged_at: string;
};

/**
 * Returns the most recent completed, non-skipped set per exercise for the
 * current user. Used to display a "Last: X reps × Y lbs" hint above the
 * active set row during workout logging.
 *
 * Set logs may reference an exercise either via:
 *   - exercise_id (when the user swapped to a different exercise)
 *   - template_exercise_id (the original prescribed slot — joined to
 *     workout_template_exercises to resolve the underlying exercise)
 * We query both paths and merge in JS so the hint reflects the actual
 * exercise being performed regardless of how it was logged.
 *
 * @param exerciseIds - The exercise IDs (from workout_template_exercises.exercise_id)
 *                     visible in the current workout
 * @param excludeSessionId - Excludes the user's current in-progress session
 *                           so they don't see their own current sets as "last time"
 */
export async function getLastPerformanceForExercises(
  exerciseIds: string[],
  excludeSessionId: string
): Promise<Record<string, LastPerformance>> {
  if (exerciseIds.length === 0) return {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  // Find all template_exercise_ids that map to the requested exercise_ids.
  // Needed because non-swapped set_logs reference template_exercise_id, not exercise_id.
  const { data: templateRows } = await supabase
    .from("workout_template_exercises")
    .select("id, exercise_id")
    .in("exercise_id", exerciseIds);

  const templateIdToExerciseId = new Map<string, string>();
  for (const row of templateRows ?? []) {
    if (row.exercise_id) templateIdToExerciseId.set(row.id, row.exercise_id);
  }
  const templateIds = Array.from(templateIdToExerciseId.keys());

  // Query 1: set_logs that explicitly reference the exercise (post-swap rows)
  const byExercisePromise = supabase
    .from("set_logs")
    .select("exercise_id, reps_completed, weight_value, weight_unit, logged_at, session_id, workout_sessions!inner(client_id)")
    .in("exercise_id", exerciseIds)
    .eq("is_completed", true)
    .eq("is_skipped", false)
    .not("weight_value", "is", null)
    .neq("session_id", excludeSessionId)
    .eq("workout_sessions.client_id", user.id)
    .order("logged_at", { ascending: false });

  // Query 2: set_logs that reference the template (no swap), join to resolve exercise
  const byTemplatePromise = templateIds.length
    ? supabase
        .from("set_logs")
        .select("template_exercise_id, reps_completed, weight_value, weight_unit, logged_at, session_id, workout_sessions!inner(client_id)")
        .in("template_exercise_id", templateIds)
        .is("exercise_id", null)
        .eq("is_completed", true)
        .eq("is_skipped", false)
        .not("weight_value", "is", null)
        .neq("session_id", excludeSessionId)
        .eq("workout_sessions.client_id", user.id)
        .order("logged_at", { ascending: false })
    : Promise.resolve({ data: [] as unknown[] });

  const [byExercise, byTemplate] = await Promise.all([byExercisePromise, byTemplatePromise]);

  type RowShape = {
    exerciseId: string;
    reps_completed: number | null;
    weight_value: number | null;
    weight_unit: string | null;
    logged_at: string | null;
  };

  const merged: RowShape[] = [];

  for (const row of (byExercise.data ?? []) as Array<{
    exercise_id: string | null;
    reps_completed: number | null;
    weight_value: number | null;
    weight_unit: string | null;
    logged_at: string | null;
  }>) {
    if (!row.exercise_id) continue;
    merged.push({
      exerciseId: row.exercise_id,
      reps_completed: row.reps_completed,
      weight_value: row.weight_value,
      weight_unit: row.weight_unit,
      logged_at: row.logged_at,
    });
  }

  for (const row of (byTemplate.data ?? []) as Array<{
    template_exercise_id: string | null;
    reps_completed: number | null;
    weight_value: number | null;
    weight_unit: string | null;
    logged_at: string | null;
  }>) {
    if (!row.template_exercise_id) continue;
    const exerciseId = templateIdToExerciseId.get(row.template_exercise_id);
    if (!exerciseId) continue;
    merged.push({
      exerciseId,
      reps_completed: row.reps_completed,
      weight_value: row.weight_value,
      weight_unit: row.weight_unit,
      logged_at: row.logged_at,
    });
  }

  // Explicit global sort: ISO timestamps sort lexicographically correct
  merged.sort((a, b) => (b.logged_at ?? "").localeCompare(a.logged_at ?? ""));

  // Take the first occurrence per exerciseId — guaranteed most recent due to sort
  const result: Record<string, LastPerformance> = {};
  for (const row of merged) {
    if (result[row.exerciseId]) continue;
    if (
      row.reps_completed == null ||
      row.weight_value == null ||
      row.logged_at == null
    )
      continue;
    const unit = row.weight_unit === "kg" ? "kg" : "lbs";
    result[row.exerciseId] = {
      reps: row.reps_completed,
      weight_value: row.weight_value,
      weight_unit: unit,
      logged_at: row.logged_at,
    };
  }

  return result;
}

export async function getClientHistory(limit = 20) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("workout_sessions")
    .select(`
      *,
      workout_template:workout_templates(title)
    `)
    .eq("client_id", user.id)
    .order("started_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}
