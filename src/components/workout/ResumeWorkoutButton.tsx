"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { reopenSession } from "@/lib/actions/session.actions";

interface ResumeWorkoutButtonProps {
  sessionId: string;
}

export default function ResumeWorkoutButton({ sessionId }: ResumeWorkoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResume() {
    setLoading(true);
    setError(null);
    const result = await reopenSession(sessionId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        fullWidth
        size="sm"
        loading={loading}
        onClick={handleResume}
      >
        Resume Workout — I&apos;m not done yet
      </Button>
      {error && (
        <p className="text-center text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
