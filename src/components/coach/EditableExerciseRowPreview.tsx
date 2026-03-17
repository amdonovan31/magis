"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface GeneratedExercise {
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
  prescribed_weight?: string;
  alternate_exercise_ids?: string[];
}

interface Props {
  exercise: GeneratedExercise;
  exerciseName: string;
  exerciseInstruction?: string;
  isEditing: boolean;
  onUpdate: (updated: GeneratedExercise) => void;
  onSwapExercise: () => void;
  onRemove: () => void;
  id: string;
}

export default function EditableExerciseRowPreview({
  exercise,
  exerciseName,
  exerciseInstruction,
  isEditing,
  onUpdate,
  onSwapExercise,
  onRemove,
  id,
}: Props) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!isEditing) {
    // Read-only mode — identical to original ProgramReview row
    return (
      <div className="flex items-center justify-between rounded-lg bg-bg/50 px-3 py-2" title={exerciseInstruction}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary truncate">
            {exerciseName}
          </p>
          {exercise.notes && (
            <p className="text-[10px] text-primary/40 truncate">{exercise.notes}</p>
          )}
        </div>
        <div className="ml-3 shrink-0 text-right text-xs text-primary/60">
          <span>{exercise.sets} &times; {exercise.reps}</span>
          {exercise.prescribed_weight && (
            <span className="ml-2 text-primary/40">@ {exercise.prescribed_weight}</span>
          )}
          <span className="ml-2 text-primary/30">{exercise.rest_seconds}s</span>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg bg-bg/50 px-3 py-2.5"
    >
      {/* Top row: drag handle, exercise name, remove */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none text-primary/30 hover:text-primary/60 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          &#x2807;
        </button>

        <button
          type="button"
          onClick={onSwapExercise}
          className="min-w-0 flex-1 text-left"
          title={exerciseInstruction ?? exerciseName}
        >
          <p className="text-sm font-medium text-accent underline decoration-accent/30 underline-offset-2">
            {exerciseName}
          </p>
        </button>

        {/* Remove button */}
        {confirmRemove ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => { onRemove(); setConfirmRemove(false); }}
              className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemove(false)}
              className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary/60"
            >
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="shrink-0 text-primary/30 hover:text-red-500 transition-colors"
            title="Remove exercise"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom row: inputs */}
      <div className="mt-1.5 ml-6 flex items-center gap-1.5">
        <label className="flex items-center gap-1 text-[10px] text-primary/40">
          Sets
          <input
            type="number"
            min={1}
            max={20}
            value={exercise.sets}
            onChange={(e) =>
              onUpdate({ ...exercise, sets: parseInt(e.target.value) || 1 })
            }
            className="w-10 rounded bg-surface px-1 py-0.5 text-center text-xs text-primary border border-primary/10 focus:border-primary/30 focus:outline-none"
          />
        </label>
        <span className="text-xs text-primary/20">&times;</span>
        <label className="flex items-center gap-1 text-[10px] text-primary/40">
          Reps
          <input
            type="text"
            value={exercise.reps}
            onChange={(e) =>
              onUpdate({ ...exercise, reps: e.target.value })
            }
            className="w-14 rounded bg-surface px-1 py-0.5 text-center text-xs text-primary border border-primary/10 focus:border-primary/30 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-1 text-[10px] text-primary/40">
          Wt
          <input
            type="text"
            value={exercise.prescribed_weight ?? ""}
            onChange={(e) =>
              onUpdate({ ...exercise, prescribed_weight: e.target.value || undefined })
            }
            placeholder="—"
            className="w-14 rounded bg-surface px-1 py-0.5 text-center text-xs text-primary border border-primary/10 focus:border-primary/30 focus:outline-none placeholder:text-primary/20"
          />
        </label>
        <label className="flex items-center gap-1 text-[10px] text-primary/40">
          Rest
          <input
            type="number"
            min={0}
            max={600}
            value={exercise.rest_seconds}
            onChange={(e) =>
              onUpdate({ ...exercise, rest_seconds: parseInt(e.target.value) || 0 })
            }
            className="w-12 rounded bg-surface px-1 py-0.5 text-center text-xs text-primary border border-primary/10 focus:border-primary/30 focus:outline-none"
          />
          <span className="text-[10px] text-primary/30">s</span>
        </label>
      </div>
    </div>
  );
}
