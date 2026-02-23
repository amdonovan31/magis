/**
 * Returns today's date in YYYY-MM-DD format (local time)
 */
export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns the current day of week (0=Sun, 1=Mon, ..., 6=Sat)
 */
export function getTodayDayOfWeek(): number {
  return new Date().getDay();
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
