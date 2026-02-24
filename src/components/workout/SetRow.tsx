"use client";

import { useState, useOptimistic, useTransition } from "react";
import { logSet } from "@/lib/actions/session.actions";
import { cn } from "@/lib/utils/cn";

interface SetRowProps {
  sessionId: string;
  templateExerciseId: string;
  setNumber: number;
  prescribedReps: string | null;
  prescribedWeight: string | null;
  initialCompleted?: boolean;
  initialReps?: number | null;
  initialWeight?: string | null;
}

export default function SetRow({
  sessionId,
  templateExerciseId,
  setNumber,
  prescribedReps,
  prescribedWeight,
  initialCompleted = false,
  initialReps = null,
  initialWeight = null,
}: SetRowProps) {
  const [reps, setReps] = useState(
    initialReps?.toString() ?? ""
  );
  const [weight, setWeight] = useState(initialWeight ?? prescribedWeight ?? "");
  const [optimisticDone, setOptimisticDone] = useOptimistic(initialCompleted);
  const [, startTransition] = useTransition();

  function handleComplete() {
    const repsNum = reps ? parseInt(reps, 10) : null;

    startTransition(async () => {
      setOptimisticDone(true);
      const result = await logSet({
        sessionId,
        templateExerciseId,
        setNumber,
        repsCompleted: repsNum,
        weightUsed: weight || null,
        rpe: null,
      });
      if (result.error) {
        setOptimisticDone(false);
      }
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
        optimisticDone ? "bg-primary/5" : "bg-white"
      )}
    >
      {/* Set number */}
      <span className="w-6 text-center text-sm font-semibold text-primary/60">
        {setNumber}
      </span>

      {/* Reps input */}
      <div className="flex flex-col items-center gap-0.5 flex-1">
        <label className="text-[10px] text-primary/40">Reps</label>
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder={prescribedReps ?? "—"}
          disabled={optimisticDone}
          className={cn(
            "h-14 w-full rounded-xl border text-xl text-center font-semibold text-primary",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
            "placeholder:text-primary/25",
            optimisticDone
              ? "border-transparent bg-transparent"
              : "border-primary/20 bg-white"
          )}
        />
      </div>

      {/* Weight input */}
      <div className="flex flex-col items-center gap-0.5 flex-1">
        <label className="text-[10px] text-primary/40">Weight</label>
        <input
          type="text"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={prescribedWeight ?? "kg"}
          disabled={optimisticDone}
          className={cn(
            "h-14 w-full rounded-xl border text-xl text-center font-semibold text-primary",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
            "placeholder:text-primary/25",
            optimisticDone
              ? "border-transparent bg-transparent"
              : "border-primary/20 bg-white"
          )}
        />
      </div>

      {/* Complete button */}
      <button
        type="button"
        onClick={handleComplete}
        disabled={optimisticDone}
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors",
          optimisticDone
            ? "bg-primary text-white"
            : "bg-primary/10 text-primary hover:bg-primary/20"
        )}
        aria-label={optimisticDone ? "Completed" : "Mark complete"}
      >
        {optimisticDone ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    </div>
  );
}
