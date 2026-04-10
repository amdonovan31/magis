"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { logExtraWork, deleteExtraWorkGroup } from "@/lib/actions/session.actions";
import { searchExercises } from "@/lib/actions/exercise.actions";
import Modal from "@/components/ui/Modal";
import type { Exercise } from "@/types/app.types";

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

  // Picker state
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [useCustomName, setUseCustomName] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const customInputRef = useRef<HTMLInputElement>(null);

  const persistNameChange = useCallback(
    (value: string) => {
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

  function handleSelectExercise(name: string) {
    setExerciseName(name);
    setShowPicker(false);
    setSearchQuery("");
    setSearchResults([]);
    setUseCustomName(false);
    persistNameChange(name);
  }

  function handleCustomNameFallback() {
    setShowPicker(false);
    setSearchQuery("");
    setSearchResults([]);
    setUseCustomName(true);
    // Focus the custom input after render
    setTimeout(() => customInputRef.current?.focus(), 100);
  }

  function handleCustomNameChange(value: string) {
    setExerciseName(value);
    persistNameChange(value);
  }

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      const data = await searchExercises(value);
      setSearchResults(data);
      setSearchLoading(false);
    }, 300);
  }, []);

  function openPicker() {
    setUseCustomName(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowPicker(true);
  }

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
      {/* Exercise name display / picker trigger */}
      <div className="px-4 pt-4 pb-2">
        {exerciseName && !useCustomName ? (
          <button
            type="button"
            onClick={openPicker}
            className="w-full text-left text-base font-semibold text-primary"
          >
            {exerciseName}
          </button>
        ) : useCustomName ? (
          <input
            ref={customInputRef}
            type="text"
            value={exerciseName}
            onChange={(e) => handleCustomNameChange(e.target.value)}
            placeholder="Exercise name"
            className="w-full bg-transparent text-base font-semibold text-primary placeholder:text-primary/30 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={openPicker}
            className="w-full text-left text-base font-semibold text-primary/30"
          >
            Tap to choose exercise
          </button>
        )}
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

      {/* Exercise picker bottom sheet */}
      <Modal isOpen={showPicker} onClose={() => setShowPicker(false)} title="Choose Exercise">
        {/* Search input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search exercises..."
          autoFocus
          className="w-full rounded-xl border border-primary/20 bg-surface px-4 py-3 text-sm text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        {/* Results */}
        <div className="mt-3 max-h-64 overflow-y-auto flex flex-col gap-0.5">
          {searchLoading && (
            <p className="py-4 text-center text-xs text-primary/40 animate-pulse">Searching...</p>
          )}
          {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
            <div className="py-4 text-center">
              <p className="text-xs text-primary/40">No exercises found</p>
              <button
                type="button"
                onClick={handleCustomNameFallback}
                className="mt-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Use custom name
              </button>
            </div>
          )}
          {!searchLoading &&
            searchResults.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleSelectExercise(ex.name)}
                className="flex items-center justify-between rounded-lg px-2.5 py-2.5 text-left hover:bg-primary/5 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-primary">{ex.name}</p>
                  {ex.muscle_group && (
                    <p className="text-[10px] text-primary/40 mt-0.5">{ex.muscle_group}</p>
                  )}
                </div>
                {ex.equipment && (
                  <span className="shrink-0 ml-2 rounded-full bg-primary/5 px-2 py-0.5 text-[10px] text-primary/40">
                    {ex.equipment}
                  </span>
                )}
              </button>
            ))}
        </div>

        {/* Persistent custom name option when there are results */}
        {!searchLoading && searchResults.length > 0 && (
          <button
            type="button"
            onClick={handleCustomNameFallback}
            className="mt-2 w-full py-2 text-center text-xs font-medium text-primary/40 hover:text-primary/60 transition-colors"
          >
            Or enter a custom name
          </button>
        )}
      </Modal>
    </div>
  );
}
