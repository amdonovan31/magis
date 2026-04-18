"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import RestTimer from "@/components/workout/RestTimer";
import { logSet } from "@/lib/actions/session.actions";
import { completeSession, deleteSession } from "@/lib/actions/session.actions";
import { searchExercises } from "@/lib/actions/exercise.actions";
import {
  persistFreeSet,
  persistFreeExerciseList,
  clearPersistedSession,
  getPersistedSession,
} from "@/lib/workout-persistence";
import type { SetLog, Exercise } from "@/types/app.types";
import { MUSCLE_GROUPS } from "@/types/app.types";

type FreeSet = {
  setNumber: number;
  reps: number | null;
  weight: string | null;
  isCompleted: boolean;
  saving: boolean;
};

type FreeExercise = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string | null;
  sets: FreeSet[];
};

interface FreeWorkoutClientProps {
  sessionId: string;
  startedAt: string;
  existingLogs: SetLog[];
  preferredUnit: "kg" | "lbs";
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function FreeWorkoutClient({
  sessionId,
  startedAt,
  existingLogs,
  preferredUnit,
}: FreeWorkoutClientProps) {
  const router = useRouter();
  const [exercises, setExercises] = useState<FreeExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from existing set_logs (resume support)
  useEffect(() => {
    if (existingLogs.length === 0) {
      const persisted = getPersistedSession(sessionId);
      if (persisted?.mode === "free" && persisted.freeExercises?.length) {
        const restored: FreeExercise[] = persisted.freeExercises.map((fe) => ({
          exerciseId: fe.exerciseId,
          exerciseName: fe.exerciseName,
          muscleGroup: fe.muscleGroup,
          sets: [{ setNumber: 1, reps: null, weight: null, isCompleted: false, saving: false }],
        }));
        setExercises(restored);
      }
      return;
    }

    const exerciseMap = new Map<string, FreeExercise>();
    for (const log of existingLogs) {
      const eid = log.exercise_id;
      if (!eid) continue;
      if (!exerciseMap.has(eid)) {
        const exerciseData = (log as Record<string, unknown>).exercise as { name?: string; muscle_group?: string } | null;
        exerciseMap.set(eid, {
          exerciseId: eid,
          exerciseName: exerciseData?.name ?? eid,
          muscleGroup: (exerciseData?.muscle_group as string) ?? null,
          sets: [],
        });
      }
      const ex = exerciseMap.get(eid)!;
      ex.sets.push({
        setNumber: log.set_number,
        reps: log.reps_completed,
        weight: log.weight_used,
        isCompleted: log.is_completed ?? false,
        saving: false,
      });
    }
    const restored = Array.from(exerciseMap.values());
    restored.forEach((ex) => ex.sets.sort((a, b) => a.setNumber - b.setNumber));
    setExercises(restored);
  }, [existingLogs, sessionId]);

  // Elapsed timer
  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const completedSets = useMemo(
    () => exercises.reduce((n, ex) => n + ex.sets.filter((s) => s.isCompleted).length, 0),
    [exercises]
  );

  const addExercise = useCallback(
    (exercise: Exercise) => {
      setExercises((prev) => {
        if (prev.some((e) => e.exerciseId === exercise.id)) return prev;
        const updated = [
          ...prev,
          {
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            muscleGroup: exercise.muscle_group,
            sets: [{ setNumber: 1, reps: null, weight: null, isCompleted: false, saving: false }],
          },
        ];
        persistFreeExerciseList(
          sessionId,
          updated.map((e) => ({
            exerciseId: e.exerciseId,
            exerciseName: e.exerciseName,
            muscleGroup: e.muscleGroup,
          }))
        );
        return updated;
      });
      setShowPicker(false);
    },
    [sessionId]
  );

  function removeExercise(exerciseId: string) {
    setExercises((prev) => {
      const updated = prev.filter((e) => e.exerciseId !== exerciseId);
      persistFreeExerciseList(
        sessionId,
        updated.map((e) => ({
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          muscleGroup: e.muscleGroup,
        }))
      );
      return updated;
    });
  }

  function addSet(exerciseId: string) {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;
        const nextNum = ex.sets.length > 0 ? Math.max(...ex.sets.map((s) => s.setNumber)) + 1 : 1;
        return { ...ex, sets: [...ex.sets, { setNumber: nextNum, reps: null, weight: null, isCompleted: false, saving: false }] };
      })
    );
  }

  function updateSet(exerciseId: string, setNumber: number, field: "reps" | "weight", value: string) {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.setNumber !== setNumber) return s;
            if (field === "reps") return { ...s, reps: value ? parseInt(value) || null : null };
            return { ...s, weight: value || null };
          }),
        };
      })
    );
  }

  async function completeSet(exerciseId: string, setNumber: number) {
    const ex = exercises.find((e) => e.exerciseId === exerciseId);
    const set = ex?.sets.find((s) => s.setNumber === setNumber);
    if (!ex || !set) return;

    setExercises((prev) =>
      prev.map((e) =>
        e.exerciseId !== exerciseId
          ? e
          : { ...e, sets: e.sets.map((s) => (s.setNumber !== setNumber ? s : { ...s, saving: true })) }
      )
    );

    persistFreeSet(sessionId, exerciseId, setNumber, {
      repsCompleted: set.reps,
      weightUsed: set.weight,
    });

    const result = await logSet({
      sessionId,
      templateExerciseId: null,
      exerciseIdOverride: exerciseId,
      setNumber,
      repsCompleted: set.reps,
      weightUsed: set.weight,
      weightUnit: preferredUnit,
      rpe: null,
    });

    if (result?.error) {
      setError(result.error);
      setExercises((prev) =>
        prev.map((e) =>
          e.exerciseId !== exerciseId
            ? e
            : { ...e, sets: e.sets.map((s) => (s.setNumber !== setNumber ? s : { ...s, saving: false })) }
        )
      );
      return;
    }

    setExercises((prev) =>
      prev.map((e) =>
        e.exerciseId !== exerciseId
          ? e
          : {
              ...e,
              sets: e.sets.map((s) =>
                s.setNumber !== setNumber ? s : { ...s, isCompleted: true, saving: false }
              ),
            }
      )
    );

    setRestSeconds(90);
  }

  async function handleComplete() {
    setCompleting(true);
    setError(null);
    const result = await completeSession(sessionId);
    if (result?.error) {
      setError(result.error);
      setCompleting(false);
    }
    clearPersistedSession(sessionId);
  }

  async function handleDiscard() {
    if (!confirm("Discard this workout? All logged sets will be deleted.")) return;
    setDiscarding(true);
    await deleteSession(sessionId);
    clearPersistedSession(sessionId);
    router.push("/home");
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary">Free Workout</h1>
          <p className="text-xs text-primary/50">
            {formatElapsed(elapsed)} &middot; {exercises.length} exercise{exercises.length !== 1 ? "s" : ""} &middot; {completedSets} set{completedSets !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleDiscard}
          disabled={discarding}
          className="text-xs text-red-500 hover:text-red-700 font-medium"
        >
          {discarding ? "Discarding..." : "Discard"}
        </button>
      </div>

      {/* Rest Timer */}
      {restSeconds > 0 && (
        <RestTimer seconds={restSeconds} onDismiss={() => setRestSeconds(0)} />
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Exercise List */}
      {exercises.map((ex) => {
        const hasCompletedSets = ex.sets.some((s) => s.isCompleted);
        return (
          <Card key={ex.exerciseId}>
            <div className="flex flex-col gap-3">
              {/* Exercise header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-primary">{ex.exerciseName}</p>
                  {ex.muscleGroup && (
                    <Badge variant="default">{ex.muscleGroup}</Badge>
                  )}
                </div>
                {!hasCompletedSets && (
                  <button
                    onClick={() => removeExercise(ex.exerciseId)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Set rows */}
              <div className="flex flex-col gap-1">
                <div className="grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 text-[10px] font-semibold uppercase tracking-wide text-primary/40 px-1">
                  <span>Set</span>
                  <span>Reps</span>
                  <span>{preferredUnit}</span>
                  <span />
                </div>

                {ex.sets.map((set) => (
                  <div
                    key={set.setNumber}
                    className={`grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 items-center px-1 py-1.5 rounded-lg ${
                      set.isCompleted ? "bg-green-50" : ""
                    }`}
                  >
                    <span className="text-xs font-semibold text-primary/50">{set.setNumber}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="—"
                      value={set.reps ?? ""}
                      onChange={(e) => updateSet(ex.exerciseId, set.setNumber, "reps", e.target.value)}
                      disabled={set.isCompleted}
                      className="h-9 w-full rounded-lg border border-primary/15 bg-surface px-2 text-sm text-primary text-center disabled:opacity-50"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="—"
                      value={set.weight ?? ""}
                      onChange={(e) => updateSet(ex.exerciseId, set.setNumber, "weight", e.target.value)}
                      disabled={set.isCompleted}
                      className="h-9 w-full rounded-lg border border-primary/15 bg-surface px-2 text-sm text-primary text-center disabled:opacity-50"
                    />
                    {set.isCompleted ? (
                      <span className="text-center text-green-600 text-sm">&#x2713;</span>
                    ) : (
                      <button
                        onClick={() => completeSet(ex.exerciseId, set.setNumber)}
                        disabled={set.saving}
                        className="flex h-9 items-center justify-center rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-50"
                      >
                        {set.saving ? "..." : "Log"}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => addSet(ex.exerciseId)}
                className="text-xs font-medium text-accent hover:underline self-start"
              >
                + Add Set
              </button>
            </div>
          </Card>
        );
      })}

      {/* Add Exercise Button */}
      <Button
        variant="secondary"
        fullWidth
        onClick={() => setShowPicker(true)}
      >
        + Add Exercise
      </Button>

      {/* Complete Workout Button */}
      {completedSets > 0 && (
        <Button
          fullWidth
          size="lg"
          onClick={handleComplete}
          loading={completing}
        >
          Complete Workout
        </Button>
      )}

      {/* Exercise Picker Modal */}
      {showPicker && (
        <ExercisePickerModal
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
          excludeIds={exercises.map((e) => e.exerciseId)}
        />
      )}
    </div>
  );
}

function ExercisePickerModal({
  onSelect,
  onClose,
  excludeIds,
}: {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  excludeIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [results, setResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createMuscle, setCreateMuscle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim() && !muscleFilter) {
        setResults([]);
        return;
      }
      setLoading(true);
      const data = await searchExercises(query, muscleFilter ?? undefined);
      setResults(data.filter((e) => !excludeIds.includes(e.id)));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, muscleFilter, excludeIds]);

  async function handleCreate() {
    if (!createName.trim()) return;
    setCreating(true);
    const fd = new FormData();
    fd.set("name", createName.trim());
    if (createMuscle) fd.set("muscle_group", createMuscle);
    const { createExercise } = await import("@/lib/actions/exercise.actions");
    const result = await createExercise(fd);
    if (result?.error) {
      setCreating(false);
      return;
    }
    const data = await searchExercises(createName.trim());
    const created = data.find(
      (e) => e.name.toLowerCase() === createName.trim().toLowerCase()
    );
    if (created) onSelect(created);
    setCreating(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10">
        <h2 className="font-semibold text-primary">Add Exercise</h2>
        <button onClick={onClose} className="text-sm text-primary/50">
          Cancel
        </button>
      </div>

      <div className="px-4 pt-3">
        <input
          type="text"
          placeholder="Search exercises..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="h-10 w-full rounded-xl border border-primary/20 bg-surface px-3 text-sm text-primary placeholder:text-primary/30 focus:border-primary focus:outline-none"
        />
      </div>

      {/* Muscle group tabs */}
      <div className="flex gap-1.5 overflow-x-auto px-4 py-2 no-scrollbar">
        <button
          onClick={() => setMuscleFilter(null)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !muscleFilter ? "bg-primary text-white" : "bg-primary/10 text-primary/60"
          }`}
        >
          All
        </button>
        {MUSCLE_GROUPS.map((mg) => (
          <button
            key={mg}
            onClick={() => setMuscleFilter(muscleFilter === mg ? null : mg)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              muscleFilter === mg ? "bg-primary text-white" : "bg-primary/10 text-primary/60"
            }`}
          >
            {mg}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4">
        {loading && (
          <p className="py-8 text-center text-sm text-primary/40">Searching...</p>
        )}
        {!loading && results.length === 0 && (query || muscleFilter) && (
          <p className="py-8 text-center text-sm text-primary/40">No exercises found</p>
        )}
        {!loading && !query && !muscleFilter && (
          <p className="py-8 text-center text-sm text-primary/40">
            Search or select a muscle group
          </p>
        )}
        {results.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => onSelect(exercise)}
            className="flex w-full items-center justify-between border-b border-primary/5 py-3 text-left"
          >
            <div>
              <p className="text-sm font-medium text-primary">{exercise.name}</p>
              {exercise.muscle_group && (
                <p className="text-xs text-primary/40">{exercise.muscle_group}</p>
              )}
            </div>
            <span className="text-primary/30">+</span>
          </button>
        ))}
      </div>

      {/* Create Exercise */}
      <div className="border-t border-primary/10 px-4 py-3">
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm font-medium text-accent hover:underline"
          >
            Create custom exercise
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Exercise name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="h-9 w-full rounded-lg border border-primary/20 bg-surface px-3 text-sm"
            />
            <select
              value={createMuscle}
              onChange={(e) => setCreateMuscle(e.target.value)}
              className="h-9 w-full rounded-lg border border-primary/20 bg-surface px-3 text-sm text-primary"
            >
              <option value="">Muscle group (optional)</option>
              {MUSCLE_GROUPS.map((mg) => (
                <option key={mg} value={mg}>
                  {mg}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                loading={creating}
                disabled={!createName.trim()}
              >
                Create &amp; Add
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
