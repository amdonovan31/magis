"use client";

import { useState, useRef, useCallback } from "react";

interface TemplateExercise {
  id: string;
  exercise_id: string;
  exercise: { name: string; muscle_group: string | null };
  position: number;
  prescribed_sets: number | null;
  prescribed_reps: string | null;
  rest_seconds: number | null;
  notes: string | null;
}

interface Props {
  exercise: TemplateExercise;
  isFirst: boolean;
  isLast: boolean;
  onUpdateField: (id: string, data: Record<string, unknown>) => void;
  onSwap: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
}

export default function EditableExerciseRow({
  exercise,
  isFirst,
  isLast,
  onUpdateField,
  onSwap,
  onRemove,
  onReorder,
}: Props) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const debouncedUpdate = useCallback(
    (field: string, value: unknown) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdateField(exercise.id, { [field]: value });
      }, 300);
    },
    [exercise.id, onUpdateField]
  );

  return (
    <div className="flex items-center gap-2 rounded-lg bg-bg/50 px-3 py-2">
      {/* Reorder arrows */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          type="button"
          disabled={isFirst}
          onClick={() => onReorder(exercise.id, "up")}
          className="text-primary/30 hover:text-primary disabled:opacity-20 disabled:cursor-default text-xs leading-none"
          aria-label="Move up"
        >
          ▲
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={() => onReorder(exercise.id, "down")}
          className="text-primary/30 hover:text-primary disabled:opacity-20 disabled:cursor-default text-xs leading-none"
          aria-label="Move down"
        >
          ▼
        </button>
      </div>

      {/* Exercise name (tap to swap) */}
      <button
        type="button"
        onClick={() => onSwap(exercise.id)}
        className="flex-1 min-w-0 text-left"
      >
        <p className="text-sm font-medium text-primary hover:text-accent transition-colors">
          {exercise.exercise.name}
        </p>
        {exercise.exercise.muscle_group && (
          <p className="text-[10px] text-primary/40">{exercise.exercise.muscle_group}</p>
        )}
      </button>

      {/* Inline editable fields */}
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          defaultValue={exercise.prescribed_sets ?? ""}
          onChange={(e) => debouncedUpdate("prescribed_sets", parseInt(e.target.value) || null)}
          className="w-10 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-center text-xs text-primary/70 focus:border-primary/20 focus:bg-surface focus:outline-none"
          placeholder="sets"
          aria-label="Sets"
        />
        <span className="text-primary/20 text-xs">×</span>
        <input
          type="text"
          defaultValue={exercise.prescribed_reps ?? ""}
          onChange={(e) => debouncedUpdate("prescribed_reps", e.target.value || null)}
          className="w-14 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-center text-xs text-primary/70 focus:border-primary/20 focus:bg-surface focus:outline-none"
          placeholder="reps"
          aria-label="Reps"
        />
        <input
          type="number"
          defaultValue={exercise.rest_seconds ?? ""}
          onChange={(e) => debouncedUpdate("rest_seconds", parseInt(e.target.value) || null)}
          className="w-12 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-center text-xs text-primary/30 focus:border-primary/20 focus:bg-surface focus:text-primary/70 focus:outline-none"
          placeholder="rest"
          aria-label="Rest seconds"
        />
      </div>

      {/* Remove */}
      {confirmRemove ? (
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => { onRemove(exercise.id); setConfirmRemove(false); }}
            className="text-[10px] font-medium text-red-600 hover:text-red-800"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setConfirmRemove(false)}
            className="text-[10px] font-medium text-primary/40 hover:text-primary"
          >
            No
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmRemove(true)}
          className="shrink-0 text-primary/20 hover:text-red-500 transition-colors"
          aria-label="Remove exercise"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
