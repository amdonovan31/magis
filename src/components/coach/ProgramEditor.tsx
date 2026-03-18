"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EditableExerciseRow from "@/components/coach/EditableExerciseRow";
import ExerciseSearchModal from "@/components/coach/ExerciseSearchModal";
import PublishBar from "@/components/coach/PublishBar";
import type { ExerciseOption } from "@/components/coach/ExerciseSearchModal";
import type { ProgramWithTemplates } from "@/types/app.types";
import DeleteProgramButton from "@/components/coach/DeleteProgramButton";
import {
  updateWorkoutTemplate,
  updateTemplateExercise,
  swapTemplateExercise,
  addTemplateExercise,
  removeTemplateExercise,
  reorderTemplateExercise,
} from "@/lib/actions/program.actions";

const DAYS_OF_WEEK = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
] as const;

interface Props {
  program: ProgramWithTemplates;
  exercises: ExerciseOption[];
  clientName?: string | null;
}

export default function ProgramEditor({ program: initialProgram, exercises, clientName }: Props) {
  const router = useRouter();
  const [program, setProgram] = useState(initialProgram);
  const [status, setStatus] = useState(initialProgram.status);
  const [activeWeek, setActiveWeek] = useState(1);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  // Exercise search modal state
  const [searchModal, setSearchModal] = useState<{
    open: boolean;
    mode: "swap" | "add";
    targetId?: string; // template_exercise_id for swap, workout_template_id for add
    excludeIds?: string[];
  }>({ open: false, mode: "add" });

  const debounceRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Get unique week numbers
  const weekNumbers = Array.from(new Set(program.workout_templates.map((t) => t.week_number))).sort((a, b) => a - b);

  // Templates for the active week
  const weekTemplates = program.workout_templates
    .filter((t) => t.week_number === activeWeek)
    .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0));

  // ── Debounced field update helper ──
  function debouncedAction(key: string, fn: () => Promise<unknown>, delayMs = 300) {
    const existing = debounceRefs.current.get(key);
    if (existing) clearTimeout(existing);
    debounceRefs.current.set(
      key,
      setTimeout(() => {
        setSaving(true);
        startTransition(async () => {
          await fn();
          setSaving(false);
        });
      }, delayMs)
    );
  }

  // ── Template updates ──
  const handleUpdateTemplate = useCallback(
    (templateId: string, data: { title?: string; notes?: string | null; scheduled_days?: number[] | null }) => {
      // Optimistic update
      setProgram((prev) => ({
        ...prev,
        workout_templates: prev.workout_templates.map((t) =>
          t.id === templateId ? { ...t, ...data } : t
        ),
      }));
      debouncedAction(`template-${templateId}`, () => updateWorkoutTemplate(templateId, data));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── Exercise field updates ──
  const handleUpdateExerciseField = useCallback(
    (exerciseId: string, data: Record<string, unknown>) => {
      // Optimistic update
      setProgram((prev) => ({
        ...prev,
        workout_templates: prev.workout_templates.map((t) => ({
          ...t,
          exercises: t.exercises.map((e) =>
            e.id === exerciseId ? { ...e, ...data } : e
          ),
        })),
      }));
      debouncedAction(`exercise-${exerciseId}`, () => updateTemplateExercise(exerciseId, data));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── Swap exercise ──
  function handleSwapClick(templateExerciseId: string) {
    const template = program.workout_templates.find((t) =>
      t.exercises.some((e) => e.id === templateExerciseId)
    );
    const excludeIds = template?.exercises.map((e) => e.exercise_id) ?? [];
    setSearchModal({ open: true, mode: "swap", targetId: templateExerciseId, excludeIds });
  }

  async function handleSwapSelect(exercise: ExerciseOption) {
    if (!searchModal.targetId) return;
    const targetId = searchModal.targetId;

    // Optimistic update
    setProgram((prev) => ({
      ...prev,
      workout_templates: prev.workout_templates.map((t) => ({
        ...t,
        exercises: t.exercises.map((e) =>
          e.id === targetId
            ? { ...e, exercise_id: exercise.id, exercise: { ...e.exercise, name: exercise.name, muscle_group: exercise.muscle_group } }
            : e
        ),
      })),
    }));

    startTransition(async () => {
      await swapTemplateExercise(targetId, exercise.id);
    });
  }

  // ── Add exercise ──
  function handleAddClick(workoutTemplateId: string) {
    const template = program.workout_templates.find((t) => t.id === workoutTemplateId);
    const excludeIds = template?.exercises.map((e) => e.exercise_id) ?? [];
    setSearchModal({ open: true, mode: "add", targetId: workoutTemplateId, excludeIds });
  }

  async function handleAddSelect(exercise: ExerciseOption) {
    if (!searchModal.targetId) return;
    const workoutTemplateId = searchModal.targetId;

    startTransition(async () => {
      const res = await addTemplateExercise(workoutTemplateId, exercise.id);
      if (!res.error) {
        // Refresh from server to get the new exercise with all relations
        router.refresh();
      }
    });
  }

  // ── Remove exercise ──
  function handleRemove(templateExerciseId: string) {
    // Optimistic update
    setProgram((prev) => ({
      ...prev,
      workout_templates: prev.workout_templates.map((t) => ({
        ...t,
        exercises: t.exercises
          .filter((e) => e.id !== templateExerciseId)
          .map((e, i) => ({ ...e, position: i + 1 })),
      })),
    }));

    startTransition(async () => {
      await removeTemplateExercise(templateExerciseId);
    });
  }

  // ── Reorder exercise ──
  function handleReorder(templateExerciseId: string, direction: "up" | "down") {
    // Optimistic update
    setProgram((prev) => ({
      ...prev,
      workout_templates: prev.workout_templates.map((t) => {
        const idx = t.exercises.findIndex((e) => e.id === templateExerciseId);
        if (idx === -1) return t;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= t.exercises.length) return t;

        const newExercises = [...t.exercises];
        const temp = newExercises[idx];
        newExercises[idx] = newExercises[swapIdx];
        newExercises[swapIdx] = temp;
        // Update positions
        return {
          ...t,
          exercises: newExercises.map((e, i) => ({ ...e, position: i + 1 })),
        };
      }),
    }));

    startTransition(async () => {
      await reorderTemplateExercise(templateExerciseId, direction);
    });
  }

  // ── Modal select handler ──
  function handleModalSelect(exercise: ExerciseOption) {
    if (searchModal.mode === "swap") {
      handleSwapSelect(exercise);
    } else {
      handleAddSelect(exercise);
    }
  }

  const isPublished = status === "published";

  return (
    <>
      <TopBar
        title="Edit Program"
        left={
          <button
            onClick={() => router.back()}
            className="text-sm text-primary/60 hover:text-primary"
          >
            &larr; Back
          </button>
        }
        right={
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-[10px] text-primary/40 animate-pulse">Saving...</span>
            )}
            <Badge variant={isPublished ? "success" : "warning"}>
              {isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
        }
      />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-32">
        {/* Program header */}
        <Card padding="lg">
          <input
            type="text"
            defaultValue={program.title}
            onChange={() => {
              // Title updates go directly to program table — but we don't have an action for that yet
            }}
            className="w-full bg-transparent font-heading text-xl font-semibold text-primary focus:outline-none"
            readOnly={isPublished}
          />
          {program.description && (
            <p className="mt-1 text-sm text-muted">{program.description}</p>
          )}
          <div className="mt-2 flex gap-4 text-xs text-primary/50">
            <span>{weekNumbers.length} weeks</span>
            <span>{program.workout_templates.length} workouts</span>
            <span>
              {program.workout_templates.reduce((sum, t) => sum + t.exercises.length, 0)} exercises
            </span>
          </div>
        </Card>

        {/* Week tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {weekNumbers.map((wn) => (
            <button
              key={wn}
              onClick={() => setActiveWeek(wn)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeWeek === wn
                  ? "bg-primary text-white"
                  : "bg-primary/10 text-primary"
              }`}
            >
              Week {wn}
            </button>
          ))}
        </div>

        {/* Workouts for active week */}
        {weekTemplates.map((template) => (
          <Card key={template.id} padding="md">
            {/* Workout header */}
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {isPublished ? (
                  <h3 className="font-heading text-base font-semibold text-primary">
                    {template.title}
                  </h3>
                ) : (
                  <input
                    type="text"
                    defaultValue={template.title}
                    onBlur={(e) => handleUpdateTemplate(template.id, { title: e.target.value })}
                    className="w-full bg-transparent font-heading text-base font-semibold text-primary focus:outline-none focus:border-b focus:border-primary/20"
                  />
                )}
                {/* Notes / focus */}
                {isPublished ? (
                  template.notes && (
                    <p className="mt-0.5 text-xs text-primary/40">{template.notes}</p>
                  )
                ) : (
                  <input
                    type="text"
                    defaultValue={template.notes ?? ""}
                    onBlur={(e) => handleUpdateTemplate(template.id, { notes: e.target.value || null })}
                    placeholder="Add notes..."
                    className="mt-0.5 w-full bg-transparent text-xs text-primary/40 placeholder:text-primary/20 focus:outline-none focus:text-primary/60"
                  />
                )}
              </div>
              {/* Day of week selector */}
              <div className="flex gap-0.5 shrink-0">
                {DAYS_OF_WEEK.map((day) => {
                  const isActive = template.scheduled_days?.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      disabled={isPublished}
                      onClick={() => {
                        const current = template.scheduled_days ?? [];
                        const newDays = isActive
                          ? current.filter((d) => d !== day.value)
                          : [...current, day.value].sort();
                        handleUpdateTemplate(template.id, { scheduled_days: newDays.length > 0 ? newDays : null });
                      }}
                      className={`h-6 w-6 rounded text-[9px] font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-white"
                          : "bg-primary/5 text-primary/30 hover:bg-primary/10"
                      } disabled:cursor-default`}
                    >
                      {day.label[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exercises */}
            <div className="flex flex-col gap-1.5">
              {template.exercises
                .sort((a, b) => a.position - b.position)
                .map((ex, i) =>
                  isPublished ? (
                    // Read-only view when published
                    <div
                      key={ex.id}
                      className="flex items-center justify-between rounded-lg bg-bg/50 px-3 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">
                          {ex.exercise.name}
                        </p>
                      </div>
                      <div className="ml-3 shrink-0 text-right text-xs text-primary/60">
                        <span>{ex.prescribed_sets} &times; {ex.prescribed_reps}</span>
                        <span className="ml-2 text-primary/30">{ex.rest_seconds}s</span>
                      </div>
                    </div>
                  ) : (
                    <EditableExerciseRow
                      key={ex.id}
                      exercise={ex}
                      isFirst={i === 0}
                      isLast={i === template.exercises.length - 1}
                      onUpdateField={handleUpdateExerciseField}
                      onSwap={handleSwapClick}
                      onRemove={handleRemove}
                      onReorder={handleReorder}
                    />
                  )
                )}
            </div>

            {/* Add exercise button */}
            {!isPublished && (
              <button
                type="button"
                onClick={() => handleAddClick(template.id)}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-primary/15 py-2 text-xs font-medium text-primary/40 transition-colors hover:border-primary/30 hover:text-primary/60"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Exercise
              </button>
            )}
          </Card>
        ))}
      </div>

      {/* Delete program */}
      <div className="px-4 pb-4">
        <DeleteProgramButton
          programId={program.id}
          programName={program.title}
          clientName={clientName}
          status={status}
        />
      </div>

      {/* Publish bar */}
      <PublishBar
        programId={program.id}
        status={status}
        onStatusChange={setStatus}
      />

      {/* Exercise search modal */}
      <ExerciseSearchModal
        isOpen={searchModal.open}
        onClose={() => setSearchModal({ ...searchModal, open: false })}
        onSelect={handleModalSelect}
        exercises={exercises}
        excludeIds={searchModal.excludeIds}
        title={searchModal.mode === "swap" ? "Swap Exercise" : "Add Exercise"}
      />
    </>
  );
}
