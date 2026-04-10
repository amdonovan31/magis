"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ExerciseLogger from "./ExerciseLogger";
import ExtraWorkEntry from "./ExtraWorkEntry";
import RestTimer from "./RestTimer";
import UnitToggle from "./UnitToggle";
import WorkoutProgress from "./WorkoutProgress";
import { getPersistedSession, persistSkip } from "@/lib/workout-persistence";
import { logSet, skipExercise } from "@/lib/actions/session.actions";
import { fetchExercisesByIds } from "@/lib/actions/exercise.actions";
import type { WorkoutTemplateWithExercises, SetLog, Exercise } from "@/types/app.types";
import type { PersistedSet } from "@/lib/workout-persistence";

type SyncBannerState = "restoring" | "syncing" | "failed" | null;
type WeightUnit = "kg" | "lbs";

interface WorkoutClientProps {
  sessionId: string;
  template: WorkoutTemplateWithExercises;
  setLogs: SetLog[];
  preferredUnit: WeightUnit;
  initialSkippedExercises: string[];
  exerciseNotes: { template_exercise_id: string; content: string | null }[];
  initialExtraWork: {
    group_id: string;
    exercise_name: string;
    set_number: number;
    reps_completed: number | null;
    weight_value: number | null;
    weight_unit: string | null;
  }[];
  initialResolvedSets: number;
  totalSets: number;
}

