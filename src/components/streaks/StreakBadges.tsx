"use client";

import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import { STREAK_MILESTONES, STREAK_MILESTONE_LABELS } from "@/types/app.types";


interface StreakBadgesProps {
  longestStreak: number;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function StreakBadges({ longestStreak }: StreakBadgesProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {STREAK_MILESTONES.map((milestone) => {
        const achieved = longestStreak >= milestone;
        return (
          <Card
            key={milestone}
            padding="sm"
            className={cn(
              "text-center",
              achieved && "border-l-2 border-l-accent"
            )}
          >
            <div className="flex flex-col items-center gap-1 py-1">
              {achieved ? (
                <CheckIcon className="h-4 w-4 text-accent" />
              ) : (
                <LockIcon className="h-4 w-4 text-primary/20" />
              )}
              <p
                className={cn(
                  "text-lg font-bold",
                  achieved ? "text-primary" : "text-primary/30"
                )}
              >
                {milestone}
              </p>
              <p
                className={cn(
                  "text-[10px] leading-tight",
                  achieved ? "text-primary/60" : "text-primary/20"
                )}
              >
                {STREAK_MILESTONE_LABELS[milestone]}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
