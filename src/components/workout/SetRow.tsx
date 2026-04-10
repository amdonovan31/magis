"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { logSet } from "@/lib/actions/session.actions";
import { persistSet } from "@/lib/workout-persistence";
import { cn } from "@/lib/utils/cn";

type WeightUnit = "kg" | "lbs";

const KG_TO_LBS = 2.20462;
const SWIPE_THRESHOLD = 60;

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
  isActive?: boolean;
  isSkipped?: boolean;
  onSkip?: () => void;
  onUnskip?: () => void;
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
  isActive = false,
  isSkipped = false,
  onSkip,
  onUnskip,
}: SetRowProps) {
  const prescribedNum = prescribedWeight ? parseFloat(prescribedWeight) : null;
  const prescribedInUnit = prescribedNum != null && !isNaN(prescribedNum)
    ? convertWeight(prescribedNum, "kg", weightUnit).toString()
    : null;

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
      const num = parseFloat(initialWeight);
      if (isNaN(num)) return initialWeight;
      const fromUnit = loggedUnitRef.current ?? "lbs";
      return convertWeight(num, fromUnit, weightUnit).toString();
    }
    return prescribedInUnit ?? "";
  }

  const [reps, setReps] = useState(initialReps?.toString() ?? "");
  const [weight, setWeight] = useState(getInitialWeight);
  const [done, setDone] = useState(initialCompleted);
  const [, startTransition] = useTransition();
  const prevUnitRef = useRef(weightUnit);

  // Swipe state
  const [swipeX, setSwipeX] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSwipingRef = useRef(false);

  useEffect(() => {
    const prev = prevUnitRef.current;
    if (prev === weightUnit) return;
    prevUnitRef.current = weightUnit;

    if (done && loggedValueRef.current) {
      const num = parseFloat(loggedValueRef.current);
      if (!isNaN(num)) {
        const fromUnit = loggedUnitRef.current ?? "lbs";
        setWeight(convertWeight(num, fromUnit, weightUnit).toString());
      }
    } else {
      const num = parseFloat(weight);
      if (!isNaN(num) && weight !== "") {
        setWeight(convertWeight(num, prev, weightUnit).toString());
      }
    }
  }, [weightUnit]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleComplete() {
    const repsNum = reps ? parseInt(reps, 10) : null;

    persistSet(sessionId, {
      templateExerciseId,
      exerciseIdOverride: exerciseIdOverride ?? null,
      setNumber,
      repsCompleted: repsNum,
      weightUsed: weight || null,
      completed: true,
      completedAt: Date.now(),
    });

    loggedValueRef.current = weight || null;
    loggedUnitRef.current = weightUnit;

    startTransition(async () => {
      setDone(true);
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
        setDone(false);
        loggedValueRef.current = null;
        loggedUnitRef.current = null;
      } else {
        onSetComplete?.();
      }
    });
  }

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (done) return; // completed sets can't be swiped
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isSwipingRef.current = false;
  }, [done]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Only swipe if horizontal movement dominates
    if (!isSwipingRef.current && Math.abs(deltaX) > 10) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        isSwipingRef.current = true;
      } else {
        touchStartRef.current = null;
        return;
      }
    }

    if (!isSwipingRef.current) return;
    e.preventDefault();

    if (isSkipped) {
      // Skipped rows: only allow swipe right (positive deltaX)
      setSwipeX(Math.max(0, Math.min(deltaX, 80)));
    } else {
      // Normal rows: only allow swipe left (negative deltaX)
      setSwipeX(Math.min(0, Math.max(deltaX, -80)));
    }
  }, [isSkipped]);

  const handleTouchEnd = useCallback(() => {
    if (!isSwipingRef.current) {
      touchStartRef.current = null;
      return;
    }

    if (isSkipped && swipeX > SWIPE_THRESHOLD) {
      onUnskip?.();
    } else if (!isSkipped && swipeX < -SWIPE_THRESHOLD) {
      onSkip?.();
    }

    setSwipeX(0);
    touchStartRef.current = null;
    isSwipingRef.current = false;
  }, [swipeX, isSkipped, onSkip, onUnskip]);

  // Skipped state render
  if (isSkipped) {
    return (
      <div
        className="relative overflow-hidden rounded-xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Behind: Undo button */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
          <button
            type="button"
            onClick={() => onUnskip?.()}
            className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"
          >
            Undo
          </button>
        </div>

        {/* Foreground: skipped row */}
        <div
          className="relative flex items-center gap-3 rounded-xl bg-primary/5 px-3 py-2 transition-transform"
          style={{ transform: `translateX(${swipeX}px)` }}
        >
          <span className="w-6 text-center text-sm font-semibold text-primary/30">
            {setNumber}
          </span>
          <span className="flex-1 text-sm text-primary/30 italic">Skipped</span>
        </div>
      </div>
    );
  }

  // Normal / completed state render
  return (
    <div
      className="relative overflow-hidden rounded-xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Behind: Skip button (revealed on swipe left) */}
      {!done && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          <button
            type="button"
            onClick={() => onSkip?.()}
            className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700"
          >
            Skip
          </button>
        </div>
      )}

      {/* Foreground: set row */}
      <div
        className={cn(
          "relative flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
          done
            ? "bg-green-50"
            : isActive
              ? "border-l-4 border-primary bg-surface"
              : "bg-surface"
        )}
        style={swipeX !== 0 ? { transform: `translateX(${swipeX}px)`, transition: "none" } : undefined}
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
            disabled={done}
            className={cn(
              "h-14 w-full rounded-xl border text-xl text-center font-semibold text-primary",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
              "placeholder:text-primary/25",
              done
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
            disabled={done}
            className={cn(
              "h-14 w-full rounded-xl border text-xl text-center font-semibold text-primary",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
              "placeholder:text-primary/25",
              done
                ? "border-transparent bg-transparent"
                : "border-primary/20 bg-surface"
            )}
          />
        </div>

        {/* Complete button */}
        <button
          type="button"
          onClick={handleComplete}
          disabled={done}
          className={cn(
            "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-colors",
            done
              ? "bg-primary text-white"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          )}
          aria-label={done ? "Completed" : "Mark complete"}
        >
          {done ? (
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
    </div>
  );
}
