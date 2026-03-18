"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "@dnd-kit/sortable";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import EditableWorkoutCard from "./EditableWorkoutCard";
import ExerciseSearchModal, {
  type ExerciseOption,
} from "./ExerciseSearchModal";
import { saveGeneratedProgram, discardPendingProgram } from "@/lib/actions/program.actions";

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

interface GeneratedWeek {
  week_number: number;
  workouts: GeneratedWorkout[];
}

interface GeneratedProgram {
  program_name: string;
  program_description: string;
  weeks: GeneratedWeek[];
}

interface Props {
  clientId: string;
  clientName: string;
  programId: string;
  initialProgram: unknown;
  initialExerciseNames: Record<string, string>;
  exercises: ExerciseOption[];
}

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function ProgramReview({
  clientId,
  clientName,
  programId,
  initialProgram,
  initialExerciseNames,
  exercises,
}: Props) {
  const router = useRouter();
  const [program, setProgram] = useState<GeneratedProgram>(
    initialProgram as GeneratedProgram
  );
  const [exerciseNames, setExerciseNames] = useState<Record<string, string>>(
    initialExerciseNames
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedWeek, setExpandedWeek] = useState<number>(1);
  const [isEditing, setIsEditing] = useState(false);
  const [regenModalOpen, setRegenModalOpen] = useState(false);
  const [regenFeedback, setRegenFeedback] = useState("");
  const [searchModal, setSearchModal] = useState<{
    open: boolean;
    mode: "swap" | "add";
    weekIndex: number;
    workoutIndex: number;
    exerciseIndex?: number;
  }>({ open: false, mode: "add", weekIndex: 0, workoutIndex: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Helper to update a specific workout in a specific week
  function updateWorkoutInWeek(
    weekIdx: number,
    workoutIdx: number,
    updater: (w: GeneratedWorkout) => GeneratedWorkout
  ) {
    setProgram((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w, wi) =>
        wi !== weekIdx
          ? w
          : {
              ...w,
              workouts: w.workouts.map((wo, woi) =>
                woi !== workoutIdx ? wo : updater(wo)
              ),
            }
      ),
    }));
  }

  // Day reordering — reassign day_of_week sequentially
  function handleDayDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const weekIdx = program.weeks.findIndex(
      (w) => w.week_number === expandedWeek
    );
    if (weekIdx === -1) return;

    const week = program.weeks[weekIdx];
    const workoutIds = week.workouts.map((_, i) => `day-${weekIdx}-${i}`);
    const oldIndex = workoutIds.indexOf(active.id as string);
    const newIndex = workoutIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(week.workouts, oldIndex, newIndex).map(
      (wo, i) => ({
        ...wo,
        day_of_week: WEEKDAYS[i] ?? wo.day_of_week,
      })
    );

    setProgram((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w, wi) =>
        wi !== weekIdx ? w : { ...w, workouts: reordered }
      ),
    }));
  }

  function handleExerciseSelect(exercise: ExerciseOption) {
    const { weekIndex, workoutIndex, exerciseIndex, mode } = searchModal;

    // Update exercise names map
    setExerciseNames((prev) => ({ ...prev, [exercise.id]: exercise.name }));

    if (mode === "swap" && exerciseIndex != null) {
      updateWorkoutInWeek(weekIndex, workoutIndex, (wo) => ({
        ...wo,
        exercises: wo.exercises.map((ex, i) =>
          i !== exerciseIndex
            ? ex
            : { ...ex, exercise_id: exercise.id }
        ),
      }));
    } else {
      // Add
      updateWorkoutInWeek(weekIndex, workoutIndex, (wo) => ({
        ...wo,
        exercises: [
          ...wo.exercises,
          {
            exercise_id: exercise.id,
            sets: 3,
            reps: "10",
            rest_seconds: 90,
          },
        ],
      }));
    }
  }

  async function handleApprove() {
    setSaving(true);
    setError("");

    try {
      const res = await saveGeneratedProgram({ clientId, program, pendingProgramId: programId });
      if (res?.error) {
        setError(res.error);
        setSaving(false);
        return;
      }

      if (res?.programId) {
        router.push(`/programs/${res.programId}/edit`);
      } else {
        router.push(`/clients/${clientId}`);
      }
    } catch {
      setError("Failed to save program. Please try again.");
      setSaving(false);
    }
  }

  function handleSubmitRegenerate(withFeedback: boolean) {
    const feedback = withFeedback ? regenFeedback.trim() : undefined;
    setRegenModalOpen(false);

    const params = new URLSearchParams();
    if (feedback) params.set("regenFeedback", feedback);
    params.set("regenProgramId", programId);

    router.push(`/clients/${clientId}/generate/loading?${params.toString()}`);
  }

  async function handleDiscard() {
    await discardPendingProgram(programId);
    router.push(`/clients/${clientId}`);
  }

  const totalWorkouts = program.weeks.reduce(
    (sum, w) => sum + w.workouts.length,
    0
  );
  const totalExercises = program.weeks.reduce(
    (sum, w) =>
      sum + w.workouts.reduce((ws, wo) => ws + wo.exercises.length, 0),
    0
  );

  const currentWeekIdx = program.weeks.findIndex(
    (w) => w.week_number === expandedWeek
  );
  const currentWeek =
    currentWeekIdx !== -1 ? program.weeks[currentWeekIdx] : null;
  const dayIds =
    currentWeek?.workouts.map((_, i) => `day-${currentWeekIdx}-${i}`) ?? [];

  // Build instructions lookup from exercises prop
  const exerciseInstructions: Record<string, string> = {};
  for (const e of exercises) {
    if (e.instructions) exerciseInstructions[e.id] = e.instructions;
  }

  // Exclude IDs for exercise search (exercises already in the target workout)
  const searchTargetWorkout =
    currentWeek?.workouts[searchModal.workoutIndex];
  const searchExcludeIds =
    searchTargetWorkout?.exercises.map((e) => e.exercise_id) ?? [];

  return (
    <>
      <TopBar
        title="Review Program"
        left={
          <button
            onClick={handleDiscard}
            className="text-sm text-primary/60 hover:text-primary"
          >
            &larr; Discard
          </button>
        }
      />
      <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
        {/* Program header */}
        <Card padding="lg">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-xl font-semibold text-primary">
                {program.program_name}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {program.program_description}
              </p>
              <div className="mt-3 flex gap-4 text-xs text-primary/50">
                <span>{program.weeks.length} weeks</span>
                <span>{totalWorkouts} workouts</span>
                <span>{totalExercises} exercises</span>
              </div>
              <p className="mt-1 text-xs text-primary/50">
                For {clientName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`shrink-0 ml-3 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isEditing
                  ? "bg-accent text-white"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              {isEditing ? "Done Editing" : "Edit Program"}
            </button>
          </div>
        </Card>

        {/* Week tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {program.weeks.map((week) => (
            <button
              key={week.week_number}
              onClick={() => setExpandedWeek(week.week_number)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                expandedWeek === week.week_number
                  ? "bg-primary text-white"
                  : "bg-primary/10 text-primary"
              }`}
            >
              Week {week.week_number}
            </button>
          ))}
        </div>

        {/* Expanded week */}
        {currentWeek && (
          isEditing ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDayDragEnd}
            >
              <SortableContext
                items={dayIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-3">
                  {currentWeek.workouts.map((workout, wi) => (
                    <EditableWorkoutCard
                      key={dayIds[wi]}
                      id={dayIds[wi]}
                      workout={workout}
                      weekIndex={currentWeekIdx}
                      workoutIndex={wi}
                      exerciseNames={exerciseNames}
                      exerciseInstructions={exerciseInstructions}
                      isEditing
                      onUpdateWorkout={(updated) =>
                        updateWorkoutInWeek(
                          currentWeekIdx,
                          wi,
                          () => updated
                        )
                      }
                      onOpenExerciseSearch={(mode, exerciseIndex) =>
                        setSearchModal({
                          open: true,
                          mode,
                          weekIndex: currentWeekIdx,
                          workoutIndex: wi,
                          exerciseIndex,
                        })
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex flex-col gap-3">
              {currentWeek.workouts.map((workout, wi) => (
                <EditableWorkoutCard
                  key={wi}
                  id={`day-${currentWeekIdx}-${wi}`}
                  workout={workout}
                  weekIndex={currentWeekIdx}
                  workoutIndex={wi}
                  exerciseNames={exerciseNames}
                      exerciseInstructions={exerciseInstructions}
                  isEditing={false}
                  onUpdateWorkout={() => {}}
                  onOpenExerciseSearch={() => {}}
                />
              ))}
            </div>
          )
        )}

        {/* Error */}
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {!isEditing && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setRegenModalOpen(true)}
              disabled={saving}
            >
              Regenerate
            </Button>
          )}
          <Button
            fullWidth
            size="lg"
            onClick={handleApprove}
            disabled={saving || isEditing}
          >
            {saving ? "Saving..." : "Approve & Save"}
          </Button>
        </div>
      </div>

      {/* Regeneration feedback modal */}
      <Modal
        isOpen={regenModalOpen}
        onClose={() => setRegenModalOpen(false)}
        title="Regenerate Program"
      >
        <p className="text-sm text-muted mb-3">
          What would you like changed? The AI will see the current program and
          your feedback.
        </p>
        <textarea
          value={regenFeedback}
          onChange={(e) => setRegenFeedback(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-primary/10 bg-primary/5 px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="e.g., Make the program more leg-focused, reduce isolation work on day 3..."
        />
        <div className="flex gap-3 mt-4">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => handleSubmitRegenerate(false)}
          >
            Start Fresh
          </Button>
          <Button
            fullWidth
            onClick={() => handleSubmitRegenerate(true)}
            disabled={!regenFeedback.trim()}
          >
            Regenerate
          </Button>
        </div>
      </Modal>

      {/* Exercise search modal */}
      <ExerciseSearchModal
        isOpen={searchModal.open}
        onClose={() =>
          setSearchModal((prev) => ({ ...prev, open: false }))
        }
        onSelect={handleExerciseSelect}
        exercises={exercises}
        excludeIds={searchExcludeIds}
        title={
          searchModal.mode === "swap" ? "Swap Exercise" : "Add Exercise"
        }
      />
    </>
  );
}
