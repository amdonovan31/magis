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
    if (completedSets === 0 && !confirming) {
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
          You haven&apos;t logged any sets. Complete anyway?
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            fullWidth
            size="lg"
            onClick={() => setConfirming(false)}
          >
            Keep logging
          </Button>
          <Button
            fullWidth
            size="lg"
            variant="accent"
            loading={loading}
            onClick={handleClick}
          >
            Yes, complete
          </Button>
        </div>
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
