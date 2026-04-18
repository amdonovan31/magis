"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import { formatRelativeTime } from "@/lib/utils/date";
import { fetchExerciseHistory } from "@/lib/actions/session.actions";
import type { ExerciseHistorySession } from "@/lib/queries/session.queries";

interface ExerciseHistoryModalProps {
  exerciseId: string;
  exerciseName: string;
  excludeSessionId: string;
  weightUnit: "kg" | "lbs";
  onClose: () => void;
}

export default function ExerciseHistoryModal({
  exerciseId,
  exerciseName,
  excludeSessionId,
  weightUnit,
  onClose,
}: ExerciseHistoryModalProps) {
  const [sessions, setSessions] = useState<ExerciseHistorySession[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchExerciseHistory(exerciseId, excludeSessionId);
      if (!cancelled) {
        setSessions(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [exerciseId, excludeSessionId]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10">
        <div>
          <h2 className="font-semibold text-primary">{exerciseName}</h2>
          <p className="text-xs text-primary/40">Last 5 sessions</p>
        </div>
        <button onClick={onClose} className="text-sm text-primary/50">
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary/20 border-t-primary" />
          </div>
        )}

        {!loading && (!sessions || sessions.length === 0) && (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-primary/50">No previous history for this exercise</p>
          </div>
        )}

        {!loading && sessions && sessions.length > 0 && (
          <div className="flex flex-col gap-3">
            {sessions.map((session) => (
              <Card key={session.sessionId}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-primary/50">
                      {formatRelativeTime(session.date)}
                    </p>
                    <p className="text-xs text-primary/30">
                      {session.templateTitle ?? "Free Workout"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 text-[10px] font-semibold uppercase tracking-wide text-primary/30 px-1">
                      <span>Set</span>
                      <span>Reps</span>
                      <span>{weightUnit}</span>
                      <span>RPE</span>
                    </div>

                    {session.sets.map((set) => (
                      <div
                        key={set.setNumber}
                        className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center px-1 py-1 text-sm"
                      >
                        <span className="text-xs text-primary/40">{set.setNumber}</span>
                        <span className="text-primary">{set.reps ?? "—"}</span>
                        <span className="text-primary">{set.weight ?? "—"}</span>
                        <span className="text-xs text-primary/40">{set.rpe ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
