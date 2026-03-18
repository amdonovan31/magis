import { createClient } from "@/lib/supabase/server";
import { getWeekStartUTC } from "@/lib/utils/date";
import type {
  StreakData,
  StreakSummary,
  WeekEntry,
  StreakMilestone,
} from "@/types/app.types";
import { STREAK_MILESTONES as MILESTONES } from "@/types/app.types";

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
 * Get the set of week-start Mondays (UTC) that have at least one
 * completed workout session for the given user.
 */
async function getLoggedWeeks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  cutoffDate: string
): Promise<Set<string>> {
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("started_at")
    .eq("client_id", userId)
    .eq("status", "completed")
    .gte("started_at", cutoffDate)
    .order("started_at", { ascending: true });

  const weekSet = new Set<string>();
  for (const s of sessions ?? []) {
    weekSet.add(getWeekStartUTC(new Date(s.started_at)));
  }
  return weekSet;
}

/**
 * Generate an array of Monday dates for the last N weeks, oldest first.
 */
function generateWeekStarts(weeks: number): string[] {
  const result: string[] = [];
  const now = new Date();
  const currentMonday = getWeekStartUTC(now);

  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(currentMonday + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - i * 7);
    result.push(getWeekStartUTC(d));
  }
  return result;
}

/**
 * Compute current streak: consecutive weeks ending at current or previous week.
 */
function computeCurrentStreak(
  weekSet: Set<string>,
  currentWeekStart: string
): number {
  // Determine starting week
  let startWeek: string;
  if (weekSet.has(currentWeekStart)) {
    startWeek = currentWeekStart;
  } else {
    const prev = new Date(currentWeekStart + "T00:00:00Z");
    prev.setUTCDate(prev.getUTCDate() - 7);
    const prevWeekStart = getWeekStartUTC(prev);
    if (weekSet.has(prevWeekStart)) {
      startWeek = prevWeekStart;
    } else {
      return 0;
    }
  }

  let streak = 0;
  const cursor = new Date(startWeek + "T00:00:00Z");
  while (weekSet.has(getWeekStartUTC(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  return streak;
}

/**
 * Compute longest streak from all logged weeks.
 */
function computeLongestStreak(weekSet: Set<string>): number {
  if (weekSet.size === 0) return 0;

  const sorted = Array.from(weekSet).sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00Z");
    const curr = new Date(sorted[i] + "T00:00:00Z");
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 7) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

/**
 * Full streak data for client views (home, history, coach detail).
 * Derives everything from workout_sessions — no separate streak table.
 *
 * Week boundaries use UTC (Mon 00:00 – Sun 23:59 UTC).
 */
export async function getStreakData(
  clientId?: string
): Promise<StreakData> {
  const supabase = await createClient();
  const userId = await resolveUserId(supabase, clientId);

  const empty: StreakData = {
    currentStreak: 0,
    longestStreak: 0,
    currentWeekLogged: false,
    lastLoggedWeek: null,
    streakHistory: [],
    milestoneReached: null,
    isNewLongest: false,
    weeksLoggedThisYear: 0,
  };

  if (!userId) return empty;

  // Query sessions from last 53 weeks
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 53 * 7);
  const cutoffISO = cutoff.toISOString();

  const weekSet = await getLoggedWeeks(supabase, userId, cutoffISO);

  if (weekSet.size === 0) {
    // Return empty history grid
    const allWeeks = generateWeekStarts(52);
    const currentWeekStart = getWeekStartUTC(new Date());
    return {
      ...empty,
      streakHistory: allWeeks.map((w) => ({
        weekStart: w,
        hasWorkout: false,
        isCurrentWeek: w === currentWeekStart,
      })),
    };
  }

  const currentWeekStart = getWeekStartUTC(new Date());
  const allWeeks = generateWeekStarts(52);

  // Build history
  const streakHistory: WeekEntry[] = allWeeks.map((w) => ({
    weekStart: w,
    hasWorkout: weekSet.has(w),
    isCurrentWeek: w === currentWeekStart,
  }));

  const currentStreak = computeCurrentStreak(weekSet, currentWeekStart);
  const longestStreak = computeLongestStreak(weekSet);
  const currentWeekLogged = weekSet.has(currentWeekStart);

  // Last logged week
  const sortedWeeks = Array.from(weekSet).sort();
  const lastLoggedWeek = sortedWeeks[sortedWeeks.length - 1] ?? null;

  // Weeks logged this year
  const currentYear = new Date().getUTCFullYear();
  const yearStart = `${currentYear}-01-01`;
  let weeksLoggedThisYear = 0;
  Array.from(weekSet).forEach((w) => {
    if (w >= yearStart) weeksLoggedThisYear++;
  });

  // Milestone check
  let milestoneReached: StreakMilestone | null = null;
  for (const m of MILESTONES) {
    if (currentStreak === m) {
      milestoneReached = m;
      break;
    }
  }

  const isNewLongest =
    currentStreak === longestStreak && currentStreak > 1;

  return {
    currentStreak,
    longestStreak,
    currentWeekLogged,
    lastLoggedWeek,
    streakHistory,
    milestoneReached,
    isNewLongest,
    weeksLoggedThisYear,
  };
}

/**
 * Lightweight streak summary for coach client list.
 */
export async function getStreakSummaryForCoach(
  clientId: string
): Promise<StreakSummary> {
  const supabase = await createClient();
  const userId = await resolveUserId(supabase, clientId);

  if (!userId) {
    return { currentStreak: 0, longestStreak: 0, currentWeekLogged: false };
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 53 * 7);
  const cutoffISO = cutoff.toISOString();

  const weekSet = await getLoggedWeeks(supabase, userId, cutoffISO);
  const currentWeekStart = getWeekStartUTC(new Date());

  return {
    currentStreak: computeCurrentStreak(weekSet, currentWeekStart),
    longestStreak: computeLongestStreak(weekSet),
    currentWeekLogged: weekSet.has(currentWeekStart),
  };
}
