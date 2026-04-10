"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { saveRetroLog } from "@/lib/actions/session.actions";
import ExerciseSearchModal from "@/components/workout/ExerciseSearchModal";
import type { ScheduledWorkoutWithDetails } from "@/lib/queries/calendar.queries";
import type { Exercise } from "@/types/app.types";

interface SetEntry {
  reps: string;
  weight: string;
}

interface Substitution {
  exerciseId: string;
  exerciseName: string;
  reason?: string;
}

interface RetroLogClientProps {
  workout: ScheduledWorkoutWithDetails;
  weightUnit: "lbs" | "kg";
}

function parseFirstNumber(str: string | null): string {
  if (!str) return "";
  const match = str.match(/\d+/);
  return match ? match[0] : "";
}

export default function RetroLogClient({ workout, weightUnit }: RetroLogClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [exerciseSets, setExerciseSets] = useState<Record<string, SetEntry[]>>(() => {
    const init: Record<string, SetEntry[]> = {};
    for (const te of workout.template.exercises) {
      const count = te.prescribed_sets ?? 3;
      const defaultReps = parseFirstNumber(te.prescribed_reps);
      init[te.id] = Array.from({ length: count }, () => ({
        reps: defaultReps,
        weight: "",
      }));
    }
    return init;
  });

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});
  const [substitutions, setSubstitutions] = useState<Record<string, Substitution>>({});
  const [substituteTarget, setSubstituteTarget] = useState<string | null>(null);

  function toggleExpanded(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function updateSet(exerciseId: string, setIndex: number, field: "reps" | "weight", value: string) {
    setExerciseSets((prev) => {
      const sets = [...(prev[exerciseId] ?? [])];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      return { ...prev, [exerciseId]: sets };
    });
  }

  function addSet(exerciseId: string) {
    setExerciseSets((prev) => {
      const sets = [...(prev[exerciseId] ?? [])];
      sets.push({ reps: "", weight: "" });
      return { ...prev, [exerciseId]: sets };
    });
  }

  function removeSet(exerciseId: string, setIndex: number) {
    setExerciseSets((prev) => {
      const sets = (prev[exerciseId] ?? []).filter((_, i) => i !== setIndex);
      return { ...prev, [exerciseId]: sets };
    });
  }

  function handleSubstitute(exercise: Exercise, reason?: string) {
    if (!substituteTarget) return;
    setSubstitutions((prev) => ({
      ...prev,
      [substituteTarget]: {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        reason,
      },
    }));
    setSubstituteTarget(null);
  }

  function removeSubstitution(templateExerciseId: string) {
    setSubstitutions((prev) => {
      const next = { ...prev };
      delete next[templateExerciseId];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);

    const sets = Object.entries(exerciseSets).flatMap(([templateExerciseId, entries]) =>
      entries.map((entry, i) => ({
        templateExerciseId,
        setNumber: i + 1,
        reps: entry.reps ? parseInt(entry.reps, 10) : null,
        weight: entry.weight ? parseFloat(entry.weight) || null : null,
      }))
    );

    // Build substitutions map for the server action
    const subsMap: Record<string, { exerciseId: string; reason?: string }> = {};
    for (const [teId, sub] of Object.entries(substitutions)) {
      subsMap[teId] = { exerciseId: sub.exerciseId, reason: sub.reason };
    }

    const result = await saveRetroLog({
      scheduledWorkoutId: workout.id,
      workoutTemplateId: workout.template.id,
      programId: workout.program.id,
      weightUnit,
      sets,
      notes: exerciseNotes,
      substitutions: Object.keys(subsMap).length > 0 ? subsMap : undefined,
    });

    if (result?.error) {
      setSaveError(result.error);
      setSaving(false);
      return;
    }

    router.push("/calendar");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 px-4 pt-4 pb-28">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        {new Date(workout.scheduled_date + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </p>

      {workout.template.exercises.map((te) => {
        const isOpen = expanded[te.id] ?? false;
        const sets = exerciseSets[te.id] ?? [];
        const sub = substitutions[te.id];
        const displayName = sub?.exerciseName ?? te.exercise?.name ?? "Unknown";
        const prescribedLabel = `${te.prescribed_sets ?? "—"} × ${te.prescribed_reps ?? "—"}`;

        return (
          <div key={te.id} className="rounded-2xl bg-background overflow-hidden">
            {/* Header */}
            <button
              type="button"
              onClick={() => toggleExpanded(te.id)}
              className="flex w-full items-center justify-between px-4 py-3"
            >
              <div className="flex flex-col items-start gap-0.5 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-primary">{displayName}</h3>
                  <span className="rounded-full bg-surface border border-primary/5 px-2.5 py-0.5 text-xs text-muted">
                    {prescribedLabel}
                  </span>
                </div>
                {sub && (
                  <span className="text-[10px] italic text-primary/40">
                    Subbed for {te.exercise?.name}
                  </span>
                )}
              </div>
              <svg
                className={cn(
                  "h-5 w-5 text-primary/40 transition-transform flex-shrink-0",
                  isOpen && "rotate-180"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="flex flex-col gap-2 px-2 pb-3">
                {/* Header row */}
                <div className="flex items-center gap-3 px-3">
                  <span className="w-6" />
                  <span className="flex-1 text-center text-[10px] font-medium uppercase tracking-wide text-primary/40">
                    Weight ({weightUnit})
                  </span>
                  <span className="flex-1 text-center text-[10px] font-medium uppercase tracking-wide text-primary/40">
                    Reps
                  </span>
                  <span className="w-10" />
                </div>

                {sets.map((set, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 bg-surface"
                  >
                    <span className="w-6 text-center text-sm font-semibold text-primary/60">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={set.weight}
                        onChange={(e) => updateSet(te.id, i, "weight", e.target.value)}
                        placeholder={weightUnit}
                        className="h-14 w-full rounded-xl border border-primary/20 bg-surface text-xl text-center font-semibold text-primary placeholder:text-primary/25 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={set.reps}
                        onChange={(e) => updateSet(te.id, i, "reps", e.target.value)}
                        placeholder="—"
                        className="h-14 w-full rounded-xl border border-primary/20 bg-surface text-xl text-center font-semibold text-primary placeholder:text-primary/25 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                      />
                    </div>
                    {sets.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeSet(te.id, i)}
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-primary/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="Remove set"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    ) : (
                      <span className="w-10" />
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addSet(te.id)}
                  className="mx-3 mt-1 rounded-xl border border-dashed border-primary/20 py-2 text-xs font-medium text-primary/50 hover:border-primary/40 hover:text-primary/70 transition-colors"
                >
                  + Add Set
                </button>

                {/* Exercise note */}
                <textarea
                  value={exerciseNotes[te.id] ?? ""}
                  onChange={(e) =>
                    setExerciseNotes((prev) => ({ ...prev, [te.id]: e.target.value }))
                  }
                  placeholder="Add a note about this exercise..."
                  rows={2}
                  className="mx-3 mt-2 w-[calc(100%-1.5rem)] rounded-xl border border-primary/20 bg-surface px-3 py-2 text-sm text-primary placeholder:text-primary/25 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />

                {/* Substitute button */}
                <div className="mx-3 mt-1">
                  {sub ? (
                    <button
                      type="button"
                      onClick={() => removeSubstitution(te.id)}
                      className="text-xs text-primary/40 hover:text-primary/60 transition-colors"
                    >
                      ← Revert to {te.exercise?.name}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSubstituteTarget(te.id)}
                      className="text-xs font-medium text-primary/40 hover:text-primary/60 transition-colors"
                    >
                      Substitute exercise...
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Fixed save button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-primary/10 bg-background px-4 py-3 pb-safe">
        {saveError && (
          <div className="mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs font-medium text-red-800">{saveError}</p>
          </div>
        )}
        <Button
          fullWidth
          size="lg"
          onClick={handleSave}
          loading={saving}
        >
          Save Workout
        </Button>
      </div>

      {/* Exercise search modal */}
      <ExerciseSearchModal
        isOpen={substituteTarget !== null}
        onClose={() => setSubstituteTarget(null)}
        onSelect={handleSubstitute}
      />
    </div>
  );
}
