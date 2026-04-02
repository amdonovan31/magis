"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import { fetchWeekWorkouts } from "@/lib/actions/calendar.actions";
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

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}

function formatWeekRange(weekStart: string): string {
  const mon = new Date(weekStart + "T00:00:00");
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const monStr = mon.toLocaleDateString("en-US", opts);
  const sunStr = sun.toLocaleDateString("en-US", opts);
  return `${monStr} – ${sunStr}`;
}

export default function CalendarClient({ workouts: initialWorkouts, weekStart: initialWeekStart }: CalendarClientProps) {
  const todayStr = toLocalDateString(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(initialWeekStart);
  const [workouts, setWorkouts] = useState(initialWorkouts);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [loading, setLoading] = useState(false);

  const isInitialWeek = currentWeekStart === initialWeekStart;

  const navigateWeek = useCallback(async (newWeekStart: string, isOriginalWeek: boolean) => {
    setCurrentWeekStart(newWeekStart);
    if (isOriginalWeek) {
      setWorkouts(initialWorkouts);
      setSelectedDate(todayStr);
    } else {
      setSelectedDate(newWeekStart); // Select Monday of new week
      setLoading(true);
      const data = await fetchWeekWorkouts(newWeekStart);
      setWorkouts(data);
      setLoading(false);
    }
  }, [initialWorkouts, todayStr]);

  // Keep initialWorkouts in sync if server re-renders
  useEffect(() => {
    if (isInitialWeek) {
      setWorkouts(initialWorkouts);
    }
  }, [initialWorkouts, isInitialWeek]);

  function handlePrev() {
    const newStart = addDays(currentWeekStart, -7);
    navigateWeek(newStart, newStart === initialWeekStart);
  }

  function handleNext() {
    const newStart = addDays(currentWeekStart, 7);
    navigateWeek(newStart, newStart === initialWeekStart);
  }

  // Build the 7 days of the week
  const weekDays = DAY_LABELS.map((label, i) => {
    const d = new Date(currentWeekStart + "T00:00:00");
    d.setDate(d.getDate() + i);
    const dateStr = toLocalDateString(d);
    const hasWorkout = workouts.some((w) => w.scheduled_date === dateStr);
    return { label, dateStr, dayNum: d.getDate(), hasWorkout };
  });

  const dayWorkouts = workouts.filter((w) => w.scheduled_date === selectedDate);

  return (
    <div>
      {/* Week navigation header */}
      <div className="flex items-center justify-between px-5 pb-3">
        <button
          onClick={handlePrev}
          className="flex h-8 w-8 items-center justify-center rounded-full text-primary/60 hover:text-primary hover:bg-primary/5 transition-colors"
          aria-label="Previous week"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-primary">
          {formatWeekRange(currentWeekStart)}
        </span>
        <button
          onClick={handleNext}
          className="flex h-8 w-8 items-center justify-center rounded-full text-primary/60 hover:text-primary hover:bg-primary/5 transition-colors"
          aria-label="Next week"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

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

        {loading ? (
          <Card padding="lg" className="text-center">
            <p className="text-sm text-muted">Loading...</p>
          </Card>
        ) : dayWorkouts.length === 0 ? (
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
            {workout.status === "skipped" ? (
              <span className="inline-flex items-center rounded-full bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary/40">
                Skipped
              </span>
            ) : (
              <span className="text-xs text-muted">
                {workout.template.exercises.length} exercises
              </span>
            )}
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
