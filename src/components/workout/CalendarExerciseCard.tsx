"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";

interface AlternateInfo {
  id: string;
  name: string;
  equipment: string | null;
}

interface Props {
  index: number;
  name: string;
  muscleGroup: string | null;
  prescribedSets: number | null;
  prescribedReps: string | null;
  prescribedWeight: string | null;
  restSeconds: number | null;
  alternates: AlternateInfo[];
}

export default function CalendarExerciseCard({
  index,
  name,
  muscleGroup,
  prescribedSets,
  prescribedReps,
  prescribedWeight,
  restSeconds,
  alternates,
}: Props) {
  const [showAlts, setShowAlts] = useState(false);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/5 text-xs font-bold text-primary/40">
            {index}
          </span>
          <div>
            <p className="font-body font-medium text-primary">{name}</p>
            {muscleGroup && (
              <span className="mt-0.5 inline-block rounded-full bg-surface border border-primary/5 px-2 py-0.5 text-[10px] text-muted">
                {muscleGroup}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <span className="text-sm text-muted">
            {prescribedSets ?? "—"}&times;{prescribedReps ?? "—"}
          </span>
          {prescribedWeight && (
            <span className="text-xs text-primary/40">
              @ {prescribedWeight}
            </span>
          )}
          {restSeconds != null && restSeconds > 0 && (
            <span className="text-xs text-primary/40">
              {restSeconds}s rest
            </span>
          )}
        </div>
      </div>

      {alternates.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowAlts(!showAlts)}
            className="flex items-center gap-1 text-xs text-primary/40 hover:text-primary/60 transition-colors"
          >
            <svg
              className={`h-3 w-3 transition-transform ${showAlts ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Alternatives ({alternates.length})
          </button>

          {showAlts && (
            <div className="mt-1.5 flex flex-col gap-1 pl-1">
              {alternates.map((alt) => (
                <div
                  key={alt.id}
                  className="flex items-center gap-2 text-xs text-primary/50"
                >
                  <span className="font-medium text-primary/70">{alt.name}</span>
                  {alt.equipment && (
                    <span className="rounded-full bg-primary/5 px-1.5 py-0.5 text-[10px] text-primary/40">
                      {alt.equipment}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
