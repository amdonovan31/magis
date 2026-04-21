"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { fetchWeekWorkouts } from "@/lib/actions/calendar.actions";
import type { ScheduledWorkoutWithDetails, ProgramOverview, ProgramOverviewWorkout } from "@/lib/queries/calendar.queries";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarClientProps {
  workouts: ScheduledWorkoutWithDetails[];
  weekStart: string;
  programOverview: ProgramOverview;
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

export default function CalendarClient({ workouts: initialWorkouts, weekStart: initialWeekStart, programOverview }: CalendarClientProps) {
  const todayStr = toLocalDateString(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(initialWeekStart);
  const [workouts, setWorkouts] = useState(initialWorkouts);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"calendar" | "program">("calendar");

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
    const dayWorkouts = workouts.filter((w) => w.scheduled_date === dateStr);
    const hasWorkout = dayWorkouts.length > 0;
    const hasCompleted = dayWorkouts.some((w) => w.status === "completed");
    return { label, dateStr, dayNum: d.getDate(), hasWorkout, hasCompleted };
  });

  const dayWorkouts = workouts.filter((w) => w.scheduled_date === selectedDate);

  return (
    <div>
      {/* Tab toggle */}
      <div className="mx-5 mb-4 flex rounded-xl bg-surface p-1">
        <button
          onClick={() => setActiveTab("calendar")}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors",
            activeTab === "calendar" ? "bg-accent text-accent-light" : "text-muted"
          )}
        >
          Calendar
        </button>
        <button
          onClick={() => setActiveTab("program")}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors",
            activeTab === "program" ? "bg-accent text-accent-light" : "text-muted"
          )}
        >
          Program
        </button>
      </div>

      {activeTab === "program" && (
        <ProgramOverviewView overview={programOverview} />
      )}

      {activeTab === "calendar" && <>
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
                        : day.hasCompleted
                          ? "bg-green-500"
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
      </>}
    </div>
  );
}

function ProgramOverviewView({ overview }: { overview: ProgramOverview }) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(() => {
    if (!overview) return new Set();
    return new Set([overview.currentWeek]);
  });

  function toggleWeek(weekNum: number) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekNum)) next.delete(weekNum);
      else next.add(weekNum);
      return next;
    });
  }

  if (!overview) {
    return (
      <div className="flex flex-col items-center py-16 px-4 text-center">
        <p className="text-4xl mb-3">📋</p>
        <p className="font-semibold text-primary">No active program assigned yet</p>
        <p className="text-sm text-muted mt-1">Your coach will assign a program when it&apos;s ready.</p>
      </div>
    );
  }

  const weekMap = new Map<number, ProgramOverviewWorkout[]>();
  for (const w of overview.workouts) {
    const wn = w.template.week_number ?? 1;
    if (!weekMap.has(wn)) weekMap.set(wn, []);
    weekMap.get(wn)!.push(w);
  }
  const sortedWeeks = Array.from(weekMap.entries()).sort(([a], [b]) => a - b);

  return (
    <div className="px-4">
      <div className="mb-4">
        <h2 className="font-heading text-lg font-semibold text-primary">{overview.programTitle}</h2>
        <p className="text-xs uppercase tracking-wider text-muted">
          Week {overview.currentWeek} of {overview.totalWeeks}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        {sortedWeeks.map(([weekNum, weekWorkouts]) => {
          const isExpanded = expandedWeeks.has(weekNum);
          const isCurrent = weekNum === overview.currentWeek;
          return (
            <div key={weekNum}>
              <button
                onClick={() => toggleWeek(weekNum)}
                className="flex w-full items-center justify-between px-1 py-3"
              >
                <span className="text-sm font-semibold text-primary">
                  Week {weekNum}
                  {isCurrent && <span className="ml-2 text-xs text-accent">(Current)</span>}
                </span>
                <svg
                  className={cn("h-4 w-4 text-primary/40 transition-transform", isExpanded && "rotate-180")}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="flex flex-col gap-3 pb-4">
                  {weekWorkouts.map((workout) => {
                    const isCompleted = workout.status === "completed" && workout.session_id;
                    const isMissed = workout.status === "missed";
                    const isSkipped = workout.status === "skipped";
                    const href = isCompleted
                      ? `/workout/${workout.session_id}/summary`
                      : `/calendar/${workout.id}`;

                    const dateObj = new Date(workout.scheduled_date + "T00:00:00");
                    const dateLabel = dateObj.toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric",
                    });

                    return (
                      <Link key={workout.id} href={href}>
                        <Card className={cn(
                          "active:scale-[0.98] transition-transform",
                          isMissed && "opacity-50"
                        )}>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="text-sm font-semibold text-primary">{workout.template.title}</h3>
                              <p className="text-xs text-muted">{dateLabel}</p>
                            </div>
                            {isCompleted && <Badge variant="success">Completed</Badge>}
                            {isMissed && (
                              <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                                Missed
                              </span>
                            )}
                            {isSkipped && (
                              <span className="rounded-full bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary/40">
                                Skipped
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {workout.template.exercises.map((ex) => (
                              <p key={ex.id} className="text-xs text-muted">
                                {ex.exercise?.name}
                                {ex.prescribed_sets && ex.prescribed_reps && (
                                  <span className="text-primary/30 ml-1">
                                    &mdash; {ex.prescribed_sets}&times;{ex.prescribed_reps}
                                  </span>
                                )}
                              </p>
                            ))}
                          </div>
                          {isCompleted && (
                            <p className="mt-2 text-[10px] text-green-500/70">
                              &#x2713; {workout.template.exercises.length} exercises completed
                            </p>
                          )}
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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

  const isCompleted = workout.status === "completed" && workout.session_id;

  return (
    <Link href={isCompleted ? `/workout/${workout.session_id}/summary` : `/calendar/${workout.id}`}>
      <Card className="active:scale-[0.98] transition-transform">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold text-primary">
              {workout.template.title}
            </h3>
            {isCompleted ? (
              <Badge variant="success">Completed</Badge>
            ) : workout.status === "skipped" ? (
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
          {isCompleted && (
            <Button size="sm" fullWidth className="mt-1">
              View Summary →
            </Button>
          )}
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
