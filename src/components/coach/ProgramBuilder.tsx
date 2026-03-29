"use client";

import { useState } from "react";
import { createProgram } from "@/lib/actions/program.actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ExerciseCard from "@/components/exercises/ExerciseCard";
import ExerciseSearch from "@/components/exercises/ExerciseSearch";
import { DAYS_OF_WEEK } from "@/types/app.types";
import { cn } from "@/lib/utils/cn";
import type {
  ProgramBuilderState,
  ProgramBuilderWeek,
  ProgramBuilderDay,
  ProgramBuilderExercise,
  Exercise,
  Profile,
} from "@/types/app.types";

interface ProgramBuilderProps {
  clients: Pick<Profile, "id" | "full_name">[];
  exercises: Exercise[];
  currentUserId?: string;
}

const defaultDay = (dayNumber: number = 1): ProgramBuilderDay => ({
  title: "",
  dayNumber,
  notes: "",
  scheduledDays: [],
  exercises: [],
});

const defaultState: ProgramBuilderState = {
  details: { title: "", description: "", clientId: "", startsOn: "" },
  weeks: [{ weekNumber: 1, isDeload: false, days: [defaultDay(1)] }],
};

export default function ProgramBuilder({ clients, exercises, currentUserId }: ProgramBuilderProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [state, setState] = useState<ProgramBuilderState>(defaultState);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [exSearch, setExSearch] = useState("");
  const [exMuscleGroup, setExMuscleGroup] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numWeeks = state.weeks.length;
  const activeWeek = state.weeks[activeWeekIdx];
  const week1Day = state.weeks[0].days[activeDayIdx];
  const currentDay = activeWeek?.days[activeDayIdx];

  // Structural edits (title, scheduled days) propagate to all weeks
  function updateDayStructure(
    dayIdx: number,
    patch: Partial<Pick<ProgramBuilderDay, "title" | "notes" | "scheduledDays" | "dayNumber">>
  ) {
    setState((s) => ({
      ...s,
      weeks: s.weeks.map((w) => ({
        ...w,
        days: w.days.map((d, i) => (i === dayIdx ? { ...d, ...patch } : d)),
      })),
    }));
  }

  function setNumWeeks(n: number) {
    if (n < 1 || n > 12) return;
    setState((s) => {
      const current = s.weeks;
      if (n === current.length) return s;
      if (n > current.length) {
        const week1Days = current[0].days;
        const newWeeks: ProgramBuilderWeek[] = [...current];
        for (let i = current.length; i < n; i++) {
          newWeeks.push({
            weekNumber: i + 1,
            isDeload: false,
            days: week1Days.map((d) => ({ ...d, exercises: [] })),
          });
        }
        return { ...s, weeks: newWeeks };
      }
      if (activeWeekIdx >= n) setActiveWeekIdx(n - 1);
      return { ...s, weeks: current.slice(0, n) };
    });
  }

  function copyWeekExercises(fromWeekIdx: number, toWeekIdx: number) {
    setState((s) => {
      const source = s.weeks[fromWeekIdx];
      if (!source) return s;
      return {
        ...s,
        weeks: s.weeks.map((w, i) =>
          i === toWeekIdx
            ? {
                ...w,
                days: w.days.map((d, di) => ({
                  ...d,
                  exercises: source.days[di]?.exercises.map((e) => ({ ...e })) ?? [],
                })),
              }
            : w
        ),
      };
    });
  }

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  const StepDetails = () => (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-primary">Program Details</h2>
      <Input
        label="Program Title"
        value={state.details.title}
        onChange={(e) =>
          setState((s) => ({ ...s, details: { ...s.details, title: e.target.value } }))
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
          className="rounded-xl border border-primary/20 bg-surface px-4 py-3 text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Number of weeks */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-primary">Number of Weeks</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNumWeeks(numWeeks - 1)}
            disabled={numWeeks <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 text-lg text-primary disabled:opacity-30 hover:bg-primary/5 transition-colors"
          >
            –
          </button>
          <span className="w-8 text-center text-xl font-semibold text-primary">{numWeeks}</span>
          <button
            onClick={() => setNumWeeks(numWeeks + 1)}
            disabled={numWeeks >= 12}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 text-lg text-primary disabled:opacity-30 hover:bg-primary/5 transition-colors"
          >
            +
          </button>
          <span className="text-sm text-primary/50">week{numWeeks !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-primary">Assign to Client</label>
        <select
          value={state.details.clientId}
          onChange={(e) =>
            setState((s) => ({ ...s, details: { ...s.details, clientId: e.target.value } }))
          }
          className="h-12 rounded-xl border border-primary/20 bg-surface px-4 text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">No client yet</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}{currentUserId && c.id === currentUserId ? " (You)" : ""}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Start Date"
        type="date"
        value={state.details.startsOn}
        onChange={(e) =>
          setState((s) => ({ ...s, details: { ...s.details, startsOn: e.target.value } }))
        }
      />
    </div>
  );

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  const StepDays = () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Workout Days</h2>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const newDayNumber = state.weeks[0].days.length + 1;
            const newDay = defaultDay(newDayNumber);
            setState((s) => ({
              ...s,
              weeks: s.weeks.map((w) => ({
                ...w,
                days: [...w.days, { ...newDay, exercises: [] }],
              })),
            }));
            setActiveDayIdx(state.weeks[0].days.length);
          }}
        >
          + Add Day
        </Button>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {state.weeks[0].days.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveDayIdx(i)}
            className={cn(
              "flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              activeDayIdx === i ? "bg-primary text-white" : "bg-primary/10 text-primary"
            )}
          >
            Day {i + 1}
          </button>
        ))}
      </div>

      <Input
        label="Day Title"
        value={week1Day.title}
        onChange={(e) => updateDayStructure(activeDayIdx, { title: e.target.value })}
        placeholder="e.g. Upper Body A"
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-primary">Schedule (days of week)</label>
        <div className="flex gap-2">
          {DAYS_OF_WEEK.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                const next = week1Day.scheduledDays.includes(value)
                  ? week1Day.scheduledDays.filter((v) => v !== value)
                  : [...week1Day.scheduledDays, value];
                updateDayStructure(activeDayIdx, { scheduledDays: next });
              }}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-colors",
                week1Day.scheduledDays.includes(value)
                  ? "bg-primary text-white"
                  : "bg-primary/10 text-primary"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {state.weeks[0].days.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:bg-red-50"
          onClick={() => {
            setState((s) => ({
              ...s,
              weeks: s.weeks.map((w) => ({
                ...w,
                days: w.days.filter((_, i) => i !== activeDayIdx),
              })),
            }));
            setActiveDayIdx(Math.max(0, activeDayIdx - 1));
          }}
        >
          Remove Day {activeDayIdx + 1}
        </Button>
      )}
    </div>
  );

  // ── Step 3 ──────────────────────────────────────────────────────────────────
  const StepExercises = () => {
    const filteredExercises = exercises.filter((ex) => {
      const matchSearch =
        !exSearch || ex.name.toLowerCase().includes(exSearch.toLowerCase());
      const matchMuscle = !exMuscleGroup || ex.muscle_group === exMuscleGroup;
      const notAdded = !currentDay.exercises.some((e) => e.exerciseId === ex.id);
      return matchSearch && matchMuscle && notAdded;
    });

    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-primary">Exercises</h2>

        {/* Week tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {state.weeks.map((w, wi) => (
            <button
              key={wi}
              onClick={() => {
                setActiveWeekIdx(wi);
                setActiveDayIdx(0);
              }}
              className={cn(
                "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                activeWeekIdx === wi ? "bg-primary text-white" : "bg-primary/10 text-primary"
              )}
            >
              Week {w.weekNumber}
              {w.isDeload && <span className="ml-1 opacity-70">↓</span>}
            </button>
          ))}
        </div>

        {/* Deload toggle + copy buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() =>
              setState((s) => ({
                ...s,
                weeks: s.weeks.map((w, i) =>
                  i === activeWeekIdx ? { ...w, isDeload: !w.isDeload } : w
                ),
              }))
            }
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              activeWeek.isDeload
                ? "bg-[#1B2E4B]/10 text-[#1B2E4B] border-[#1B2E4B]/20"
                : "bg-primary/5 text-primary/50 border-primary/20 hover:bg-primary/10"
            )}
          >
            {activeWeek.isDeload ? "↓ Deload week — click to remove" : "Mark as deload"}
          </button>
          {activeWeekIdx > 0 && (
            <>
              <button
                onClick={() => copyWeekExercises(activeWeekIdx - 1, activeWeekIdx)}
                className="rounded-full px-3 py-1 text-xs font-medium border border-primary/20 bg-primary/5 text-primary/70 hover:bg-primary/10 transition-colors"
              >
                Copy from Week {activeWeekIdx}
              </button>
              {activeWeekIdx > 1 && (
                <button
                  onClick={() => copyWeekExercises(0, activeWeekIdx)}
                  className="rounded-full px-3 py-1 text-xs font-medium border border-primary/20 bg-primary/5 text-primary/70 hover:bg-primary/10 transition-colors"
                >
                  Copy from Week 1
                </button>
              )}
            </>
          )}
        </div>

        {/* Day tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {activeWeek.days.map((day, i) => (
            <button
              key={i}
              onClick={() => setActiveDayIdx(i)}
              className={cn(
                "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                activeDayIdx === i ? "bg-primary text-white" : "bg-primary/10 text-primary"
              )}
            >
              {day.title || `Day ${i + 1}`}
            </button>
          ))}
        </div>

        {/* Selected exercises */}
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
                    weeks: s.weeks.map((w, wi) =>
                      wi === activeWeekIdx
                        ? {
                            ...w,
                            days: w.days.map((d, di) =>
                              di === activeDayIdx
                                ? {
                                    ...d,
                                    exercises: d.exercises.map((e, j) =>
                                      j === ei ? updated : e
                                    ),
                                  }
                                : d
                            ),
                          }
                        : w
                    ),
                  }));
                }}
                onRemove={() => {
                  setState((s) => ({
                    ...s,
                    weeks: s.weeks.map((w, wi) =>
                      wi === activeWeekIdx
                        ? {
                            ...w,
                            days: w.days.map((d, di) =>
                              di === activeDayIdx
                                ? { ...d, exercises: d.exercises.filter((_, j) => j !== ei) }
                                : d
                            ),
                          }
                        : w
                    ),
                  }));
                }}
              />
            ))}
          </div>
        )}

        {/* Exercise search + picker */}
        <p className="text-xs font-medium text-primary/60 uppercase tracking-wide">
          Add Exercise
        </p>
        <ExerciseSearch
          onSearch={({ search, muscleGroup }) => {
            setExSearch(search);
            setExMuscleGroup(muscleGroup);
          }}
        />
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {filteredExercises.length === 0 ? (
            <p className="py-4 text-center text-sm text-primary/40">
              No exercises match your filter
            </p>
          ) : (
            filteredExercises.map((ex) => (
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
                    weeks: s.weeks.map((w, wi) =>
                      wi === activeWeekIdx
                        ? {
                            ...w,
                            days: w.days.map((d, di) =>
                              di === activeDayIdx
                                ? { ...d, exercises: [...d.exercises, newEx] }
                                : d
                            ),
                          }
                        : w
                    ),
                  }));
                }}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  // ── Step 4 ──────────────────────────────────────────────────────────────────
  const StepReview = () => (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-primary">Review Program</h2>
      <div className="rounded-xl border border-primary/10 bg-surface p-4">
        <p className="font-semibold">{state.details.title}</p>
        {state.details.description && (
          <p className="mt-1 text-sm text-primary/60">{state.details.description}</p>
        )}
        {state.details.clientId && (
          <p className="mt-1 text-sm text-primary/60">
            Client: {clients.find((c) => c.id === state.details.clientId)?.full_name}
          </p>
        )}
        <p className="mt-1 text-sm text-primary/60">
          {numWeeks} week{numWeeks !== 1 ? "s" : ""}
        </p>
      </div>
      {state.weeks.map((week) => (
        <div key={week.weekNumber} className="rounded-xl border border-primary/10 bg-surface p-4">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-medium text-primary">Week {week.weekNumber}</p>
            {week.isDeload && (
              <span className="rounded-full bg-[#1B2E4B]/10 px-2 py-0.5 text-xs text-[#1B2E4B]">
                Deload
              </span>
            )}
          </div>
          {week.days.map((day, i) => (
            <div key={i} className="mt-1.5">
              <p className="text-sm font-medium text-primary">
                Day {i + 1}: {day.title || "(no title)"}
              </p>
              {day.scheduledDays.length > 0 && (
                <p className="text-xs text-primary/60">
                  {day.scheduledDays.map((d) => DAYS_OF_WEEK[d].label).join(", ")}
                </p>
              )}
              <p className="text-xs text-primary/40">
                {day.exercises.length} exercise{day.exercises.length !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
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
                className={cn("h-0.5 flex-1 w-8", s < step ? "bg-primary" : "bg-primary/15")}
              />
            )}
          </div>
        ))}
      </div>

      {StepComponent()}

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

// ── Per-exercise set config row ──────────────────────────────────────────────
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
    <div className="rounded-xl border border-primary/10 bg-surface p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-primary">{exercise.name}</p>
        <button
          onClick={onRemove}
          className="text-primary/40 hover:text-red-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
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
            onChange={(e) => onUpdate({ ...config, prescribedSets: Number(e.target.value) })}
            className="h-9 rounded-lg border border-primary/20 bg-surface px-2 text-center text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-primary/50">Reps</label>
          <input
            type="text"
            value={config.prescribedReps}
            onChange={(e) => onUpdate({ ...config, prescribedReps: e.target.value })}
            placeholder="8-12"
            className="h-9 rounded-lg border border-primary/20 bg-surface px-2 text-center text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-primary/50">Weight</label>
          <input
            type="text"
            value={config.prescribedWeight}
            onChange={(e) => onUpdate({ ...config, prescribedWeight: e.target.value })}
            placeholder="kg / BW"
            className="h-9 rounded-lg border border-primary/20 bg-surface px-2 text-center text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}
