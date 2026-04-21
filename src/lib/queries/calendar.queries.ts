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
    .in("status", ["scheduled", "completed", "missed", "skipped"])
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
 * Fetch scheduled workouts for a specific client (coach calling on their behalf).
 * Authorization must be verified by the caller before invoking.
 */
export async function getScheduledWorkoutsForClient(
  clientId: string,
  startDate: string,
  endDate: string
): Promise<ScheduledWorkoutWithDetails[]> {
  const supabase = await createClient();

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
    .eq("client_id", clientId)
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .in("status", ["scheduled", "completed", "missed", "skipped"])
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

export type ProgramOverviewWorkout = {
  id: string;
  scheduled_date: string;
  status: string;
  session_id: string | null;
  template: {
    id: string;
    title: string;
    week_number: number | null;
    exercises: {
      id: string;
      position: number;
      prescribed_sets: number | null;
      prescribed_reps: string | null;
      exercise: {
        id: string;
        name: string;
        muscle_group: string | null;
      } | null;
    }[];
  };
};

export type ProgramOverview = {
  programId: string;
  programTitle: string;
  totalWeeks: number;
  currentWeek: number;
  workouts: ProgramOverviewWorkout[];
} | null;

export async function getClientProgramOverview(): Promise<ProgramOverview> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: program } = await supabase
    .from("programs")
    .select("id, title, starts_on")
    .eq("client_id", user.id)
    .eq("is_active", true)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!program) return null;

  const { data: weekRows } = await supabase
    .from("workout_templates")
    .select("week_number")
    .eq("program_id", program.id);

  const distinctWeeks = new Set(
    (weekRows ?? []).map((r) => r.week_number).filter(Boolean)
  );
  const totalWeeks = distinctWeeks.size || 1;

  let currentWeek = 1;
  if (program.starts_on) {
    const startsOn = new Date(program.starts_on + "T00:00:00");
    const now = new Date();
    const diffMs = now.getTime() - startsOn.getTime();
    currentWeek = Math.max(
      1,
      Math.min(totalWeeks, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1)
    );
  }

  const { data: workouts } = await supabase
    .from("scheduled_workouts")
    .select(`
      id,
      scheduled_date,
      status,
      session_id,
      template:workout_templates!inner(
        id,
        title,
        week_number,
        exercises:workout_template_exercises(
          id,
          position,
          prescribed_sets,
          prescribed_reps,
          exercise:exercises(id, name, muscle_group)
        )
      )
    `)
    .eq("program_id", program.id)
    .eq("client_id", user.id)
    .in("status", ["scheduled", "completed", "missed", "skipped"])
    .order("scheduled_date", { ascending: true });

  if (!workouts) return null;

  const mapped: ProgramOverviewWorkout[] = workouts.map((row) => {
    const template = row.template as unknown as ProgramOverviewWorkout["template"];
    return {
      id: row.id,
      scheduled_date: row.scheduled_date,
      status: row.status,
      session_id: row.session_id,
      template: {
        ...template,
        exercises: (template.exercises ?? []).sort(
          (a, b) => a.position - b.position
        ),
      },
    };
  });

  return {
    programId: program.id,
    programTitle: program.title,
    totalWeeks,
    currentWeek,
    workouts: mapped,
  };
}
