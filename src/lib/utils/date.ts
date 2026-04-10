const DEFAULT_TZ = "America/New_York";

/**
 * Returns today's date in YYYY-MM-DD format in the given timezone.
 * Defaults to America/New_York so server-side calls (Vercel/UTC) return
 * the correct local date for US East Coast users.
 */
export function getTodayISO(tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Returns the current day of week (0=Sun, 1=Mon, ..., 6=Sat) in the given timezone.
 */
export function getTodayDayOfWeek(tz: string = DEFAULT_TZ): number {
  const dayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).format(new Date());
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[dayStr] ?? 0;
}

/**
 * Formats a date string or Date object to a human-readable string
 * e.g. "Mon, Feb 22"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formats a datetime string to relative time
 * e.g. "2 days ago", "just now"
 */
export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return formatDate(date);
}

/**
 * Formats duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Computes a streak of consecutive training days ending today or yesterday.
 * Takes an array of date strings (YYYY-MM-DD), sorted ascending.
 */
export function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const today = getTodayISO();
  const todayDate = new Date(today + "T00:00:00");

  // Deduplicate and sort descending
  const unique = Array.from(new Set(dates)).sort().reverse();

  // The most recent date must be today or yesterday to count
  const mostRecent = unique[0];
  const mostRecentDate = new Date(mostRecent + "T00:00:00");
  const diffDays = Math.floor(
    (todayDate.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays > 1) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1] + "T00:00:00");
    const curr = new Date(unique[i] + "T00:00:00");
    const gap = Math.floor(
      (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (gap === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Returns the Monday of the ISO week for a given date, using UTC.
 * Result is "YYYY-MM-DD" string.
 */
export function getWeekStartUTC(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * Computes a streak of consecutive calendar weeks (Mon–Sun, UTC) with
 * at least one workout. Takes an array of date strings (ISO timestamps
 * or YYYY-MM-DD). Returns the current consecutive week count.
 *
 * If the client logged this week, the current week counts.
 * If not, the streak is still alive if last week was logged
 * (not broken until the current week ends without a log).
 */
export function computeWeekStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const weekSet = new Set<string>();
  for (const d of dates) {
    weekSet.add(getWeekStartUTC(new Date(d)));
  }

  const now = new Date();
  const currentWeekStart = getWeekStartUTC(now);

  // Determine starting week: current if logged, else previous
  let startWeek: string;
  if (weekSet.has(currentWeekStart)) {
    startWeek = currentWeekStart;
  } else {
    const prev = new Date(now);
    prev.setUTCDate(prev.getUTCDate() - 7);
    const prevWeekStart = getWeekStartUTC(prev);
    if (weekSet.has(prevWeekStart)) {
      startWeek = prevWeekStart;
    } else {
      return 0;
    }
  }

  // Walk backward counting consecutive weeks
  let streak = 0;
  const cursor = new Date(startWeek + "T00:00:00Z");
  while (weekSet.has(getWeekStartUTC(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }

  return streak;
}

/**
 * Given a workout template's scheduled_days and scheduled_dates,
 * and an optional client override, determine if it's scheduled today.
 */
export function isScheduledToday(opts: {
  scheduledDays: number[] | null;
  scheduledDates: string[] | null;
}): boolean {
  const today = getTodayISO();
  const todayDow = getTodayDayOfWeek();

  if (opts.scheduledDates && opts.scheduledDates.length > 0) {
    return opts.scheduledDates.includes(today);
  }

  if (opts.scheduledDays && opts.scheduledDays.length > 0) {
    return opts.scheduledDays.includes(todayDow);
  }

  return false;
}