export default function WorkoutClient({
  sessionId,
  template,
  setLogs,
  preferredUnit,
  initialSkippedExercises,
  exerciseNotes,
  initialExtraWork,
  initialResolvedSets,
  totalSets,
}: WorkoutClientProps) {
  const router = useRouter();
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(preferredUnit);
  const [skippedExercises, setSkippedExercises] = useState<Set<string>>(
    () => new Set(initialSkippedExercises)
  );
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [bannerState, setBannerState] = useState<SyncBannerState>(null);
  const [persistedSwaps, setPersistedSwaps] = useState<Record<string, string>>({});
  const [swappedExerciseCache, setSwappedExerciseCache] = useState<Record<string, Exercise>>({});
  const syncAttempted = useRef(false);

  // Optimistic progress count
  const [resolvedCount, setResolvedCount] = useState(initialResolvedSets);

  // Extra work state — group initial data by group_id
  const [extraExercises, setExtraExercises] = useState<
    { groupId: string; name: string; sets: { setNumber: number; reps: string; weight: string; done: boolean }[] }[]
  >(() => {
    const grouped = new Map<string, typeof initialExtraWork>();
    for (const row of initialExtraWork) {
      if (!grouped.has(row.group_id)) grouped.set(row.group_id, []);
      grouped.get(row.group_id)!.push(row);
    }
    return Array.from(grouped.entries()).map(([groupId, rows]) => ({
      groupId,
      name: rows[0].exercise_name,
      sets: rows
        .sort((a, b) => a.set_number - b.set_number)
        .map((r) => ({
          setNumber: r.set_number,
          reps: r.reps_completed?.toString() ?? "",
          weight: r.weight_value?.toString() ?? "",
          done: true,
        })),
    }));
  });

  const handleSkipExercise = useCallback(
    async (templateExerciseId: string) => {
      // Persist locally first
      persistSkip(sessionId, templateExerciseId);
      setSkippedExercises((prev) => new Set([...Array.from(prev), templateExerciseId]));

      // Save to DB (fire and forget)
      skipExercise(sessionId, templateExerciseId);
    },
    [sessionId]
  );

  const handleSetComplete = useCallback((seconds: number) => {
    setRestSeconds(seconds);
  }, []);

  const handleDismissTimer = useCallback(() => {
    setRestSeconds(null);
  }, []);

  // Build a lookup map for exercise notes
  const notesByExercise = Object.fromEntries(
    exerciseNotes
      .filter((n) => n.content)
      .map((n) => [n.template_exercise_id, n.content!])
  );

  // Shared sync helper — used by both mount restore and online event
  const syncMissingSets = useCallback(
    async (label: SyncBannerState) => {
      const persisted = getPersistedSession(sessionId);
      if (!persisted) return;

      const serverSetKeys = new Set(
        setLogs
          .filter((l) => l.is_completed)
          .map((l) => `${l.template_exercise_id}_${l.set_number}`)
      );

      const missingEntries = Object.entries(persisted.sets).filter(
        ([key, set]) => set.completed && !serverSetKeys.has(key)
      );

      if (missingEntries.length === 0) return;

      setBannerState(label);

      const results = await Promise.allSettled(
        missingEntries.map(([, set]: [string, PersistedSet]) =>
          logSet({
            sessionId,
            templateExerciseId: set.templateExerciseId,
            exerciseIdOverride: set.exerciseIdOverride ?? undefined,
            setNumber: set.setNumber,
            repsCompleted: set.repsCompleted,
            weightUsed: set.weightUsed,
            weightUnit,
            rpe: null,
          })
        )
      );

      const anyFailed = results.some(
        (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.error)
      );

      if (anyFailed) {
        setBannerState("failed");
      } else {
        setBannerState(null);
        router.refresh();
      }
    },
    [sessionId, setLogs, router, weightUnit]
  );

  // Restore on mount
  useEffect(() => {
    if (syncAttempted.current) return;
    syncAttempted.current = true;

    const persisted = getPersistedSession(sessionId);
    if (!persisted) return;

    // Ignore persisted data older than 24 hours
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (Date.now() - persisted.lastUpdated > twentyFourHours) return;

    // Restore swapped exercises
    if (persisted.swappedExercises && Object.keys(persisted.swappedExercises).length > 0) {
      setPersistedSwaps(persisted.swappedExercises);

      // Batch-fetch swapped exercise objects
      const swapIds = Object.values(persisted.swappedExercises);
      if (swapIds.length > 0) {
        fetchExercisesByIds(swapIds).then((exercises) => {
          const cache: Record<string, Exercise> = {};
          for (const ex of exercises) cache[ex.id] = ex;
          setSwappedExerciseCache(cache);
        });
      }
    }

    // Restore skipped exercises
    if (persisted.skippedExercises && persisted.skippedExercises.length > 0) {
      setSkippedExercises((prev) => {
        const merged = new Set([...Array.from(prev), ...persisted.skippedExercises!]);
        return merged.size > prev.size ? merged : prev;
      });
    }

    // Sync missing sets
    syncMissingSets("restoring");
  }, [sessionId, syncMissingSets]);

  // Re-sync when connectivity is restored
  useEffect(() => {
    function handleOnline() {
      syncMissingSets("syncing");
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncMissingSets]);

  return (
    <>
      {bannerState === "restoring" && (
        <div className="bg-primary/10 text-primary text-center text-xs py-2 px-4 font-medium animate-pulse">
          Restoring your session&hellip;
        </div>
      )}
      {bannerState === "syncing" && (
        <div className="bg-emerald-500/10 text-emerald-700 text-center text-xs py-2 px-4 font-medium animate-pulse">
          Back online &mdash; syncing&hellip;
        </div>
      )}
      {bannerState === "failed" && (
        <div className="bg-amber-500/10 text-amber-700 text-center text-xs py-2 px-4 font-medium">
          Some sets couldn&apos;t sync &mdash; they&apos;re saved locally and will retry when you reconnect
        </div>
      )}

      {/* Progress bar (optimistic) */}
      <div className="px-4 pt-3 pb-2 bg-primary/5">
        <WorkoutProgress completed={resolvedCount} total={totalSets} />
      </div>

      {/* Unit toggle */}
      <div className="flex items-center justify-end px-4 pt-2">
        <UnitToggle unit={weightUnit} onChange={setWeightUnit} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4 pb-32">
        {template.exercises?.map((te) => (
          <div key={te.id} className="rounded-2xl bg-surface border border-primary/10 overflow-hidden">
            <ExerciseLogger
              sessionId={sessionId}
              templateExercise={te}
              existingLogs={setLogs.filter(
                (l) => l.template_exercise_id === te.id
              )}
              onSetComplete={handleSetComplete}
              initialSwappedExercise={
                persistedSwaps[te.id]
                  ? swappedExerciseCache[persistedSwaps[te.id]] ?? null
                  : null
              }
              weightUnit={weightUnit}
              isSkipped={skippedExercises.has(te.id)}
              onSkip={() => handleSkipExercise(te.id)}
              initialNote={notesByExercise[te.id] ?? ""}
              onSetResolved={() => setResolvedCount((c) => c + 1)}
              onSetUnresolved={() => setResolvedCount((c) => c - 1)}
            />
          </div>
        ))}

        {/* Extra work entries */}
        {extraExercises.map((ex) => (
          <ExtraWorkEntry
            key={ex.groupId}
            sessionId={sessionId}
            groupId={ex.groupId}
            initialName={ex.name}
            initialSets={ex.sets}
            weightUnit={weightUnit}
            onRemove={() =>
              setExtraExercises((prev) =>
                prev.filter((e) => e.groupId !== ex.groupId)
              )
            }
          />
        ))}

        {/* Add extra work button */}
        <button
          type="button"
          onClick={() =>
            setExtraExercises((prev) => [
              ...prev,
              {
                groupId: crypto.randomUUID(),
                name: "",
                sets: [{ setNumber: 1, reps: "", weight: "", done: false }],
              },
            ])
          }
          className="rounded-2xl border border-dashed border-primary/15 py-3 text-center text-sm font-medium text-primary/40 hover:text-primary/60 hover:border-primary/25 transition-colors"
        >
          + Add extra work
        </button>
      </div>

      {restSeconds !== null && (
        <RestTimer seconds={restSeconds} onDismiss={handleDismissTimer} />
      )}
    </>
  );
}
