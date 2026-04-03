"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowLeftRight } from "lucide-react";
import SetRow from "./SetRow";
import ExerciseDemoModal from "./ExerciseDemoModal";
import { persistSwap, removeSwap } from "@/lib/workout-persistence";
import { searchExercises } from "@/lib/actions/exercise.actions";
import { saveExerciseNote } from "@/lib/actions/session.actions";
import type { WorkoutTemplateExerciseWithExercise, SetLog, Exercise } from "@/types/app.types";

interface ExerciseLoggerProps {
  sessionId: string;
  templateExercise: WorkoutTemplateExerciseWithExercise;
  existingLogs: SetLog[];
  onSetComplete?: (restSeconds: number) => void;
  initialSwappedExercise?: Exercise | null;
  weightUnit: "kg" | "lbs";
  isSkipped: boolean;
  onSkip: () => void;
  initialNote?: string;
}

export default function ExerciseLogger({
  sessionId,
  templateExercise,
  existingLogs,
  onSetComplete,
  initialSwappedExercise = null,
  weightUnit,
  isSkipped,
  onSkip,
  initialNote = "",
}: ExerciseLoggerProps) {
  const [showDemo, setShowDemo] = useState(false);
  const [confirmingSkip, setConfirmingSkip] = useState(false);
  const [swappedExercise, setSwappedExercise] = useState<Exercise | null>(initialSwappedExercise);
  const [hideLoggedSets, setHideLoggedSets] = useState(false);

  // Swap search state
  const [swapMode, setSwapMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [confirmSwapExercise, setConfirmSwapExercise] = useState<Exercise | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const noteDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const swapContainerRef = useRef<HTMLDivElement>(null);

  // Exercise note state
  const [noteContent, setNoteContent] = useState(initialNote);

  const setCount = templateExercise.prescribed_sets ?? 3;
  const displayExercise = swappedExercise ?? templateExercise.exercise;
  const exerciseIdOverride = swappedExercise?.id ?? null;

  const loggedSetCount = existingLogs.filter((l) => l.is_completed).length;

  // Update swapped exercise when initialSwappedExercise arrives async
  useEffect(() => {
    if (initialSwappedExercise && !swappedExercise) {
      setSwappedExercise(initialSwappedExercise);
    }
  }, [initialSwappedExercise]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSwap(exercise: Exercise) {
    setSwappedExercise(exercise);
    setHideLoggedSets(true);
    persistSwap(sessionId, templateExercise.id, exercise.id);
  }

  function handleRevert() {
    setSwappedExercise(null);
    setHideLoggedSets(false);
    removeSwap(sessionId, templateExercise.id);
  }

  function handleSetComplete() {
    const rest = templateExercise.rest_seconds;
    if (rest && onSetComplete) {
      onSetComplete(rest);
    }
  }

  // Debounced note save
  const handleNoteChange = useCallback((value: string) => {
    setNoteContent(value);
    if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current);
    noteDebounceRef.current = setTimeout(() => {
      saveExerciseNote(sessionId, templateExercise.id, value);
    }, 300);
  }, [sessionId, templateExercise.id]);

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      const data = await searchExercises(value);
      setSearchResults(data);
      setSearchLoading(false);
    }, 300);
  }, []);

  function enterSwapMode() {
    setSwapMode(true);
    setSearchQuery("");
    setSearchResults([]);
    setConfirmSwapExercise(null);
    // Focus input on next tick
    setTimeout(() => searchInputRef.current?.focus(), 0);
  }

  function exitSwapMode() {
    setSwapMode(false);
    setSearchQuery("");
    setSearchResults([]);
    setConfirmSwapExercise(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  function handleSelectResult(exercise: Exercise) {
    // If sets are already logged, show confirmation
    if (loggedSetCount > 0 && !hideLoggedSets) {
      setConfirmSwapExercise(exercise);
      return;
    }
    handleSwap(exercise);
    exitSwapMode();
  }

  function confirmSwapWithLoggedSets() {
    if (!confirmSwapExercise) return;
    handleSwap(confirmSwapExercise);
    exitSwapMode();
  }

  // Click-outside handler for swap mode
  useEffect(() => {
    if (!swapMode) return;
    function handleClickOutside(e: MouseEvent) {
      if (swapContainerRef.current && !swapContainerRef.current.contains(e.target as Node)) {
        exitSwapMode();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [swapMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Skipped state — collapsed card
  if (isSkipped) {
    return (
      <div className="rounded-2xl bg-background overflow-hidden opacity-50">
        <div className="px-4 py-3 flex items-center gap-2">
          <h3 className="font-semibold text-primary/50 flex-1 line-through">
            {displayExercise.name}
          </h3>
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary/50">
            Skipped
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-background overflow-hidden">
      {/* Exercise header */}
      <div className="px-4 py-3">
        {swapMode ? (
          <div ref={swapContainerRef}>
            {/* Swap search input */}
            <div className="flex items-center gap-2">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search exercises..."
                className="flex-1 h-9 rounded-lg border border-primary/20 bg-surface px-3 text-sm text-primary placeholder:text-primary/25 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={exitSwapMode}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary/40 hover:bg-primary/10 hover:text-primary transition-colors"
                aria-label="Cancel swap"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Confirm swap dialog (when sets already logged) */}
            {confirmSwapExercise && (
              <div className="mt-2 rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 flex flex-col gap-2">
                <p className="text-xs text-amber-700">
                  You&apos;ve logged {loggedSetCount} set{loggedSetCount !== 1 ? "s" : ""} for this exercise. Swapping will clear them from this session. Continue?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmSwapExercise(null)}
                    className="flex-1 rounded-lg border border-primary/10 py-1.5 text-xs font-medium text-primary/60 hover:bg-primary/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmSwapWithLoggedSets}
                    className="flex-1 rounded-lg bg-amber-500/10 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-500/20 transition-colors"
                  >
                    Swap anyway
                  </button>
                </div>
              </div>
            )}

            {/* Search results */}
            {!confirmSwapExercise && (
              <div className="mt-2 max-h-48 overflow-y-auto flex flex-col gap-0.5">
                {searchLoading && (
                  <p className="py-3 text-center text-xs text-primary/40 animate-pulse">Searching...</p>
                )}
                {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                  <p className="py-3 text-center text-xs text-primary/40">No exercises found</p>
                )}
                {!searchLoading && searchResults.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => handleSelectResult(ex)}
                    className="flex items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-primary/5 transition-colors"
                  >
                    <p className="text-sm font-medium text-primary truncate">{ex.name}</p>
                    {ex.equipment && (
                      <span className="shrink-0 ml-2 rounded-full bg-primary/5 px-2 py-0.5 text-[10px] text-primary/40">
                        {ex.equipment}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Normal header */}
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-primary flex-1">
                {displayExercise.name}
              </h3>
              {swappedExercise && (
                <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  swapped
                </span>
              )}
              <button
                type="button"
                onClick={enterSwapMode}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary px-3 py-1 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                aria-label="Swap exercise"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Swap
              </button>
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
              {setCount} sets &times; {templateExercise.prescribed_reps ?? "\u2014"}
              {templateExercise.prescribed_weight
                ? ` @ ${templateExercise.prescribed_weight}`
                : ""}
              {templateExercise.rest_seconds
                ? ` \u00B7 ${templateExercise.rest_seconds}s rest`
                : ""}
            </p>
            {swappedExercise && (
              <button
                type="button"
                onClick={handleRevert}
                className="mt-1 text-[11px] text-primary/40 hover:text-primary/60 transition-colors"
              >
                &larr; Revert to {templateExercise.exercise.name}
              </button>
            )}
          </>
        )}
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

        {(() => {
          let firstIncompleteFound = false;
          return Array.from({ length: setCount }, (_, i) => {
            const setNum = i + 1;
            const existingLog = hideLoggedSets
              ? undefined
              : existingLogs.find(
                  (l) =>
                    l.template_exercise_id === templateExercise.id &&
                    l.set_number === setNum
                );
            const isCompleted = existingLog?.is_completed ?? false;
            const isActive = !isCompleted && !firstIncompleteFound;
            if (isActive) firstIncompleteFound = true;
            return (
              <SetRow
                key={`${setNum}_${exerciseIdOverride ?? "original"}`}
                sessionId={sessionId}
                templateExerciseId={templateExercise.id}
                exerciseIdOverride={exerciseIdOverride}
                setNumber={setNum}
                prescribedReps={templateExercise.prescribed_reps}
                prescribedWeight={templateExercise.prescribed_weight}
                initialCompleted={isCompleted}
                initialReps={existingLog?.reps_completed ?? null}
                initialWeight={existingLog?.weight_used ?? null}
                initialWeightUnit={existingLog?.weight_unit ?? null}
                onSetComplete={handleSetComplete}
                weightUnit={weightUnit}
                isActive={isActive}
              />
            );
          });
        })()}
      </div>

      {templateExercise.notes && (
        <p className="px-4 pb-3 text-xs text-primary/50 italic">
          Note: {templateExercise.notes}
        </p>
      )}

      {/* Client exercise note */}
      <div className="px-4 pb-3">
        <textarea
          value={noteContent}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="Add a note…"
          rows={1}
          className="w-full resize-none rounded-xl border border-primary/10 bg-transparent px-3 py-2 text-xs text-primary placeholder:text-primary/30 focus:border-primary/30 focus:outline-none"
        />
      </div>

      {/* Skip exercise */}
      {confirmingSkip ? (
        <div className="px-4 pb-3 flex flex-col gap-2">
          <p className="text-xs text-primary/60 text-center">
            Skip {displayExercise.name}? Any logged sets will still be saved.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmingSkip(false)}
              className="flex-1 rounded-xl border border-primary/10 py-2 text-xs font-medium text-primary/60 hover:bg-primary/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmingSkip(false);
                onSkip();
              }}
              className="flex-1 rounded-xl bg-primary/10 py-2 text-xs font-medium text-primary/60 hover:bg-primary/20 transition-colors"
            >
              Skip exercise
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-3 text-center">
          <button
            type="button"
            onClick={() => setConfirmingSkip(true)}
            className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Skip exercise
          </button>
        </div>
      )}

      {/* Demo modal */}
      <ExerciseDemoModal
        exercise={displayExercise}
        isOpen={showDemo}
        onClose={() => setShowDemo(false)}
      />
    </div>
  );
}
