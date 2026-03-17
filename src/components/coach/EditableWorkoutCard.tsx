"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Card from "@/components/ui/Card";
import EditableExerciseRowPreview from "./EditableExerciseRowPreview";

interface GeneratedExercise {
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
  prescribed_weight?: string;
  alternate_exercise_ids?: string[];
}

interface GeneratedWorkout {
  day_of_week: string;
  workout_name: string;
  muscle_groups: string[];
  exercises: GeneratedExercise[];
}

interface Props {
  workout: GeneratedWorkout;
  weekIndex: number;
  workoutIndex: number;
  exerciseNames: Record<string, string>;
  exerciseInstructions: Record<string, string>;
  isEditing: boolean;
  onUpdateWorkout: (updated: GeneratedWorkout) => void;
  onOpenExerciseSearch: (mode: "swap" | "add", exerciseIndex?: number) => void;
  id: string; // for outer sortable
}

export default function EditableWorkoutCard({
  workout,
  exerciseNames,
  exerciseInstructions,
  isEditing,
  onUpdateWorkout,
  onOpenExerciseSearch,
  id,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Outer sortable (day reordering)
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

  // Exercise IDs for inner sortable context
  const exerciseIds = workout.exercises.map(
    (ex, i) => `${id}-ex-${i}-${ex.exercise_id}`
  );

  function handleExerciseDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = exerciseIds.indexOf(active.id as string);
    const newIndex = exerciseIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    onUpdateWorkout({
      ...workout,
      exercises: arrayMove(workout.exercises, oldIndex, newIndex),
    });
  }

  function handleUpdateExercise(index: number, updated: GeneratedExercise) {
    const newExercises = [...workout.exercises];
    newExercises[index] = updated;
    onUpdateWorkout({ ...workout, exercises: newExercises });
  }

  function handleRemoveExercise(index: number) {
    onUpdateWorkout({
      ...workout,
      exercises: workout.exercises.filter((_, i) => i !== index),
    });
  }

  const cardContent = (
    <>
      <div className="mb-2 flex items-baseline justify-between">
        {isEditing && (
          <button
            type="button"
            className="mr-2 shrink-0 cursor-grab touch-none text-primary/30 hover:text-primary/60 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            &#x2807;
          </button>
        )}
        <h3 className="font-heading text-base font-semibold text-primary flex-1">
          {workout.workout_name}
        </h3>
        <span className="text-xs text-primary/40">{workout.day_of_week}</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {workout.muscle_groups.map((mg) => (
          <span
            key={mg}
            className="rounded-full bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary/60"
          >
            {mg}
          </span>
        ))}
      </div>

      {isEditing ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleExerciseDragEnd}
        >
          <SortableContext items={exerciseIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {workout.exercises.map((ex, ei) => (
                <EditableExerciseRowPreview
                  key={exerciseIds[ei]}
                  id={exerciseIds[ei]}
                  exercise={ex}
                  exerciseName={exerciseNames[ex.exercise_id] ?? ex.exercise_id}
                  exerciseInstruction={exerciseInstructions[ex.exercise_id]}
                  isEditing
                  onUpdate={(updated) => handleUpdateExercise(ei, updated)}
                  onSwapExercise={() => onOpenExerciseSearch("swap", ei)}
                  onRemove={() => handleRemoveExercise(ei)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex flex-col gap-2">
          {workout.exercises.map((ex, ei) => (
            <EditableExerciseRowPreview
              key={ei}
              id={`${id}-ex-${ei}-${ex.exercise_id}`}
              exercise={ex}
              exerciseName={exerciseNames[ex.exercise_id] ?? ex.exercise_id}
                  exerciseInstruction={exerciseInstructions[ex.exercise_id]}
              isEditing={false}
              onUpdate={() => {}}
              onSwapExercise={() => {}}
              onRemove={() => {}}
            />
          ))}
        </div>
      )}

      {isEditing && (
        <button
          type="button"
          onClick={() => onOpenExerciseSearch("add")}
          className="mt-3 w-full rounded-lg border border-dashed border-primary/20 py-2 text-xs font-medium text-primary/40 hover:border-primary/40 hover:text-primary/60 transition-colors"
        >
          + Add Exercise
        </button>
      )}
    </>
  );

  return (
    <div ref={setNodeRef} style={style}>
      <Card padding="md">{cardContent}</Card>
    </div>
  );
}
