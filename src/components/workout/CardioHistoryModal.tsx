"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import { formatRelativeTime } from "@/lib/utils/date";
import { fetchCardioHistory } from "@/lib/actions/session.actions";
import type { CardioHistorySession } from "@/lib/queries/session.queries";

interface CardioHistoryModalProps {
  modality: string;
  excludeSessionId: string;
  onClose: () => void;
}

function formatDurationShort(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m} min`;
}

export default function CardioHistoryModal({
  modality,
  excludeSessionId,
  onClose,
}: CardioHistoryModalProps) {
  const [sessions, setSessions] = useState<CardioHistorySession[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchCardioHistory(modality, excludeSessionId);
      if (!cancelled) {
        setSessions(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [modality, excludeSessionId]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10">
        <div>
          <h2 className="font-semibold text-primary">{modality}</h2>
          <p className="text-xs text-primary/40">Last 5 sessions</p>
        </div>
        <button onClick={onClose} className="text-sm text-primary/50">Close</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary/20 border-t-primary" />
          </div>
        )}

        {!loading && (!sessions || sessions.length === 0) && (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-primary/50">No previous sessions for {modality}</p>
          </div>
        )}

        {!loading && sessions && sessions.length > 0 && (
          <div className="flex flex-col gap-3">
            {sessions.map((session) => (
              <Card key={session.sessionId}>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-primary/50">
                      {formatRelativeTime(session.date)}
                    </p>
                    <p className="text-xs text-primary/30">
                      {session.templateTitle ?? "Cardio"}
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    {session.durationSeconds && (
                      <div>
                        <p className="text-xs text-primary/40">Time</p>
                        <p className="font-medium text-primary">{formatDurationShort(session.durationSeconds)}</p>
                      </div>
                    )}
                    {session.distanceValue && (
                      <div>
                        <p className="text-xs text-primary/40">Distance</p>
                        <p className="font-medium text-primary">{session.distanceValue} {session.distanceUnit ?? ""}</p>
                      </div>
                    )}
                    {session.avgHeartRate && (
                      <div>
                        <p className="text-xs text-primary/40">Avg HR</p>
                        <p className="font-medium text-primary">{session.avgHeartRate} bpm</p>
                      </div>
                    )}
                    {session.rpe && (
                      <div>
                        <p className="text-xs text-primary/40">RPE</p>
                        <p className="font-medium text-primary">{session.rpe}/10</p>
                      </div>
                    )}
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
