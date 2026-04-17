"use client";

interface ActivityDay {
  date: string;
  dayNum: number;
  status: "completed" | "missed" | "skipped" | "scheduled" | "none";
}

interface ActivityCalendarProps {
  sessions: { date: string; status: "completed" | "missed" | "skipped" }[];
  scheduledDates: string[];
  currentStreak: number;
  longestStreak: number;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function buildCalendarMonth(): { year: number; month: number; daysInMonth: number; startDow: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstOfMonth = new Date(year, month, 1);
  const dow = firstOfMonth.getDay();
  const startDow = dow === 0 ? 6 : dow - 1; // Monday = 0
  return { year, month, daysInMonth, startDow };
}

function buildDays(
  sessions: ActivityCalendarProps["sessions"],
  scheduledDates: string[],
  year: number,
  month: number,
  daysInMonth: number
): ActivityDay[] {
  const sessionMap = new Map(sessions.map((s) => [s.date, s.status]));
  const scheduledSet = new Set(scheduledDates);

  const days: ActivityDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    let status: ActivityDay["status"] = "none";
    if (sessionMap.has(iso)) {
      status = sessionMap.get(iso)!;
    } else if (scheduledSet.has(iso)) {
      status = "scheduled";
    }
    days.push({ date: iso, dayNum: d, status });
  }
  return days;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ActivityCalendar({
  sessions,
  scheduledDates,
  currentStreak,
  longestStreak,
}: ActivityCalendarProps) {
  const { year, month, daysInMonth, startDow } = buildCalendarMonth();
  const days = buildDays(sessions, scheduledDates, year, month, daysInMonth);
  const todayNum = new Date().getDate();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm font-semibold text-primary">
        {MONTH_NAMES[month]} {year}
      </p>

      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-medium text-primary/30 pb-1"
          >
            {label}
          </div>
        ))}

        {Array.from({ length: startDow }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {days.map((day) => {
          const isToday = day.dayNum === todayNum;
          const isFuture = day.dayNum > todayNum;

          let cellClass = "bg-surface text-primary/60";
          if (isFuture) {
            cellClass = "bg-surface text-primary/20";
          } else if (day.status === "completed") {
            cellClass = "bg-primary text-white";
          } else if (day.status === "missed" || day.status === "skipped") {
            cellClass = "bg-surface text-red-500";
          }

          return (
            <div
              key={day.date}
              title={`${day.date} — ${day.status}`}
              className={`flex h-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${cellClass} ${
                isToday ? "ring-2 ring-accent ring-offset-1" : ""
              }`}
            >
              {day.dayNum}
            </div>
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
