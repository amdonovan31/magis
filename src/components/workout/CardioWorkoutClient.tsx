"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { completeCardioSession, deleteSession } from "@/lib/actions/session.actions";
import { HR_ZONES } from "@/types/app.types";
import CardioHistoryModal from "./CardioHistoryModal";

interface CardioWorkoutClientProps {
  sessionId: string;
  startedAt: string;
  prescription: {
    modality: string;
    durationMinutes: number | null;
    distanceTarget: number | null;
    distanceUnit: string | null;
    hrZone: number | null;
    notes: string | null;
  };
  templateTitle: string;
  preferredUnit: string;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function CardioWorkoutClient({
  sessionId,
  startedAt,
  prescription,
  templateTitle,
}: CardioWorkoutClientProps) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [distance, setDistance] = useState("");
  const [distanceUnit, setDistanceUnit] = useState(prescription.distanceUnit ?? "miles");
  const [avgHR, setAvgHR] = useState("");
  const [rpe, setRpe] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [completing, setCompleting] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const zoneInfo = prescription.hrZone
    ? HR_ZONES.find((z) => z.zone === prescription.hrZone)
    : null;

  async function handleComplete() {
    setCompleting(true);
    setError(null);

    const totalSeconds =
      (minutes ? parseInt(minutes) * 60 : 0) + (seconds ? parseInt(seconds) : 0);

    await completeCardioSession({
      sessionId,
      durationSeconds: totalSeconds > 0 ? totalSeconds : null,
      distanceValue: distance ? parseFloat(distance) : null,
      distanceUnit: distance ? distanceUnit : null,
      avgHeartRate: avgHR ? parseInt(avgHR) : null,
      rpe,
      notes: notes.trim() || null,
    });
  }

  async function handleDiscard() {
    if (!confirm("Discard this workout?")) return;
    setDiscarding(true);
    await deleteSession(sessionId);
    router.push("/home");
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary">{templateTitle}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="accent">{prescription.modality || "Cardio"}</Badge>
            <span className="text-xs text-primary/40">{formatElapsed(elapsed)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-primary/30 hover:text-primary hover:bg-primary/5 transition-colors"
            title="Past sessions"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
          <button
            onClick={handleDiscard}
            disabled={discarding}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            {discarding ? "..." : "Discard"}
          </button>
        </div>
      </div>

      {/* Prescription / Target */}
      <Card className="bg-accent/5 border border-accent/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent/60 mb-2">Target</p>
        <div className="flex flex-col gap-1.5 text-sm text-primary">
          {prescription.durationMinutes && (
            <p>{prescription.durationMinutes} minutes</p>
          )}
          {prescription.distanceTarget && (
            <p>{prescription.distanceTarget} {prescription.distanceUnit ?? ""}</p>
          )}
          {zoneInfo && (
            <p>{zoneInfo.label} — {zoneInfo.description}</p>
          )}
          {prescription.notes && (
            <p className="text-xs text-primary/50 mt-1">{prescription.notes}</p>
          )}
          {!prescription.durationMinutes && !prescription.distanceTarget && !zoneInfo && !prescription.notes && (
            <p className="text-primary/40">No specific targets set</p>
          )}
        </div>
      </Card>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Logging inputs */}
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary/40 mb-3">Your Results</p>
        <div className="flex flex-col gap-4">
          {/* Time */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-primary">Time</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="numeric"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="00"
                className="h-10 w-16 rounded-xl border border-primary/20 bg-surface px-2 text-center text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-sm text-primary/40">min</span>
              <input
                type="number"
                inputMode="numeric"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                placeholder="00"
                min="0"
                max="59"
                className="h-10 w-16 rounded-xl border border-primary/20 bg-surface px-2 text-center text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-sm text-primary/40">sec</span>
            </div>
          </div>

          {/* Distance */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-primary">
              Distance <span className="text-primary/40">(optional)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="—"
                className="h-10 w-24 rounded-xl border border-primary/20 bg-surface px-3 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <select
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value)}
                className="h-10 rounded-xl border border-primary/20 bg-surface px-3 text-sm text-primary"
              >
                <option value="miles">miles</option>
                <option value="km">km</option>
                <option value="meters">meters</option>
              </select>
            </div>
          </div>

          {/* Avg Heart Rate */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-primary">
              Avg Heart Rate <span className="text-primary/40">(optional)</span>
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="numeric"
                value={avgHR}
                onChange={(e) => setAvgHR(e.target.value)}
                placeholder="—"
                className="h-10 w-20 rounded-xl border border-primary/20 bg-surface px-3 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-sm text-primary/40">bpm</span>
            </div>
          </div>

          {/* RPE */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-primary">
              RPE <span className="text-primary/40">(optional)</span>
            </label>
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                <button
                  key={val}
                  onClick={() => setRpe(rpe === val ? null : val)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                    rpe === val
                      ? "bg-primary text-white"
                      : "bg-primary/5 text-primary/50 hover:bg-primary/10"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-primary">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it feel?"
              rows={2}
              className="rounded-xl border border-primary/20 bg-surface px-3 py-2 text-sm text-primary resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </Card>

      {/* Complete */}
      <Button fullWidth size="lg" onClick={handleComplete} loading={completing}>
        Complete Workout
      </Button>

      {/* History Modal */}
      {showHistory && (
        <CardioHistoryModal
          modality={prescription.modality}
          excludeSessionId={sessionId}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
