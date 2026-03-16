import { createClient } from "@/lib/supabase/server";
import { isScheduledToday } from "@/lib/utils/date";
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

  // Get the client's active program with templates
  const { data: program } = await supabase
    .from("programs")
    .select(`
      *,
      workout_templates(
        *,
        client_schedule:client_workout_schedules!inner(scheduled_days, scheduled_dates),
        exercises:workout_template_exercises(
          *,
          exercise:exercises(*)
        )
      )
    `)
    .eq("client_id", user.id)
    .eq("is_active", true)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Also try without the inner join (in case no client override exists)
  const { data: programFallback } = !program
    ? await supabase
        .from("programs")
        .select(`
          *,
          workout_templates(
            *,
            exercises:workout_template_exercises(
              *,
              exercise:exercises(*)
            )
          )
        `)
        .eq("client_id", user.id)
        .eq("is_active", true)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const activeProgram = program ?? programFallback;
  if (!activeProgram?.workout_templates?.length) return null;

  // Find a template scheduled for today
  const todayTemplate = activeProgram.workout_templates.find(
    (t: {
      client_schedule?: Array<{ scheduled_days: number[] | null; scheduled_dates: string[] | null }>;
      scheduled_days: number[] | null;
      scheduled_dates: string[] | null;
    }) => {
      // Client override takes priority
      const clientSchedule = t.client_schedule?.[0];
      if (clientSchedule) {
        return isScheduledToday({
          scheduledDays: clientSchedule.scheduled_days,
          scheduledDates: clientSchedule.scheduled_dates,
        });
      }
      return isScheduledToday({
        scheduledDays: t.scheduled_days,
        scheduledDates: t.scheduled_dates,
      });
    }
  );

  if (!todayTemplate) return null;

  // Sort exercises by position and resolve alternates
  const sortedExercises = (todayTemplate.exercises ?? []).sort(
    (a: { position: number }, b: { position: number }) => a.position - b.position
  );
  const exercisesWithAlternates = await resolveAlternateExercises(sortedExercises);
  const templateWithSortedExercises = {
    ...todayTemplate,
    exercises: exercisesWithAlternates,
  };

  // Check for an in-progress session
  const { data: activeSession } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("client_id", user.id)
    .eq("workout_template_id", todayTemplate.id)
    .eq("status", "in_progress")
    .maybeSingle();

  // Fetch coach name if the program has a coach_id different from the user
  let coachName: string | null = null;
  if (activeProgram.coach_id && activeProgram.coach_id !== user.id) {
    const { data: coachProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", activeProgram.coach_id)
      .single();
    coachName = coachProfile?.full_name ?? null;
  }

  return {
    template: templateWithSortedExercises as unknown as import("@/types/app.types").WorkoutTemplateWithExercises,
    activeSession: activeSession as WorkoutSession | null,
    program: activeProgram as unknown as import("@/types/app.types").Program,
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
