"use client";

import { useState } from "react";
import SetRow from "./SetRow";
import ExerciseDemoModal from "./ExerciseDemoModal";
import type { WorkoutTemplateExerciseWithExercise, SetLog } from "@/types/app.types";

interface ExerciseLoggerProps {
  sessionId: string;
  templateExercise: WorkoutTemplateExerciseWithExercise;
  existingLogs: SetLog[];
  onSetComplete?: (restSeconds: number) => void;
}

export default function ExerciseLogger({
  sessionId,
  templateExercise,
  existingLogs,
  onSetComplete,
}: ExerciseLoggerProps) {
  const [showDemo, setShowDemo] = useState(false);
  const setCount = templateExercise.prescribed_sets ?? 3;

  function handleSetComplete() {
    const rest = templateExercise.rest_seconds;
    if (rest && onSetComplete) {
      onSetComplete(rest);
    }
  }

  return (
    <div className="rounded-2xl bg-background overflow-hidden">
      {/* Exercise header */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-primary flex-1">
            {templateExercise.exercise.name}
          </h3>
          <button
            type="button"
            onClick={() => setShowDemo(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-primary/40 hover:bg-primary/10 hover:text-primary transition-colors"
            aria-label="Exercise info"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-primary/50 mt-0.5">
          {setCount} sets × {templateExercise.prescribed_reps ?? "—"}
          {templateExercise.prescribed_weight
            ? ` @ ${templateExercise.prescribed_weight}`
            : ""}
          {templateExercise.rest_seconds
            ? ` · ${templateExercise.rest_seconds}s rest`
            : ""}
        </p>
      </div>

      {/* Set rows */}
      <div className="flex flex-col gap-2 px-2 pb-3">
        {/* Header row */}
        <div className="flex items-center gap-3 px-3">
          <span className="w-6" />
          <span className="flex-1 text-center text-[10px] font-medium uppercase tracking-wide text-primary/40">
            Reps
          </span>
          <span className="flex-1 text-center text-[10px] font-medium uppercase tracking-wide text-primary/40">
            Weight
          </span>
          <span className="w-10" />
        </div>

        {Array.from({ length: setCount }, (_, i) => {
          const setNum = i + 1;
          const existingLog = existingLogs.find(
            (l) =>
              l.template_exercise_id === templateExercise.id &&
              l.set_number === setNum
          );
          return (
            <SetRow
              key={setNum}
              sessionId={sessionId}
              templateExerciseId={templateExercise.id}
              setNumber={setNum}
              prescribedReps={templateExercise.prescribed_reps}
              prescribedWeight={templateExercise.prescribed_weight}
              initialCompleted={existingLog?.is_completed ?? false}
              initialReps={existingLog?.reps_completed ?? null}
              initialWeight={existingLog?.weight_used ?? null}
              onSetComplete={handleSetComplete}
            />
          );
        })}
      </div>

      {templateExercise.notes && (
        <p className="px-4 pb-3 text-xs text-primary/50 italic">
          Note: {templateExercise.notes}
        </p>
      )}

      {/* Demo modal */}
      <ExerciseDemoModal
        exercise={templateExercise.exercise}
        isOpen={showDemo}
        onClose={() => setShowDemo(false)}
      />
    </div>
  );
}
