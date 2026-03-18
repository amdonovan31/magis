import { createClient } from "@/lib/supabase/server";
import type { SessionSummary } from "@/types/app.types";

export async function getSessionSummary(
  sessionId: string
): Promise<SessionSummary | null> {
  const supabase = await createClient();

  // Fetch session with template, exercises, set_logs, and program
  const { data: session } = await supabase
    .from("workout_sessions")
    .select(`
      *,
      workout_template:workout_templates(
        title,
        exercises:workout_template_exercises(
          id,
          prescribed_sets,
          exercise:exercises(name)
        )
      ),
      program:programs(title),
      set_logs(*)
    `)
    .eq("id", sessionId)
    .single();

  if (!session) return null;

  const template = session.workout_template as {
    title: string;
    exercises: {
      id: string;
      prescribed_sets: number | null;
      exercise: { name: string } | null;
    }[];
  } | null;

  const program = session.program as { title: string } | null;
  const setLogs = (session.set_logs ?? []) as {
    template_exercise_id: string | null;
    is_completed: boolean;
    reps_completed: number | null;
    weight_used: string | null;
  }[];

  const exercises = template?.exercises ?? [];
  const completedSetLogs = setLogs.filter((l) => l.is_completed);

  // Count exercises that have at least one completed set
  const exercisesWithSets = new Set(
    completedSetLogs.map((l) => l.template_exercise_id).filter(Boolean)
  );

  // Calculate total volume (sum of reps * weight for each completed set)
  let totalVolume = 0;
  for (const log of completedSetLogs) {
    const reps = log.reps_completed ?? 0;
    const weight = parseFloat(log.weight_used ?? "0") || 0;
    totalVolume += reps * weight;
  }

  const totalSets = exercises.reduce(
    (sum, e) => sum + (e.prescribed_sets ?? 0),
    0
  );

  // Fetch PRs achieved in this session
  const { data: prs } = await supabase
    .from("personal_records")
    .select(`
      exercise_id,
      pr_type,
      value,
      previous_value,
      exercise:exercises(name)
    `)
    .eq("session_id", sessionId);

  const prList = (prs ?? []).map((pr) => ({
    exerciseId: pr.exercise_id,
    exerciseName: (pr.exercise as { name: string } | null)?.name ?? "Unknown",
    prType: pr.pr_type,
    value: pr.value,
    previousValue: pr.previous_value,
  }));

  return {
    sessionId,
    templateTitle: template?.title ?? "Workout",
    programTitle: program?.title ?? "",
    date: session.started_at,
    durationSeconds: session.duration_seconds,
    exercisesCompleted: exercisesWithSets.size,
    totalExercises: exercises.length,
    setsCompleted: completedSetLogs.length,
    totalSets,
    totalVolume: Math.round(totalVolume),
    prs: prList,
  };
}
