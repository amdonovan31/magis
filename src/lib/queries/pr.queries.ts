import { createClient } from "@/lib/supabase/server";
import type { PRSummary, PRHistoryPoint } from "@/types/app.types";

/** Epley formula: estimated 1RM = weight × (1 + reps / 30). For 1 rep, returns weight. */
function estimated1RM(weight: number, reps: number | null): number {
  if (!reps || reps <= 1) return weight;
  const raw = weight * (1 + reps / 30);
  return Math.round(raw * 2) / 2; // round to nearest 0.5
}

/**
 * Get the best weight PR per exercise for a user, with the last 8 PR values
 * for sparklines. Sorted by most recently achieved first.
 *
 * If `clientId` is provided, verifies the caller is the client's coach.
 * Otherwise uses the authenticated user's own data.
 */
export async function getAllPRs(clientId?: string): Promise<PRSummary[]> {
  const supabase = await createClient();

  let userId: string;

  if (clientId) {
    // Coach viewing a client — verify relationship
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: rel } = await supabase
      .from("coach_client_relationships")
      .select("client_id")
      .eq("coach_id", user.id)
      .eq("client_id", clientId)
      .maybeSingle();

    if (!rel) return [];
    userId = clientId;
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    userId = user.id;
  }

  // Fetch all weight PRs for this user, ordered by achieved_at asc (for grouping)
  const { data: allPRs } = await supabase
    .from("personal_records")
    .select(`
      exercise_id,
      value,
      reps,
      unit,
      achieved_at,
      exercise:exercises(name, muscle_group)
    `)
    .eq("user_id", userId)
    .eq("pr_type", "weight")
    .order("achieved_at", { ascending: true });

  if (!allPRs || allPRs.length === 0) return [];

  // Group by exercise
  const byExercise = new Map<
    string,
    {
      exerciseName: string;
      muscleGroup: string | null;
      prs: { value: number; reps: number | null; unit: string; achievedAt: string }[];
    }
  >();

  for (const pr of allPRs) {
    const ex = pr.exercise as { name: string; muscle_group: string | null } | null;
    if (!ex) continue;

    let entry = byExercise.get(pr.exercise_id);
    if (!entry) {
      entry = {
        exerciseName: ex.name,
        muscleGroup: ex.muscle_group,
        prs: [],
      };
      byExercise.set(pr.exercise_id, entry);
    }
    entry.prs.push({
      value: pr.value,
      reps: pr.reps,
      unit: pr.unit ?? "kg",
      achievedAt: pr.achieved_at,
    });
  }

  // Build summary array
  const summaries: PRSummary[] = [];

  type PREntry = { value: number; reps: number | null; unit: string; achievedAt: string };

  byExercise.forEach((entry, exerciseId) => {
    const latest = entry.prs[entry.prs.length - 1];
    const best = entry.prs.reduce<PREntry>((max, p) => (p.value > max.value ? p : max), entry.prs[0]);

    summaries.push({
      exerciseId,
      exerciseName: entry.exerciseName,
      muscleGroup: entry.muscleGroup,
      currentBest: best.value,
      currentBestReps: best.reps,
      estimated1RM: estimated1RM(best.value, best.reps),
      unit: best.unit,
      achievedAt: latest.achievedAt,
      recentPRs: entry.prs.slice(-8).map((p) => ({
        value: p.value,
        achievedAt: p.achievedAt,
      })),
    });
  });

  // Sort by most recently PR'd first
  summaries.sort(
    (a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
  );

  return summaries;
}

/**
 * Get the full weight PR history for a single exercise, ordered date ascending.
 * Used to power the PR detail chart.
 */
export async function getPRHistory(
  exerciseId: string,
  clientId?: string
): Promise<PRHistoryPoint[]> {
  const supabase = await createClient();

  let userId: string;

  if (clientId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: rel } = await supabase
      .from("coach_client_relationships")
      .select("client_id")
      .eq("coach_id", user.id)
      .eq("client_id", clientId)
      .maybeSingle();

    if (!rel) return [];
    userId = clientId;
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    userId = user.id;
  }

  const { data: prs } = await supabase
    .from("personal_records")
    .select("value, reps, unit, achieved_at")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .eq("pr_type", "weight")
    .order("achieved_at", { ascending: true });

  if (!prs) return [];

  return prs.map((pr) => ({
    date: pr.achieved_at,
    weight: pr.value,
    reps: pr.reps,
    estimated1RM: estimated1RM(pr.value, pr.reps),
    unit: pr.unit ?? "kg",
  }));
}
