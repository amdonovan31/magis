"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
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
  applyProgramEdits,
} from "@/lib/actions/program.actions";
import type { ProgramEditChanges } from "@/lib/actions/program.actions";

const DAYS_OF_WEEK = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
] as const;

interface ScheduledWorkoutRow {
  id: string;
  workout_template_id: string;
  scheduled_date: string;
  status: string;
}

interface Props {
  program: ProgramWithTemplates;
  exercises: ExerciseOption[];
  clientName?: string | null;
  scheduledWorkouts?: ScheduledWorkoutRow[];
}

function emptyChanges(): ProgramEditChanges {
  return {
    exerciseUpdates: [],
    exerciseSwaps: [],
    exerciseAdds: [],
    exerciseRemoves: [],
    templateUpdates: [],
    dateChanges: [],
  };
}

export default function ProgramEditor({
  program: initialProgram,
  exercises,
  clientName,
  scheduledWorkouts = [],
}: Props) {
  const router = useRouter();
  const [program, setProgram] = useState(initialProgram);
  const [status, setStatus] = useState(initialProgram.status);
  const [activeWeek, setActiveWeek] = useState(1);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  // Published edit mode state
  const isPublished = status === "published";
  const [editMode, setEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<ProgramEditChanges>(emptyChanges);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [localDates, setLocalDates] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const sw of scheduledWorkouts) {
      // Use first upcoming date per template
      if (!map[sw.workout_template_id]) {
        map[sw.workout_template_id] = sw.scheduled_date;
      }
    }
    return map;
  });

  // Regenerate modal state (draft programs with a client only)
  const [regenModalOpen, setRegenModalOpen] = useState(false);
  const [regenFeedback, setRegenFeedback] = useState("");

  // Exercise search modal state
  const [searchModal, setSearchModal] = useState<{
    open: boolean;
    mode: "swap" | "add";
    targetId?: string;
    excludeIds?: string[];
  }>({ open: false, mode: "add" });

  const debounceRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const weekNumbers = Array.from(new Set(program.workout_templates.map((t) => t.week_number))).sort((a, b) => a - b);
  const weekTemplates = program.workout_templates
    .filter((t) => t.week_number === activeWeek)
    .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0));

  // ═══════════════════════════════════════════
  // DRAFT MODE: debounced auto-save (unchanged)
  // ═══════════════════════════════════════════

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

  // ═══════════════════════════════════════════
  // SHARED HANDLERS (route to draft or buffered)
  // ═══════════════════════════════════════════

  const handleUpdateTemplate = useCallback(
    (templateId: string, data: { title?: string; notes?: string | null; scheduled_days?: number[] | null }) => {
      setProgram((prev) => ({
        ...prev,
        workout_templates: prev.workout_templates.map((t) =>
          t.id === templateId ? { ...t, ...data } : t
        ),
      }));

      if (isPublished && editMode) {
        // Buffer the change
        setPendingChanges((prev) => {
          const existing = prev.templateUpdates.find((u) => u.id === templateId);
          if (existing) {
            return {
              ...prev,
              templateUpdates: prev.templateUpdates.map((u) =>
                u.id === templateId ? { ...u, ...data } : u
              ),
            };
          }
          return {
            ...prev,
            templateUpdates: [...prev.templateUpdates, { id: templateId, ...data } as ProgramEditChanges["templateUpdates"][0]],
          };
        });
      } else {
        debouncedAction(`template-${templateId}`, () => updateWorkoutTemplate(templateId, data));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPublished, editMode]
  );

  const handleUpdateExerciseField = useCallback(
    (exerciseId: string, data: Record<string, unknown>) => {
      setProgram((prev) => ({
        ...prev,
        workout_templates: prev.workout_templates.map((t) => ({
          ...t,
          exercises: t.exercises.map((e) =>
            e.id === exerciseId ? { ...e, ...data } : e
          ),
        })),
      }));

      if (isPublished && editMode) {
        setPendingChanges((prev) => {
          const existing = prev.exerciseUpdates.find((u) => u.id === exerciseId);
          if (existing) {
            return {
              ...prev,
              exerciseUpdates: prev.exerciseUpdates.map((u) =>
                u.id === exerciseId ? { ...u, ...data } as ProgramEditChanges["exerciseUpdates"][0] : u
              ),
            };
          }
          return {
            ...prev,
            exerciseUpdates: [...prev.exerciseUpdates, { id: exerciseId, ...data } as ProgramEditChanges["exerciseUpdates"][0]],
          };
        });
      } else {
        debouncedAction(`exercise-${exerciseId}`, () => updateTemplateExercise(exerciseId, data));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPublished, editMode]
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

    if (isPublished && editMode) {
      setPendingChanges((prev) => ({
        ...prev,
        exerciseSwaps: [
          ...prev.exerciseSwaps.filter((s) => s.id !== targetId),
          { id: targetId, new_exercise_id: exercise.id },
        ],
      }));
    } else {
      startTransition(async () => {
        await swapTemplateExercise(targetId, exercise.id);
      });
    }
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

    if (isPublished && editMode) {
      // Add to local preview
      const template = program.workout_templates.find((t) => t.id === workoutTemplateId);
      const maxPos = template?.exercises.reduce((max, e) => Math.max(max, e.position), 0) ?? 0;
      const tempId = `pending-${Date.now()}`;

      setProgram((prev) => ({
        ...prev,
        workout_templates: prev.workout_templates.map((t) =>
          t.id === workoutTemplateId
            ? {
                ...t,
                exercises: [
                  ...t.exercises,
                  {
                    id: tempId,
                    workout_template_id: workoutTemplateId,
                    exercise_id: exercise.id,
                    exercise: { name: exercise.name, muscle_group: exercise.muscle_group, id: exercise.id },
                    position: maxPos + 1,
                    prescribed_sets: 3,
                    prescribed_reps: "8-12",
                    prescribed_weight: null,
                    rest_seconds: 90,
                    notes: null,
                    alternate_exercise_ids: null,
                  } as unknown as ProgramWithTemplates["workout_templates"][0]["exercises"][0],
                ],
              }
            : t
        ),
      }));

      setPendingChanges((prev) => ({
        ...prev,
        exerciseAdds: [...prev.exerciseAdds, { workout_template_id: workoutTemplateId, exercise_id: exercise.id }],
      }));
    } else {
      startTransition(async () => {
        const res = await addTemplateExercise(workoutTemplateId, exercise.id);
        if (!res.error) router.refresh();
      });
    }
  }

  // ── Remove exercise ──
  function handleRemove(templateExerciseId: string) {
    setProgram((prev) => ({
      ...prev,
      workout_templates: prev.workout_templates.map((t) => ({
        ...t,
        exercises: t.exercises
          .filter((e) => e.id !== templateExerciseId)
          .map((e, i) => ({ ...e, position: i + 1 })),
      })),
    }));

    if (isPublished && editMode) {
      setPendingChanges((prev) => ({
        ...prev,
        exerciseRemoves: [...prev.exerciseRemoves, templateExerciseId],
      }));
    } else {
      startTransition(async () => {
        await removeTemplateExercise(templateExerciseId);
      });
    }
  }

  // ── Reorder exercise ──
  function handleReorder(templateExerciseId: string, direction: "up" | "down") {
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
        return { ...t, exercises: newExercises.map((e, i) => ({ ...e, position: i + 1 })) };
      }),
    }));

    if (!(isPublished && editMode)) {
      startTransition(async () => {
        await reorderTemplateExercise(templateExerciseId, direction);
      });
    }
    // In buffered mode, reorder is reflected in the local preview only.
    // Full position sync happens on save via exercise updates.
  }

  // ── Modal select handler ──
  function handleModalSelect(exercise: ExerciseOption) {
    if (searchModal.mode === "swap") {
      handleSwapSelect(exercise);
    } else {
      handleAddSelect(exercise);
    }
  }

  // ── Date change (published edit mode only) ──
  function handleDateChange(scheduledWorkoutId: string, templateId: string, newDate: string) {
    setLocalDates((prev) => ({ ...prev, [templateId]: newDate }));
    setPendingChanges((prev) => ({
      ...prev,
      dateChanges: [
        ...prev.dateChanges.filter((d) => d.scheduled_workout_id !== scheduledWorkoutId),
        { scheduled_workout_id: scheduledWorkoutId, new_date: newDate },
      ],
    }));
  }

  // ── Save published edits ──
  function handlePreSave() {
    setSaveError(null);

    // Intra-edit date conflict check
    const dates = pendingChanges.dateChanges.map((d) => d.new_date);
    const dups = dates.filter((d, i) => dates.indexOf(d) !== i);
    if (dups.length > 0) {
      setSaveError(`Date conflict: multiple workouts scheduled for ${dups[0]}`);
      return;
    }

    setShowConfirmDialog(true);
  }

  async function handleConfirmSave() {
    setShowConfirmDialog(false);
    setSaving(true);
    setSaveError(null);

    const result = await applyProgramEdits(program.id, pendingChanges);

    if (result.error) {
      setSaveError(result.error);
      setSaving(false);
      return;
    }

    setPendingChanges(emptyChanges());
    setEditMode(false);
    setSaving(false);
    router.refresh();
  }

  function handleCancelEdit() {
    setProgram(initialProgram);
    setPendingChanges(emptyChanges());
    setSaveError(null);
    setEditMode(false);
    // Reset local dates
    const map: Record<string, string> = {};
    for (const sw of scheduledWorkouts) {
      if (!map[sw.workout_template_id]) map[sw.workout_template_id] = sw.scheduled_date;
    }
    setLocalDates(map);
  }

  const inEditMode = isPublished && editMode;

  return (
    <>
      <TopBar
        title="Edit Program"
        left={
          <button
            onClick={() => {
              if (inEditMode) {
                handleCancelEdit();
              } else {
                router.back();
              }
            }}
            className="text-sm text-primary/60 hover:text-primary"
          >
            {inEditMode ? "Cancel" : "← Back"}
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
        {/* Published edit mode banner */}
        {inEditMode && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-xs font-medium text-amber-800">
              Editing a published program. Changes will apply to all upcoming sessions when saved.
            </p>
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-xs font-medium text-red-800">{saveError}</p>
          </div>
        )}

        {/* Enter edit mode button for published programs */}
        {isPublished && !editMode && (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setEditMode(true)}
          >
            Edit Program
          </Button>
        )}

        {/* Program header */}
        <Card padding="lg">
          <input
            type="text"
            defaultValue={program.title}
            onChange={() => {}}
            className="w-full bg-transparent font-heading text-xl font-semibold text-primary focus:outline-none"
            readOnly={isPublished && !editMode}
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
        {weekTemplates.map((template) => {
          const canEdit = !isPublished || editMode;
          const swForTemplate = scheduledWorkouts.find((sw) => sw.workout_template_id === template.id);

          return (
            <Card key={template.id} padding="md">
              {/* Workout header */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {canEdit ? (
                    <input
                      type="text"
                      defaultValue={template.title}
                      onBlur={(e) => handleUpdateTemplate(template.id, { title: e.target.value })}
                      className="w-full bg-transparent font-heading text-base font-semibold text-primary focus:outline-none focus:border-b focus:border-primary/20"
                    />
                  ) : (
                    <h3 className="font-heading text-base font-semibold text-primary">
                      {template.title}
                    </h3>
                  )}
                  {canEdit ? (
                    <input
                      type="text"
                      defaultValue={template.notes ?? ""}
                      onBlur={(e) => handleUpdateTemplate(template.id, { notes: e.target.value || null })}
                      placeholder="Add notes..."
                      className="mt-0.5 w-full bg-transparent text-xs text-primary/40 placeholder:text-primary/20 focus:outline-none focus:text-primary/60"
                    />
                  ) : (
                    template.notes && (
                      <p className="mt-0.5 text-xs text-primary/40">{template.notes}</p>
                    )
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
                        disabled={!canEdit}
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

              {/* Scheduled date (edit mode only, published programs) */}
              {inEditMode && swForTemplate && (
                <div className="mb-3">
                  <Input
                    type="date"
                    label="Next scheduled date"
                    value={localDates[template.id] ?? swForTemplate.scheduled_date}
                    onChange={(e) => handleDateChange(swForTemplate.id, template.id, e.target.value)}
                  />
                </div>
              )}

              {/* Exercises */}
              <div className="flex flex-col gap-1.5">
                {template.exercises
                  .sort((a, b) => a.position - b.position)
                  .map((ex, i) =>
                    canEdit ? (
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
                    ) : (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between rounded-lg bg-bg/50 px-3 py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary">
                            {ex.exercise.name}
                          </p>
                        </div>
                        <div className="ml-3 shrink-0 text-right text-xs text-primary/60">
                          <span>{ex.prescribed_sets} &times; {ex.prescribed_reps}</span>
                          <span className="ml-2 text-primary/30">{ex.rest_seconds}s</span>
                        </div>
                      </div>
                    )
                  )}
              </div>

              {/* Add exercise button */}
              {canEdit && (
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
          );
        })}
      </div>

      {/* Program actions (not in edit mode) */}
      {!inEditMode && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {/* Regenerate — only for draft programs assigned to a client */}
          {status === "draft" && program.client_id && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setRegenFeedback("");
                setRegenModalOpen(true);
              }}
            >
              Regenerate with AI
            </Button>
          )}
          <DeleteProgramButton
            programId={program.id}
            programName={program.title}
            clientName={clientName}
            status={status}
          />
        </div>
      )}

      {/* Bottom bar: Publish (draft) or Save/Cancel (published edit mode) */}
      {inEditMode ? (
        <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 bg-surface p-4 pb-safe border-t border-primary/10">
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button fullWidth loading={saving} onClick={handlePreSave}>
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <PublishBar
          programId={program.id}
          status={status}
          onStatusChange={setStatus}
        />
      )}

      {/* Confirmation dialog */}
      <Modal
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title="Save Program Changes"
      >
        <p className="text-sm text-primary/70 mb-4">
          Save changes to <strong>{program.title}</strong>?
          {clientName && (
            <> This will update all upcoming sessions for <strong>{clientName}</strong>.</>
          )}
          {" "}Sessions already started or completed will not be affected.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setShowConfirmDialog(false)}>
            Cancel
          </Button>
          <Button fullWidth loading={saving} onClick={handleConfirmSave}>
            Confirm
          </Button>
        </div>
      </Modal>

      {/* Exercise search modal */}
      <ExerciseSearchModal
        isOpen={searchModal.open}
        onClose={() => setSearchModal({ ...searchModal, open: false })}
        onSelect={handleModalSelect}
        exercises={exercises}
        excludeIds={searchModal.excludeIds}
        title={searchModal.mode === "swap" ? "Swap Exercise" : "Add Exercise"}
      />

      {/* Regeneration feedback modal */}
      <Modal
        isOpen={regenModalOpen}
        onClose={() => setRegenModalOpen(false)}
        title="Regenerate Program"
      >
        <p className="text-sm text-primary/70 mb-3">
          The AI will generate a new program based on the original guidelines.
          Optionally describe what you&apos;d like changed:
        </p>
        <textarea
          value={regenFeedback}
          onChange={(e) => setRegenFeedback(e.target.value)}
          placeholder="e.g. More emphasis on compound lifts, reduce arm volume..."
          rows={3}
          className="w-full rounded-lg border border-primary/15 bg-bg px-3 py-2 text-sm text-primary placeholder:text-primary/30 focus:border-primary/40 focus:outline-none"
        />
        <div className="mt-4 flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setRegenModalOpen(false)}>
            Cancel
          </Button>
          <Button
            fullWidth
            onClick={() => {
              const params = new URLSearchParams();
              params.set("regenProgramId", program.id);
              if (regenFeedback.trim()) params.set("regenFeedback", regenFeedback.trim());
              router.push(`/clients/${program.client_id}/generate/loading?${params.toString()}`);
            }}
          >
            Regenerate
          </Button>
        </div>
      </Modal>
    </>
  );
}
