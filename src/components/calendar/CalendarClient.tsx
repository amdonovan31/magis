"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import type { ScheduledWorkoutWithDetails } from "@/lib/queries/calendar.queries";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarClientProps {
  workouts: ScheduledWorkoutWithDetails[];
  weekStart: string; // YYYY-MM-DD (Monday)
}

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarClient({ workouts, weekStart }: CalendarClientProps) {
  const todayStr = toLocalDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Build the 7 days of the week
  const weekDays = DAY_LABELS.map((label, i) => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + i);
    const dateStr = toLocalDateString(d);
    const hasWorkout = workouts.some((w) => w.scheduled_date === dateStr);
    return { label, dateStr, dayNum: d.getDate(), hasWorkout };
  });

  const dayWorkouts = workouts.filter((w) => w.scheduled_date === selectedDate);

  return (
    <div>
      {/* Week strip */}
      <div className="overflow-x-auto px-3">
        <div className="flex gap-1 min-w-max">
          {weekDays.map((day) => {
            const isToday = day.dateStr === todayStr;
            const isSelected = day.dateStr === selectedDate;
            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDate(day.dateStr)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-4 py-3 transition-colors min-w-[52px]",
                  isToday && !isSelected && "bg-accent/10",
                  isSelected && "bg-accent",
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider",
                    isSelected ? "text-accent-light" : "text-muted"
                  )}
                >
                  {day.label}
                </span>
                <span
                  className={cn(
                    "text-lg font-bold",
                    isSelected
                      ? "text-accent-light"
                      : isToday
                        ? "text-accent"
                        : "text-primary"
                  )}
                >
                  {day.dayNum}
                </span>
                {/* Workout dot */}
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    day.hasWorkout
                      ? isSelected
                        ? "bg-accent-light"
                        : "bg-accent"
                      : "bg-transparent"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Workout list for selected day */}
      <div className="mt-6 px-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          {formatDisplayDate(selectedDate)}
        </p>

        {dayWorkouts.length === 0 ? (
          <NoWorkoutMessage hasAnyWorkouts={workouts.length > 0} />
        ) : (
          <div className="flex flex-col gap-3">
            {dayWorkouts.map((w) => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkoutCard({ workout }: { workout: ScheduledWorkoutWithDetails }) {
  const muscleGroups = Array.from(
    new Set(
      workout.template.exercises
        .map((e) => e.exercise?.muscle_group)
        .filter(Boolean)
    )
  );

  return (
    <Link href={`/calendar/${workout.id}`}>
      <Card className="active:scale-[0.98] transition-transform">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold text-primary">
              {workout.template.title}
            </h3>
            <span className="text-xs text-muted">
              {workout.template.exercises.length} exercises
            </span>
          </div>
          {muscleGroups.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {muscleGroups.map((mg) => (
                <span
                  key={mg}
                  className="rounded-full bg-surface border border-primary/5 px-2.5 py-0.5 text-xs text-muted"
                >
                  {mg}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-muted">{workout.program.title}</p>
        </div>
      </Card>
    </Link>
  );
}

function NoWorkoutMessage({ hasAnyWorkouts }: { hasAnyWorkouts: boolean }) {
  if (!hasAnyWorkouts) {
    return (
      <Card padding="lg" className="text-center">
        <p className="text-sm text-primary/40">
          No program assigned yet. Check back soon.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="text-center">
      <div className="text-4xl mb-3">🌿</div>
      <h2 className="text-lg font-semibold text-primary">Rest Day</h2>
      <p className="mt-1 text-sm text-muted">
        No workout scheduled. Rest up!
      </p>
    </Card>
  );
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
