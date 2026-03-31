import { createClient } from "@/lib/supabase/server";
import { getExercisesByIds } from "@/lib/queries/exercise.queries";

export type AlternateExerciseSummary = {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  instructions: string | null;
};

export type ScheduledWorkoutWithDetails = {
  id: string;
  scheduled_date: string;
  status: string;
  session_id: string | null;
  program: { id: string; title: string };
  template: {
    id: string;
    title: string;
    exercises: {
      id: string;
      position: number;
      prescribed_sets: number | null;
      prescribed_reps: string | null;
      prescribed_weight: string | null;
      rest_seconds: number | null;
      alternate_exercise_ids: string[] | null;
      alternateExercises?: AlternateExerciseSummary[];
      exercise: {
        id: string;
        name: string;
        muscle_group: string | null;
      } | null;
    }[];
  };
};

/**
 * Fetch scheduled workouts for a client within a date range.
 */
export async function getScheduledWorkouts(
  startDate: string,
  endDate: string
): Promise<ScheduledWorkoutWithDetails[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("scheduled_workouts")
    .select(`
      id,
      scheduled_date,
      status,
      session_id,
      program:programs!inner(id, title),
      template:workout_templates!inner(
        id,
        title,
        exercises:workout_template_exercises(
          id,
          position,
          prescribed_sets,
          prescribed_reps,
          prescribed_weight,
          rest_seconds,
          alternate_exercise_ids,
          exercise:exercises(id, name, muscle_group)
        )
      )
    `)
    .eq("client_id", user.id)
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .in("status", ["scheduled", "completed", "missed"])
    .order("scheduled_date", { ascending: true });

  if (!data) return [];

  return data.map((row) => {
    const program = row.program as unknown as { id: string; title: string };
    const template = row.template as unknown as ScheduledWorkoutWithDetails["template"];
    return {
      id: row.id,
      scheduled_date: row.scheduled_date,
      status: row.status,
      session_id: row.session_id,
      program,
      template: {
        ...template,
        exercises: (template.exercises ?? []).sort(
          (a, b) => a.position - b.position
        ),
      },
    };
  });
}

/**
 * Fetch a single scheduled workout by ID with full exercise details.
 */
export async function getScheduledWorkout(
  workoutId: string
): Promise<ScheduledWorkoutWithDetails | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("scheduled_workouts")
    .select(`
      id,
      scheduled_date,
      status,
      session_id,
      program:programs!inner(id, title),
      template:workout_templates!inner(
        id,
        title,
        exercises:workout_template_exercises(
          id,
          position,
          prescribed_sets,
          prescribed_reps,
          prescribed_weight,
          rest_seconds,
          alternate_exercise_ids,
          exercise:exercises(id, name, muscle_group)
        )
      )
    `)
    .eq("id", workoutId)
    .eq("client_id", user.id)
    .single();

  if (!data) return null;

  const program = data.program as unknown as { id: string; title: string };
  const template = data.template as unknown as ScheduledWorkoutWithDetails["template"];

  // Resolve alternate exercises
  const sortedExercises = (template.exercises ?? []).sort(
    (a, b) => a.position - b.position
  );
  const allAltIds = sortedExercises
    .flatMap((e) => (e.alternate_exercise_ids as string[]) ?? []);
  const uniqueAltIds = Array.from(new Set(allAltIds));

  let exercisesWithAlts = sortedExercises;
  if (uniqueAltIds.length > 0) {
    const altExercises = await getExercisesByIds(uniqueAltIds);
    const altMap = new Map(altExercises.map((e) => [e.id, {
      id: e.id,
      name: e.name,
      muscle_group: e.muscle_group,
      equipment: e.equipment,
      instructions: e.instructions,
    } satisfies AlternateExerciseSummary]));
    exercisesWithAlts = sortedExercises.map((e) => ({
      ...e,
      alternateExercises: ((e.alternate_exercise_ids as string[]) ?? [])
        .map((id) => altMap.get(id))
        .filter((x): x is AlternateExerciseSummary => !!x),
    }));
  }

  return {
    id: data.id,
    scheduled_date: data.scheduled_date,
    status: data.status,
    session_id: data.session_id,
    program,
    template: {
      ...template,
      exercises: exercisesWithAlts,
    },
  };
}
