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

  // Find today's scheduled workout via scheduled_workouts table
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

  // Check for a completed session today
  const { data: completedSession } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("client_id", user.id)
    .eq("workout_template_id", template.id)
    .eq("status", "completed")
    .gte("started_at", `${today}T00:00:00`)
    .lt("started_at", `${today}T23:59:59.999`)
    .order("completed_at", { ascending: false })
    .limit(1)
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
    completedSessionId: completedSession?.id ?? null,
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
      set_logs(*)
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
