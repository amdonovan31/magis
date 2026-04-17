"use client";

import { useState, useMemo } from "react";

interface ActivityCalendarProps {
  sessions: { date: string; status: "completed" | "missed" | "skipped" }[];
  scheduledDates: string[];
  currentStreak: number;
  longestStreak: number;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getSunday(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ActivityCalendar({
  sessions,
  scheduledDates,
  currentStreak,
  longestStreak,
}: ActivityCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const sessionMap = useMemo(
    () => new Map(sessions.map((s) => [s.date, s.status])),
    [sessions]
  );
  const scheduledSet = useMemo(() => new Set(scheduledDates), [scheduledDates]);

  const todayIso = toIso(new Date());

  const thisSunday = getSunday(new Date());

  // Default view: 4 weeks ending with current week
  // weekOffset shifts the window: negative = further back, positive = forward
  const startSunday = new Date(thisSunday);
  startSunday.setDate(startSunday.getDate() - 21 + weekOffset * 7);

  const endSaturday = new Date(startSunday);
  endSaturday.setDate(endSaturday.getDate() + 27);

  const days: { date: string; dayNum: number; status: string }[] = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(startSunday);
    d.setDate(d.getDate() + i);
    const iso = toIso(d);
    let status = "none";
    if (sessionMap.has(iso)) {
      status = sessionMap.get(iso)!;
    } else if (scheduledSet.has(iso)) {
      status = "scheduled";
    }
    days.push({ date: iso, dayNum: d.getDate(), status });
  }

  const rangeLabel = `${formatShortDate(startSunday)} – ${formatShortDate(endSaturday)}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((o) => o - 4)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-primary/40 hover:text-primary hover:bg-primary/5 transition-colors"
          aria-label="Previous weeks"
        >
          &#x25B2;
        </button>
        <p className="text-center text-sm font-semibold text-primary">
          {rangeLabel}
        </p>
        <button
          onClick={() => setWeekOffset((o) => o + 4)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-primary/40 hover:text-primary hover:bg-primary/5 transition-colors"
          aria-label="Next weeks"
        >
          &#x25BC;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-medium text-primary/30 pb-1"
          >
            {label}
          </div>
        ))}

        {days.map((day) => {
          const isToday = day.date === todayIso;
          const isFuture = day.date > todayIso;

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
              <span className="font-semibold text-primary">
                {currentStreak}w
              </span>{" "}
              streak
            </>
          ) : (
            "No active streak"
          )}
        </span>
        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs font-medium text-accent hover:underline"
          >
            Today
          </button>
        )}
        <span>
          Best:{" "}
          <span className="font-semibold text-primary">{longestStreak}w</span>
        </span>
      </div>
    </div>
  );
}
