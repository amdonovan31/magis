import { createClient } from "@/lib/supabase/server";
import type { ProgramWithTemplates } from "@/types/app.types";

export interface ProgramPerformanceExercise {
  name: string;
  topWeight: number;
  topReps: number;
  totalVolume: number;
  setCount: number;
  isPR: boolean;
}

export interface ProgramPerformanceSummary {
  sessionCount: number;
  exercises: ProgramPerformanceExercise[];
  cardio: {
    sessionCount: number;
    totalDurationMin: number;
    avgHeartRate: number | null;
    totalDistance: number;
  } | null;
}

/**
 * Aggregate a program's LOGGED performance (what the client actually did),
 * for the progression-mode generator prompt. Returns null when the program
 * has no completed sessions — the caller omits the section in that case.
 *
 * Strength: per-exercise top set (heaviest weight + its reps), total volume,
 * set count, ordered by volume, capped at the top 8. Exercises are flagged
 * isPR when a personal_records row was achieved within the program window
 * (date-canonical comparison — achieved_at sliced to YYYY-MM-DD).
 */
export async function getProgramPerformanceSummary(
  programId: string,
): Promise<ProgramPerformanceSummary | null> {
  const supabase = await createClient();

  const { data: program } = await supabase
    .from("programs")
    .select("client_id, starts_on, ends_on")
    .eq("id", programId)
    .single();
  if (!program || !program.client_id) return null;

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("program_id", programId)
    .eq("status", "completed");
  const sessionIds = (sessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) return null;

  const [{ data: setLogs }, { data: cardioLogs }, { data: prs }] = await Promise.all([
    supabase
      .from("set_logs")
      .select("exercise_id, reps_completed, weight_value, exercise:exercises!exercise_id(name), template_exercise:workout_template_exercises!template_exercise_id(exercise_id, exercise:exercises!exercise_id(name))")
      .in("session_id", sessionIds)
      .eq("is_completed", true)
      .eq("is_skipped", false),
    supabase
      .from("cardio_logs")
      .select("duration_seconds, distance_value, avg_heart_rate")
      .in("session_id", sessionIds),
    supabase
      .from("personal_records")
      .select("exercise_id, achieved_at")
      .eq("user_id", program.client_id),
  ]);

  // PRs achieved within the program window (date-canonical: slice to YYYY-MM-DD).
  const prExerciseIds = new Set(
    (prs ?? [])
      .filter((pr) => {
        const d = (pr.achieved_at as string).slice(0, 10);
        return d >= program.starts_on && d <= program.ends_on;
      })
      .map((pr) => pr.exercise_id as string)
  );

  type Agg = { name: string; topWeight: number; topReps: number; totalVolume: number; setCount: number };
  const byExercise = new Map<string, Agg>();
  for (const sl of setLogs ?? []) {
    const te = sl.template_exercise as
      | { exercise_id: string | null; exercise: { name: string | null } | null }
      | null;
    const directEx = sl.exercise as { name: string | null } | null;
    const exId = (sl.exercise_id as string | null) ?? te?.exercise_id ?? null;
    if (!exId) continue;
    const name = directEx?.name ?? te?.exercise?.name ?? "Unknown exercise";
    const weight = (sl.weight_value as number | null) ?? 0;
    const reps = (sl.reps_completed as number | null) ?? 0;

    let agg = byExercise.get(exId);
    if (!agg) {
      agg = { name, topWeight: 0, topReps: 0, totalVolume: 0, setCount: 0 };
      byExercise.set(exId, agg);
    }
    agg.totalVolume += weight * reps;
    agg.setCount += 1;
    if (weight > agg.topWeight) {
      agg.topWeight = weight;
      agg.topReps = reps;
    }
  }

  const exercises: ProgramPerformanceExercise[] = Array.from(byExercise.entries())
    .map(([exId, agg]) => ({ ...agg, isPR: prExerciseIds.has(exId) }))
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 8);

  const cardioRows = cardioLogs ?? [];
  let cardio: ProgramPerformanceSummary["cardio"] = null;
  if (cardioRows.length > 0) {
    const hrs = cardioRows
      .map((c) => c.avg_heart_rate as number | null)
      .filter((h): h is number => h != null);
    cardio = {
      sessionCount: cardioRows.length,
      totalDurationMin: Math.round(
        cardioRows.reduce((s, c) => s + ((c.duration_seconds as number | null) ?? 0), 0) / 60
      ),
      avgHeartRate: hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null,
      totalDistance: cardioRows.reduce((s, c) => s + ((c.distance_value as number | null) ?? 0), 0),
    };
  }

  return { sessionCount: sessionIds.length, exercises, cardio };
}

export async function getCoachPrograms() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("programs")
    .select(`
      *,
      client:profiles!client_id(id, full_name)
    `)
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getProgramWithTemplates(
  programId: string
): Promise<ProgramWithTemplates | null> {
  const supabase = await createClient();

  const { data } = await supabase
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
    .eq("id", programId)
    .single();

  if (!data) return null;

  // Sort templates by day_number, exercises by position
  const sorted = {
    ...data,
    workout_templates: data.workout_templates
      .sort((a: { day_number: number | null }, b: { day_number: number | null }) =>
        (a.day_number ?? 0) - (b.day_number ?? 0)
      )
      .map((t: { exercises: Array<{ position: number }> } & Record<string, unknown>) => ({
        ...t,
        exercises: t.exercises.sort(
          (a: { position: number }, b: { position: number }) => a.position - b.position
        ),
      })),
  };

  return sorted as unknown as ProgramWithTemplates;
}
