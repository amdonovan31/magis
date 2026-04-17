"use client";

interface ActivityDay {
  date: string;
  status: "completed" | "missed" | "skipped" | "scheduled" | "none";
}

interface ActivityCalendarProps {
  sessions: { date: string; status: "completed" | "missed" | "skipped" }[];
  scheduledDates: string[];
  currentStreak: number;
  longestStreak: number;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function buildDays(
  sessions: ActivityCalendarProps["sessions"],
  scheduledDates: string[]
): ActivityDay[] {
  const sessionMap = new Map(sessions.map((s) => [s.date, s.status]));
  const scheduledSet = new Set(scheduledDates);

  const today = new Date();
  const days: ActivityDay[] = [];

  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];

    if (sessionMap.has(iso)) {
      days.push({ date: iso, status: sessionMap.get(iso)! });
    } else if (scheduledSet.has(iso)) {
      days.push({ date: iso, status: "scheduled" });
    } else {
      days.push({ date: iso, status: "none" });
    }
  }

  return days;
}

export default function ActivityCalendar({
  sessions,
  scheduledDates,
  currentStreak,
  longestStreak,
}: ActivityCalendarProps) {
  const days = buildDays(sessions, scheduledDates);
  const todayIso = new Date().toISOString().split("T")[0];

  const firstDayOfWeek = new Date(days[0].date).getDay();
  const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 justify-center">
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="w-8 text-center text-[10px] font-medium text-primary/30"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1 justify-center">
        {Array.from({ length: mondayOffset }).map((_, i) => (
          <div key={`pad-${i}`} className="h-8 w-8" />
        ))}

        {days.map((day) => {
          const isToday = day.date === todayIso;
          let bg = "bg-primary/8";
          if (day.status === "completed") bg = "bg-primary";
          else if (day.status === "missed" || day.status === "skipped")
            bg = "bg-transparent border-2 border-red-300";
          else if (day.status === "scheduled")
            bg = "bg-transparent border-2 border-primary/20";

          return (
            <div
              key={day.date}
              title={`${day.date} — ${day.status}`}
              className={`h-8 w-8 rounded-md transition-colors ${bg} ${
                isToday ? "ring-2 ring-accent ring-offset-1" : ""
              }`}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-primary/50 px-1">
        <span>
          {currentStreak > 0 ? (
            <>
              <span className="font-semibold text-primary">{currentStreak}w</span> streak
            </>
          ) : (
            "No active streak"
          )}
        </span>
        <span>
          Best: <span className="font-semibold text-primary">{longestStreak}w</span>
        </span>
      </div>
    </div>
  );
}
