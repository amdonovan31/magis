"use client";

import { useState, useOptimistic, useTransition, useEffect, useRef } from "react";
import { logSet } from "@/lib/actions/session.actions";
import { persistSet } from "@/lib/workout-persistence";
import { cn } from "@/lib/utils/cn";

type WeightUnit = "kg" | "lbs";

const KG_TO_LBS = 2.20462;

function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;
  return from === "kg"
    ? Math.round(value * KG_TO_LBS * 10) / 10
    : Math.round((value / KG_TO_LBS) * 10) / 10;
}

interface SetRowProps {
  sessionId: string;
  templateExerciseId: string;
  exerciseIdOverride?: string | null;
  setNumber: number;
  prescribedReps: string | null;
  prescribedWeight: string | null;
  initialCompleted?: boolean;
  initialReps?: number | null;
  initialWeight?: string | null;
  initialWeightUnit?: string | null;
  onSetComplete?: () => void;
  weightUnit: WeightUnit;
}

export default function SetRow({
  sessionId,
  templateExerciseId,
  exerciseIdOverride,
  setNumber,
  prescribedReps,
  prescribedWeight,
  initialCompleted = false,
  initialReps = null,
  initialWeight = null,
  initialWeightUnit = null,
  onSetComplete,
  weightUnit,
}: SetRowProps) {
  // Parse prescribed weight as a number (strip any unit suffix)
  const prescribedNum = prescribedWeight ? parseFloat(prescribedWeight) : null;

  // Convert prescribed weight to display unit
  const prescribedInUnit = prescribedNum != null && !isNaN(prescribedNum)
    ? convertWeight(prescribedNum, "kg", weightUnit).toString()
    : null;

  // For already-logged sets, store the raw value + unit they were logged in
  const loggedUnitRef = useRef<WeightUnit | null>(
    initialCompleted && initialWeight
      ? (initialWeightUnit as WeightUnit) ?? "lbs"
      : null
  );
  const loggedValueRef = useRef<string | null>(
    initialCompleted ? initialWeight : null
  );

  function getInitialWeight(): string {
    if (initialCompleted && initialWeight) {
      // Display logged weight converted to current unit
      const num = parseFloat(initialWeight);
      if (isNaN(num)) return initialWeight;
      const fromUnit = loggedUnitRef.current ?? "lbs";
      return convertWeight(num, fromUnit, weightUnit).toString();
    }
    return prescribedInUnit ?? "";
  }

  const [reps, setReps] = useState(initialReps?.toString() ?? "");
  const [weight, setWeight] = useState(getInitialWeight);
  const [optimisticDone, setOptimisticDone] = useOptimistic(initialCompleted);
  const [, startTransition] = useTransition();
  const prevUnitRef = useRef(weightUnit);

  // React to unit toggle changes
  useEffect(() => {
    const prev = prevUnitRef.current;
    if (prev === weightUnit) return;
    prevUnitRef.current = weightUnit;

    if (optimisticDone && loggedValueRef.current) {
      // Already-logged set: convert the original logged value to new display unit
      const num = parseFloat(loggedValueRef.current);
      if (!isNaN(num)) {
        const fromUnit = loggedUnitRef.current ?? "lbs";
        setWeight(convertWeight(num, fromUnit, weightUnit).toString());
      }
    } else {
      // Unlogged set: convert current input value
      const num = parseFloat(weight);
      if (!isNaN(num) && weight !== "") {
        setWeight(convertWeight(num, prev, weightUnit).toString());
      } else if (weight === "" && prescribedNum != null && !isNaN(prescribedNum)) {
        // Placeholder will update automatically via prescribedInUnit
      }
    }
  }, [weightUnit]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleComplete() {
    const repsNum = reps ? parseInt(reps, 10) : null;

    // Persist to localStorage BEFORE server action — synchronous, instant
    persistSet(sessionId, {
      templateExerciseId,
      exerciseIdOverride: exerciseIdOverride ?? null,
      setNumber,
      repsCompleted: repsNum,
      weightUsed: weight || null,
      completed: true,
      completedAt: Date.now(),
    });

    // Track what was logged for mid-workout unit conversion
    loggedValueRef.current = weight || null;
    loggedUnitRef.current = weightUnit;

    startTransition(async () => {
      setOptimisticDone(true);
      const result = await logSet({
        sessionId,
        templateExerciseId,
        exerciseIdOverride: exerciseIdOverride ?? undefined,
        setNumber,
        repsCompleted: repsNum,
        weightUsed: weight || null,
        weightUnit,
        rpe: null,
      });
      if (result.error) {
        setOptimisticDone(false);
        loggedValueRef.current = null;
        loggedUnitRef.current = null;
      } else {
        onSetComplete?.();
      }
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
        optimisticDone ? "bg-primary/5" : "bg-surface"
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
          placeholder={prescribedReps ?? "\u2014"}
          disabled={optimisticDone}
          className={cn(
            "h-14 w-full rounded-xl border text-xl text-center font-semibold text-primary",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
            "placeholder:text-primary/25",
            optimisticDone
              ? "border-transparent bg-transparent"
              : "border-primary/20 bg-surface"
          )}
        />
      </div>

      {/* Weight input */}
      <div className="flex flex-col items-center gap-0.5 flex-1">
        <label className="text-[10px] text-primary/40">{weightUnit}</label>
        <input
          type="text"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={prescribedInUnit ?? "\u2014"}
          disabled={optimisticDone}
          className={cn(
            "h-14 w-full rounded-xl border text-xl text-center font-semibold text-primary",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
            "placeholder:text-primary/25",
            optimisticDone
              ? "border-transparent bg-transparent"
              : "border-primary/20 bg-surface"
          )}
        />
      </div>

      {/* Complete button */}
      <button
        type="button"
        onClick={handleComplete}
        disabled={optimisticDone}
        className={cn(
          "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-colors",
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
