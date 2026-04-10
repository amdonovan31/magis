"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { clearPersistedSession } from "@/lib/workout-persistence";

interface CompleteWorkoutButtonProps {
  sessionId: string;
  completedSets: number;
  onComplete: () => Promise<void>;
}

export default function CompleteWorkoutButton({
  sessionId,
  completedSets,
  onComplete,
}: CompleteWorkoutButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (completedSets === 0) {
      // Server-side guard blocks empty completions; surface that requirement here
      // instead of letting the user attempt and fail silently.
      setConfirming(true);
      return;
    }
    setLoading(true);
    clearPersistedSession(sessionId);
    await onComplete();
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-center text-sm text-primary/60">
          Log at least one set before completing this workout.
        </p>
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          onClick={() => setConfirming(false)}
        >
          Keep logging
        </Button>
      </div>
    );
  }

  return (
    <Button
      fullWidth
      size="lg"
      variant="accent"
      loading={loading}
      onClick={handleClick}
    >
      Complete Workout ✓
    </Button>
  );
}
