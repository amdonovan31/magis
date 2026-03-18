"use client";

import { useState } from "react";
import ExerciseDemoModal from "./ExerciseDemoModal";
import type { Exercise } from "@/types/app.types";

interface Props {
  alternates: Exercise[];
  onSwap?: (exercise: Exercise) => void;
}

export default function AlternateExercises({ alternates, onSwap }: Props) {
  const [open, setOpen] = useState(false);
  const [demoExercise, setDemoExercise] = useState<Exercise | null>(null);

  if (alternates.length === 0) return null;

  return (
    <div className="px-4 pb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-primary/40 hover:text-primary/60 transition-colors"
      >
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Alternatives ({alternates.length})
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-1.5 rounded-xl bg-primary/[0.03] border border-primary/10 p-2">
          {alternates.map((alt) => (
            <div
              key={alt.id}
              className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-primary truncate">
                  {alt.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {alt.equipment && (
                    <span className="shrink-0 rounded-full bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary/50">
                      {alt.equipment}
                    </span>
                  )}
                  {alt.instructions && (
                    <p className="text-xs text-primary/40 line-clamp-1">
                      {alt.instructions}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onSwap && (
                  <button
                    type="button"
                    onClick={() => {
                      onSwap(alt);
                      setOpen(false);
                    }}
                    className="rounded-lg bg-accent/10 px-2.5 py-1.5 text-[11px] font-medium text-accent hover:bg-accent/20 transition-colors"
                  >
                    Use this
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDemoExercise(alt)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-primary/30 hover:bg-primary/10 hover:text-primary transition-colors"
                  aria-label={`Info for ${alt.name}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {demoExercise && (
        <ExerciseDemoModal
          exercise={demoExercise}
          isOpen={!!demoExercise}
          onClose={() => setDemoExercise(null)}
        />
      )}
    </div>
  );
}
