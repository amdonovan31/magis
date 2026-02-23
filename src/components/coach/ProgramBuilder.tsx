"use client";

import { useState } from "react";
import { createProgram } from "@/lib/actions/program.actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ExerciseCard from "@/components/exercises/ExerciseCard";
import { DAYS_OF_WEEK } from "@/types/app.types";
import { cn } from "@/lib/utils/cn";
import type {
  ProgramBuilderState,
  ProgramBuilderDay,
  ProgramBuilderExercise,
  Exercise,
  Profile,
} from "@/types/app.types";

interface ProgramBuilderProps {
  clients: Pick<Profile, "id" | "full_name">[];
  exercises: Exercise[];
}

const defaultDay = (): ProgramBuilderDay => ({
  title: "",
  dayNumber: 1,
  notes: "",
  scheduledDays: [],
  exercises: [],
});

const defaultState: ProgramBuilderState = {
  details: { title: "", description: "", clientId: "", startsOn: "" },
  days: [defaultDay()],
};

export default function ProgramBuilder({ clients, exercises }: ProgramBuilderProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [state, setState] = useState<ProgramBuilderState>(defaultState);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentDay = state.days[activeDayIdx];

  // Step 1: Program details
  const StepDetails = () => (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-primary">Program Details</h2>
      <Input
        label="Program Title"
        value={state.details.title}
        onChange={(e) =>
          setState((s) => ({
            ...s,
            details: { ...s.details, title: e.target.value },
          }))
        }
        placeholder="e.g. 3-Day Strength Block"
        required
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-primary">Description</label>
        <textarea
          value={state.details.description}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              details: { ...s.details, description: e.target.value },
            }))
          }
          placeholder="Optional program description..."
          rows={3}
          className="rounded-xl border border-primary/20 bg-white px-4 py-3 text-primary placeholder:text-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-primary">Assign to Client</label>
        <select
          value={state.details.clientId}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              details: { ...s.details, clientId: e.target.value },
            }))
          }
          className="h-12 rounded-xl border border-primary/20 bg-white px-4 text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">No client yet</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>
      </div>
      <Input
        label="Start Date"
        type="date"
        value={state.details.startsOn}
        onChange={(e) =>
          setState((s) => ({
            ...s,
            details: { ...s.details, startsOn: e.target.value },
          }))
        }
      />
    </div>
  );

  // Step 2: Days + Schedule
  const StepDays = () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Workout Days</h2>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const newDay = { ...defaultDay(), dayNumber: state.days.length + 1 };
            setState((s) => ({ ...s, days: [...s.days, newDay] }));
            setActiveDayIdx(state.days.length);
          }}
        >
          + Add Day
        </Button>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {state.days.map((day, i) => (
          <button
            key={i}
            onClick={() => setActiveDayIdx(i)}
            className={cn(
              "flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              activeDayIdx === i
                ? "bg-primary text-white"
                : "bg-primary/10 text-primary"
            )}
          >
            Day {i + 1}
          </button>
        ))}
      </div>

      {/* Current day editor */}
      <Input
        label="Day Title"
        value={currentDay.title}
        onChange={(e) =>
          setState((s) => ({
            ...s,
            days: s.days.map((d, i) =>
              i === activeDayIdx ? { ...d, title: e.target.value } : d
            ),
          }))
        }
        placeholder="e.g. Upper Body A"
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-primary">Schedule (days of week)</label>
        <div className="flex gap-2">
          {DAYS_OF_WEEK.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                setState((s) => ({
                  ...s,
                  days: s.days.map((d, i) => {
                    if (i !== activeDayIdx) return d;
                    const days = d.scheduledDays.includes(value)
                      ? d.scheduledDays.filter((v) => v !== value)
                      : [...d.scheduledDays, value];
                    return { ...d, scheduledDays: days };
                  }),
                }));
              }}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-colors",
                currentDay.scheduledDays.includes(value)
                  ? "bg-primary text-white"
                  : "bg-primary/10 text-primary"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {state.days.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:bg-red-50"
          onClick={() => {
            setState((s) => ({
              ...s,
              days: s.days.filter((_, i) => i !== activeDayIdx),
            }));
            setActiveDayIdx(Math.max(0, activeDayIdx - 1));
          }}
        >
          Remove Day {activeDayIdx + 1}
        </Button>
      )}
    </div>
  );

  // Step 3: Exercises per day
  const StepExercises = () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Exercises</h2>
        <div className="flex gap-2 overflow-x-auto">
          {state.days.map((day, i) => (
            <button
              key={i}
              onClick={() => setActiveDayIdx(i)}
              className={cn(
                "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                activeDayIdx === i
                  ? "bg-primary text-white"
                  : "bg-primary/10 text-primary"
              )}
            >
              {day.title || `Day ${i + 1}`}
            </button>
          ))}
        </div>
      </div>

      {/* Selected exercises for this day */}
      {currentDay.exercises.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-primary/60 uppercase tracking-wide">
            Selected ({currentDay.exercises.length})
          </p>
          {currentDay.exercises.map((ex, ei) => (
            <ExerciseSetEditor
              key={ex.exerciseId}
              exercise={exercises.find((e) => e.id === ex.exerciseId)!}
              config={ex}
              onUpdate={(updated) => {
                setState((s) => ({
                  ...s,
                  days: s.days.map((d, i) =>
                    i === activeDayIdx
                      ? {
                          ...d,
                          exercises: d.exercises.map((e, j) =>
                            j === ei ? updated : e
                          ),
                        }
                      : d
                  ),
                }));
              }}
              onRemove={() => {
                setState((s) => ({
                  ...s,
                  days: s.days.map((d, i) =>
                    i === activeDayIdx
                      ? { ...d, exercises: d.exercises.filter((_, j) => j !== ei) }
                      : d
                  ),
                }));
              }}
            />
          ))}
        </div>
      )}

      {/* Exercise picker */}
      <p className="text-xs font-medium text-primary/60 uppercase tracking-wide">
        Add Exercise
      </p>
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
        {exercises
          .filter(
            (ex) => !currentDay.exercises.some((e) => e.exerciseId === ex.id)
          )
          .map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              compact
              onSelect={() => {
                const newEx: ProgramBuilderExercise = {
                  exerciseId: ex.id,
                  exerciseName: ex.name,
                  position: currentDay.exercises.length,
                  prescribedSets: 3,
                  prescribedReps: "8-12",
                  prescribedWeight: "",
                  restSeconds: 90,
                  notes: "",
                };
                setState((s) => ({
                  ...s,
                  days: s.days.map((d, i) =>
                    i === activeDayIdx
                      ? { ...d, exercises: [...d.exercises, newEx] }
                      : d
                  ),
                }));
              }}
            />
          ))}
      </div>
    </div>
  );

  // Step 4: Review
  const StepReview = () => (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-primary">Review Program</h2>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="font-semibold">{state.details.title}</p>
        {state.details.description && (
          <p className="mt-1 text-sm text-primary/60">{state.details.description}</p>
        )}
        {state.details.clientId && (
          <p className="mt-1 text-sm text-primary/60">
            Client: {clients.find((c) => c.id === state.details.clientId)?.full_name}
          </p>
        )}
      </div>
      {state.days.map((day, i) => (
        <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
          <p className="font-medium">
            Day {i + 1}: {day.title}
          </p>
          {day.scheduledDays.length > 0 && (
            <p className="text-xs text-primary/60">
              Schedule: {day.scheduledDays.map((d) => DAYS_OF_WEEK[d].label).join(", ")}
            </p>
          )}
          <p className="mt-1 text-sm text-primary/60">
            {day.exercises.length} exercise{day.exercises.length !== 1 ? "s" : ""}
          </p>
        </div>
      ))}
    </div>
  );

  const steps = [StepDetails, StepDays, StepExercises, StepReview];
  const StepComponent = steps[step - 1];

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                s <= step ? "bg-primary text-white" : "bg-primary/15 text-primary/40"
              )}
            >
              {s}
            </div>
            {s < 4 && (
              <div
                className={cn(
                  "h-0.5 flex-1 w-8",
                  s < step ? "bg-primary" : "bg-primary/15"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <StepComponent />

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
          >
            Back
          </Button>
        )}
        {step < 4 ? (
          <Button
            fullWidth
            onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
            disabled={step === 1 && !state.details.title}
          >
            Next
          </Button>
        ) : (
          <Button
            fullWidth
            loading={loading}
            onClick={async () => {
              setLoading(true);
              setError(null);
              const result = await createProgram(state);
              if (result?.error) {
                setError(result.error);
                setLoading(false);
              }
            }}
          >
            Create Program
          </Button>
        )}
      </div>
    </div>
  );
}

