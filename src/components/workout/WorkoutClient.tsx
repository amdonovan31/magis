"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ExerciseLogger from "./ExerciseLogger";
import RestTimer from "./RestTimer";
import { getPersistedSession } from "@/lib/workout-persistence";
import { logSet } from "@/lib/actions/session.actions";
import type { WorkoutTemplateWithExercises, SetLog } from "@/types/app.types";
import type { PersistedSet } from "@/lib/workout-persistence";

type SyncBannerState = "restoring" | "syncing" | "failed" | null;

interface WorkoutClientProps {
  sessionId: string;
  template: WorkoutTemplateWithExercises;
  setLogs: SetLog[];
}

export default function WorkoutClient({
  sessionId,
  template,
  setLogs,
}: WorkoutClientProps) {
  const router = useRouter();
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [bannerState, setBannerState] = useState<SyncBannerState>(null);
  const [persistedSwaps, setPersistedSwaps] = useState<Record<string, string>>({});
  const syncAttempted = useRef(false);

  const handleSetComplete = useCallback((seconds: number) => {
    setRestSeconds(seconds);
  }, []);

  const handleDismissTimer = useCallback(() => {
    setRestSeconds(null);
  }, []);

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
    [sessionId, setLogs, router]
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

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 pb-32">
        {template.exercises?.map((te) => (
          <div key={te.id} className="rounded-2xl bg-surface border border-primary/10 overflow-hidden">
            <ExerciseLogger
              sessionId={sessionId}
              templateExercise={te}
              existingLogs={setLogs.filter(
                (l) => l.template_exercise_id === te.id
              )}
              onSetComplete={handleSetComplete}
              initialSwappedExerciseId={persistedSwaps[te.id] ?? null}
            />
          </div>
        ))}
      </div>

      {restSeconds !== null && (
        <RestTimer seconds={restSeconds} onDismiss={handleDismissTimer} />
      )}
    </>
  );
}
