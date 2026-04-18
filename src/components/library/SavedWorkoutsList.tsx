"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils/date";
import { deleteSavedWorkout, startFromSavedWorkout } from "@/lib/actions/saved-workout.actions";
import type { SavedWorkoutRow } from "@/lib/queries/saved-workout.queries";

const SWIPE_THRESHOLD = 60;

interface SavedWorkoutsListProps {
  workouts: SavedWorkoutRow[];
}

export default function SavedWorkoutsList({ workouts }: SavedWorkoutsListProps) {
  return (
    <div className="flex flex-col gap-3">
      {workouts.map((w) => (
        <SavedWorkoutCard key={w.id} workout={w} />
      ))}
    </div>
  );
}

function SavedWorkoutCard({ workout }: { workout: SavedWorkoutRow }) {
  const [swipeX, setSwipeX] = useState(0);
  const [deleted, setDeleted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [, startTransition] = useTransition();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSwipingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isSwipingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;
    if (!isSwipingRef.current && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isSwipingRef.current = true;
    }
    if (isSwipingRef.current) {
      setSwipeX(Math.min(0, dx));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (swipeX < -SWIPE_THRESHOLD) {
      if (confirm("Delete this saved workout?")) {
        setDeleted(true);
        startTransition(() => {
          deleteSavedWorkout(workout.id);
        });
      }
    }
    setSwipeX(0);
    touchStartRef.current = null;
    isSwipingRef.current = false;
  }, [swipeX, workout.id]);

  async function handleStart() {
    setStarting(true);
    await startFromSavedWorkout(workout.id);
  }

  if (deleted) return null;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? "transform 0.2s" : "none" }}
    >
      <button
        onClick={handleStart}
        disabled={starting}
        className="w-full text-left"
      >
        <Card className="active:scale-[0.98] transition-transform">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-primary truncate">{workout.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-primary/40">
                  {workout.exercise_count} exercise{workout.exercise_count !== 1 ? "s" : ""}
                </span>
                {workout.use_count > 0 && (
                  <span className="text-xs text-primary/30">
                    Used {workout.use_count}x
                  </span>
                )}
              </div>
              {workout.last_used_at && (
                <p className="text-xs text-primary/30 mt-0.5">
                  Last used {formatRelativeTime(workout.last_used_at)}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant={workout.source === "program" ? "accent" : "default"}>
                {workout.source === "program"
                  ? `From: ${workout.source_program_title ?? "Program"}`
                  : "Custom"}
              </Badge>
              {starting && (
                <span className="text-xs text-primary/40">Starting...</span>
              )}
            </div>
          </div>
        </Card>
      </button>
    </div>
  );
}
