"use client";

import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import type { StreakData, StreakMilestone } from "@/types/app.types";
import { STREAK_MILESTONE_LABELS } from "@/types/app.types";

interface StreakCardProps {
  streakData: StreakData;
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 23c-3.6 0-8-3.1-8-8.5C4 9 8 3 12 1c4 2 8 8 8 13.5 0 5.4-4.4 8.5-8 8.5zm0-19.5C9.3 6.2 6 11.1 6 14.5 6 18.5 9 21 12 21s6-2.5 6-6.5c0-3.4-3.3-8.3-6-11z" />
    </svg>
  );
}

export default function StreakCard({ streakData }: StreakCardProps) {
  const {
    currentStreak,
    longestStreak,
    currentWeekLogged,
    streakHistory,
    milestoneReached,
    isNewLongest,
    weeksLoggedThisYear,
  } = streakData;

  const hasAnyHistory = streakHistory.some((w) => w.hasWorkout);

  // Check if nudge should show (Wednesday or later, not yet logged this week)
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const showNudge =
    !currentWeekLogged && currentStreak > 0 && dayOfWeek >= 3 && dayOfWeek !== 0;

  // Take last 12 weeks for the grid
  const recentWeeks = streakHistory.slice(-12);

  // Empty state
  if (currentStreak === 0 && !hasAnyHistory) {
    return (
      <Card>
        <div className="flex flex-col items-center py-4 text-center">
          <FlameIcon className="h-8 w-8 text-primary/20 mb-2" />
          <p className="font-semibold text-primary">Start your streak</p>
          <p className="text-sm text-primary/50 mt-1">
            Complete your first workout to start building your streak.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {/* Row 1: Flame + streak count */}
      <div className="flex items-center gap-3">
        <FlameIcon
          className={cn(
            "h-8 w-8 flex-shrink-0",
            currentStreak > 0 ? "text-accent" : "text-primary/20"
          )}
        />
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-primary">
            {currentStreak}
          </span>
          <span className="text-sm text-primary/60">
            {currentStreak === 1 ? "week streak" : "weeks streak"}
          </span>
        </div>
        {currentWeekLogged && (
          <span
            className="ml-auto h-2.5 w-2.5 rounded-full bg-green-500 flex-shrink-0"
            title="Logged this week"
          />
        )}
      </div>

      {/* Row 2: Stats */}
      <div className="mt-3 flex gap-4 text-xs text-primary/50">
        <span>
          Longest:{" "}
          <span className="font-medium text-primary/70">
            {longestStreak} wk
          </span>
        </span>
        <span>
          This year:{" "}
          <span className="font-medium text-primary/70">
            {weeksLoggedThisYear} wk
          </span>
        </span>
      </div>

      {/* Row 3: 12-week grid */}
      <div className="mt-3">
        <div className="grid grid-cols-12 gap-1.5">
          {recentWeeks.map((week) => (
            <div
              key={week.weekStart}
              className={cn(
                "aspect-square rounded-sm",
                week.hasWorkout ? "bg-accent" : "bg-primary/10",
                week.isCurrentWeek && !week.hasWorkout && "ring-1 ring-accent"
              )}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-primary/30">
          <span>12w ago</span>
          <span>This week</span>
        </div>
      </div>

      {/* Row 4: Milestone banner */}
      {(milestoneReached !== null || isNewLongest) && (
        <div className="mt-3 rounded-lg bg-accent/10 px-3 py-2 text-center text-sm font-medium text-accent">
          {isNewLongest && milestoneReached === null
            ? `${currentStreak} weeks — New longest streak!`
            : milestoneReached !== null
              ? `${currentStreak} ${currentStreak === 1 ? "week" : "weeks"} — ${STREAK_MILESTONE_LABELS[milestoneReached]}`
              : null}
        </div>
      )}

      {/* Row 5: Nudge */}
      {showNudge && (
        <p className="mt-2 text-sm text-primary/50 text-center">
          Log a workout to keep your streak going
        </p>
      )}
    </Card>
  );
}
