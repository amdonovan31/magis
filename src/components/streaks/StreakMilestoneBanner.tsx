"use client";

import Card from "@/components/ui/Card";
import type { StreakData } from "@/types/app.types";
import { STREAK_MILESTONE_LABELS } from "@/types/app.types";

interface StreakMilestoneBannerProps {
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

export default function StreakMilestoneBanner({
  streakData,
}: StreakMilestoneBannerProps) {
  const { currentStreak, milestoneReached, isNewLongest } = streakData;

  if (currentStreak === 0) return null;

  const hasMilestone = milestoneReached !== null || isNewLongest;

  return (
    <Card padding="md">
      <div className="flex items-center gap-3">
        <FlameIcon className="h-6 w-6 text-accent flex-shrink-0" />
        <div>
          <p className="font-semibold text-primary">
            {currentStreak} {currentStreak === 1 ? "week" : "weeks"} streak
          </p>
          {hasMilestone && (
            <p className="text-sm text-accent mt-0.5">
              {milestoneReached !== null
                ? STREAK_MILESTONE_LABELS[milestoneReached]
                : "New longest streak!"}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
