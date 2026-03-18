import { createClient } from "@/lib/supabase/server";
import { getWeekStartUTC } from "@/lib/utils/date";
import type { VolumeDataPoint } from "@/types/app.types";

// Alias for backward compatibility within this file
const getWeekStart = getWeekStartUTC;

/**
 * Get the first day of the month for a given date.
 */
function getMonthStart(date: Date): string {
  const d = new Date(date);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

/**
 * Resolve userId from optional clientId (coach access) or auth user.
 */
async function resolveUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId?: string
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  if (clientId) {
    const { data: rel } = await supabase
      .from("coach_client_relationships")
      .select("client_id")
      .eq("coach_id", user.id)
      .eq("client_id", clientId)
      .maybeSingle();
    if (!rel) return null;
    return clientId;
  }

  return user.id;
}

/**
 * Fetch raw set log data with session dates and exercise muscle groups.
 * Returns flat rows ready for aggregation.
 */
async function fetchSetLogs(
  clientId?: string,
  cutoffDate?: string
) {
  const supabase = await createClient();
  const userId = await resolveUserId(supabase, clientId);
  if (!userId) return [];

  // Step 1: Get completed sessions for this user within the date range
  let sessionQuery = supabase
    .from("workout_sessions")
    .select("id, started_at")
    .eq("client_id", userId)
    .eq("status", "completed")
    .order("started_at", { ascending: true });

  if (cutoffDate) {
    sessionQuery = sessionQuery.gte("started_at", cutoffDate);
  }

  const { data: sessions } = await sessionQuery;
  if (!sessions || sessions.length === 0) return [];

  const sessionMap = new Map<string, string>();
  for (const s of sessions) {
    sessionMap.set(s.id, s.started_at);
  }

  // Step 2: Get completed set logs for those sessions with exercise data
  const sessionIds = sessions.map((s) => s.id);

  // Supabase .in() has a limit, batch if needed
  const batchSize = 200;
  const allLogs: {
    session_id: string;
    reps_completed: number | null;
    weight_used: string | null;
    template_exercise: {
      exercise: { muscle_group: string | null } | null;
    } | null;
  }[] = [];

  for (let i = 0; i < sessionIds.length; i += batchSize) {
    const batch = sessionIds.slice(i, i + batchSize);
    const { data: logs } = await supabase
      .from("set_logs")
      .select(
        `session_id, reps_completed, weight_used,
         template_exercise:workout_template_exercises(
           exercise:exercises(muscle_group)
         )`
      )
      .in("session_id", batch)
      .eq("is_completed", true);

    if (logs) allLogs.push(...(logs as typeof allLogs));
  }

  // Step 3: Combine with session dates
  return allLogs.map((log) => {
    const startedAt = sessionMap.get(log.session_id) ?? "";
    const muscleGroup =
      (log.template_exercise as { exercise: { muscle_group: string | null } | null } | null)
        ?.exercise?.muscle_group ?? "Other";

    const reps = log.reps_completed ?? 0;
    const weight = parseFloat(log.weight_used ?? "0") || 0;

    return {
      date: new Date(startedAt),
      muscleGroup,
      volume: reps * weight,
      setCount: 1,
    };
  });
}

/**
 * Get total volume per muscle group per week.
 * Default: last 12 weeks. Supports 4, 8, 12, 26.
 */
export async function getWeeklyVolume(
  clientId?: string,
  muscleGroup?: string,
  weeksBack: number = 12
): Promise<VolumeDataPoint[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeksBack * 7);
  const cutoffDate = cutoff.toISOString();

  const logs = await fetchSetLogs(clientId, cutoffDate);
  if (logs.length === 0) return [];

  // Aggregate by week + muscle group
  const map = new Map<string, { totalVolume: number; setCount: number }>();

  for (const log of logs) {
    if (muscleGroup && log.muscleGroup !== muscleGroup) continue;

    const weekStart = getWeekStart(log.date);
    const key = `${weekStart}|${log.muscleGroup}`;

    const existing = map.get(key);
    if (existing) {
      existing.totalVolume += log.volume;
      existing.setCount += log.setCount;
    } else {
      map.set(key, { totalVolume: log.volume, setCount: log.setCount });
    }
  }

  const result: VolumeDataPoint[] = [];
  map.forEach(({ totalVolume, setCount }, key) => {
    const [periodStart, mg] = key.split("|");
    result.push({
      periodStart,
      muscleGroup: mg,
      totalVolume: Math.round(totalVolume),
      setCount,
    });
  });

  result.sort((a, b) => a.periodStart.localeCompare(b.periodStart));
  return result;
}

/**
 * Get total volume per muscle group per month.
 * Default: last 6 months. Supports 3, 6, 12.
 */
export async function getMonthlyVolume(
  clientId?: string,
  muscleGroup?: string,
  monthsBack: number = 6
): Promise<VolumeDataPoint[]> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsBack);
  const cutoffDate = cutoff.toISOString();

  const logs = await fetchSetLogs(clientId, cutoffDate);
  if (logs.length === 0) return [];

  const map = new Map<string, { totalVolume: number; setCount: number }>();

  for (const log of logs) {
    if (muscleGroup && log.muscleGroup !== muscleGroup) continue;

    const monthStart = getMonthStart(log.date);
    const key = `${monthStart}|${log.muscleGroup}`;

    const existing = map.get(key);
    if (existing) {
      existing.totalVolume += log.volume;
      existing.setCount += log.setCount;
    } else {
      map.set(key, { totalVolume: log.volume, setCount: log.setCount });
    }
  }

  const result: VolumeDataPoint[] = [];
  map.forEach(({ totalVolume, setCount }, key) => {
    const [periodStart, mg] = key.split("|");
    result.push({
      periodStart,
      muscleGroup: mg,
      totalVolume: Math.round(totalVolume),
      setCount,
    });
  });

  result.sort((a, b) => a.periodStart.localeCompare(b.periodStart));
  return result;
}
