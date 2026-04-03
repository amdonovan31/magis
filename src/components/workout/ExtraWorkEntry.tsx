"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { logExtraWork, deleteExtraWorkGroup } from "@/lib/actions/session.actions";

interface ExtraWorkSet {
  setNumber: number;
  reps: string;
  weight: string;
  done: boolean;
}

interface ExtraWorkEntryProps {
  sessionId: string;
  groupId: string;
  initialName: string;
  initialSets: ExtraWorkSet[];
  weightUnit: "kg" | "lbs";
  onRemove: () => void;
}

export default function ExtraWorkEntry({
  sessionId,
  groupId,
  initialName,
  initialSets,
  weightUnit,
  onRemove,
}: ExtraWorkEntryProps) {
  const [exerciseName, setExerciseName] = useState(initialName);
  const [sets, setSets] = useState<ExtraWorkSet[]>(
    initialSets.length > 0
      ? initialSets
      : [{ setNumber: 1, reps: "", weight: "", done: false }]
  );
  const nameDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleNameChange = useCallback(
    (value: string) => {
      setExerciseName(value);
      // Update name on all existing saved sets via debounce
      if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
      nameDebounceRef.current = setTimeout(() => {
        sets.forEach((s) => {
          if (s.done) {
            logExtraWork({
              sessionId,
              groupId,
              exerciseName: value,
              setNumber: s.setNumber,
              repsCompleted: s.reps ? parseInt(s.reps) : null,
              weightValue: s.weight ? parseFloat(s.weight) : null,
              weightUnit,
            });
          }
        });
      }, 300);
    },
    [sessionId, groupId, sets, weightUnit]
  );

  function handleSetComplete(index: number) {
    const s = sets[index];
    if (!exerciseName.trim() || s.done) return;

    const updated = [...sets];
    updated[index] = { ...s, done: true };
    setSets(updated);

    logExtraWork({
      sessionId,
      groupId,
      exerciseName: exerciseName.trim(),
      setNumber: s.setNumber,
      repsCompleted: s.reps ? parseInt(s.reps) : null,
      weightValue: s.weight ? parseFloat(s.weight) : null,
      weightUnit,
    });
  }

  function updateSet(index: number, field: "reps" | "weight", value: string) {
    const updated = [...sets];
    updated[index] = { ...updated[index], [field]: value };
    setSets(updated);
  }

  function addSet() {
    setSets((prev) => [
      ...prev,
      { setNumber: prev.length + 1, reps: "", weight: "", done: false },
    ]);
  }

  async function handleRemove() {
    await deleteExtraWorkGroup(sessionId, groupId);
    onRemove();
  }

  return (
    <div className="rounded-2xl border border-dashed border-primary/15 bg-surface/50 overflow-hidden">
      {/* Exercise name input */}
      <div className="px-4 pt-4 pb-2">
        <input
          type="text"
          value={exerciseName}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Exercise name"
          className="w-full bg-transparent text-base font-semibold text-primary placeholder:text-primary/30 focus:outline-none"
        />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/30 mt-1">
          Extra work
        </p>
      </div>

      {/* Set rows */}
      <div className="flex flex-col gap-1.5 px-3 pb-2">
        {sets.map((s, i) => (
          <div
            key={s.setNumber}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
              s.done ? "bg-green-50" : "bg-surface"
            )}
          >
            <span className="w-6 text-center text-sm font-semibold text-primary/60">
              {s.setNumber}
            </span>

            <div className="flex flex-col items-center gap-0.5 flex-1">
              <label className="text-[10px] text-primary/40">Reps</label>
              <input
                type="number"
                inputMode="numeric"
                value={s.reps}
                onChange={(e) => updateSet(i, "reps", e.target.value)}
                placeholder="—"
                disabled={s.done}
                className={cn(
                  "h-14 w-full rounded-xl border text-xl text-center font-semibold text-primary",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
                  "placeholder:text-primary/25",
                  s.done
                    ? "border-transparent bg-transparent"
                    : "border-primary/20 bg-surface"
                )}
              />
            </div>

            <div className="flex flex-col items-center gap-0.5 flex-1">
              <label className="text-[10px] text-primary/40">{weightUnit}</label>
              <input
                type="text"
                inputMode="decimal"
                value={s.weight}
                onChange={(e) => updateSet(i, "weight", e.target.value)}
                placeholder="—"
                disabled={s.done}
                className={cn(
                  "h-14 w-full rounded-xl border text-xl text-center font-semibold text-primary",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
                  "placeholder:text-primary/25",
                  s.done
                    ? "border-transparent bg-transparent"
                    : "border-primary/20 bg-surface"
                )}
              />
            </div>

            <button
              type="button"
              onClick={() => handleSetComplete(i)}
              disabled={s.done || !exerciseName.trim()}
              className={cn(
                "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-colors",
                s.done
                  ? "bg-primary text-white"
                  : "bg-primary/10 text-primary hover:bg-primary/20",
                !exerciseName.trim() && "opacity-30"
              )}
              aria-label={s.done ? "Completed" : "Mark complete"}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={s.done ? 2.5 : 2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 pb-3">
        <button
          type="button"
          onClick={addSet}
          className="text-xs font-medium text-primary/50 hover:text-primary transition-colors"
        >
          + Add set
        </button>
        <button
          type="button"
          onClick={handleRemove}
          className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
