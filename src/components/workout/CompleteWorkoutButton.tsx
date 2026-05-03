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
  const [step, setStep] = useState<"idle" | "no-sets" | "confirm">("idle");
  const [loading, setLoading] = useState(false);

  function handleClick() {
    if (completedSets === 0) {
      setStep("no-sets");
      return;
    }
    setStep("confirm");
  }

  async function handleConfirm() {
    setLoading(true);
    await clearPersistedSession(sessionId);
    await onComplete();
  }

  if (step === "no-sets") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-center text-sm text-primary/60">
          Log at least one set before completing this workout.
        </p>
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          onClick={() => setStep("idle")}
        >
          Keep logging
        </Button>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-center text-sm text-primary/60">
          Are you sure you want to finish this workout?
        </p>
        <Button
          fullWidth
          size="lg"
          variant="accent"
          loading={loading}
          onClick={handleConfirm}
        >
          Yes, complete workout ✓
        </Button>
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          onClick={() => setStep("idle")}
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
      onClick={handleClick}
    >
      Complete Workout ✓
    </Button>
  );
}