// Per-exercise set config row
function ExerciseSetEditor({
  exercise,
  config,
  onUpdate,
  onRemove,
}: {
  exercise: Exercise;
  config: ProgramBuilderExercise;
  onUpdate: (updated: ProgramBuilderExercise) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-primary/10 bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-primary">{exercise.name}</p>
        <button
          onClick={onRemove}
          className="text-primary/40 hover:text-red-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-primary/50">Sets</label>
          <input
            type="number"
            value={config.prescribedSets}
            min={1}
            onChange={(e) =>
              onUpdate({ ...config, prescribedSets: Number(e.target.value) })
            }
            className="h-9 rounded-lg border border-primary/20 bg-white px-2 text-center text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-primary/50">Reps</label>
          <input
            type="text"
            value={config.prescribedReps}
            onChange={(e) =>
              onUpdate({ ...config, prescribedReps: e.target.value })
            }
            placeholder="8-12"
            className="h-9 rounded-lg border border-primary/20 bg-white px-2 text-center text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-primary/50">Weight</label>
          <input
            type="text"
            value={config.prescribedWeight}
            onChange={(e) =>
              onUpdate({ ...config, prescribedWeight: e.target.value })
            }
            placeholder="kg / BW"
            className="h-9 rounded-lg border border-primary/20 bg-white px-2 text-center text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}
