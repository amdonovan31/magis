"use client";

import { useState, useCallback } from "react";
import ExerciseLogger from "./ExerciseLogger";
import RestTimer from "./RestTimer";
import type { WorkoutTemplateWithExercises, SetLog } from "@/types/app.types";

interface WorkoutClientProps {
  sessionId: string;
  template: WorkoutTemplateWithExercises;
  setLogs: SetLog[];
}

export default function WorkoutClient({
  sessionId,
  template,
  setLogs,
}: WorkoutClientProps) {
  const [restSeconds, setRestSeconds] = useState<number | null>(null);

  const handleSetComplete = useCallback((seconds: number) => {
    setRestSeconds(seconds);
  }, []);

  const handleDismissTimer = useCallback(() => {
    setRestSeconds(null);
  }, []);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 pb-32">
        {template.exercises?.map((te) => (
          <div key={te.id} className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <ExerciseLogger
              sessionId={sessionId}
              templateExercise={te}
              existingLogs={setLogs.filter(
                (l) => l.template_exercise_id === te.id
              )}
              onSetComplete={handleSetComplete}
            />
          </div>
        ))}
      </div>

      {restSeconds !== null && (
        <RestTimer seconds={restSeconds} onDismiss={handleDismissTimer} />
      )}
    </>
  );
}
