"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { saveGeneratedProgram } from "@/lib/actions/program.actions";

interface GeneratedExercise {
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
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
  focus: string;
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
}

export default function ProgramReview({ clientId, clientName }: Props) {
  const router = useRouter();
  const [program, setProgram] = useState<GeneratedProgram | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedWeek, setExpandedWeek] = useState<number>(1);

  useEffect(() => {
    const stored = localStorage.getItem("pending_program");
    const storedClientId = localStorage.getItem("pending_program_client_id");

    if (!stored || storedClientId !== clientId) {
      router.replace(`/clients/${clientId}/generate`);
      return;
    }

    try {
      setProgram(JSON.parse(stored));
    } catch {
      router.replace(`/clients/${clientId}/generate`);
    }
  }, [clientId, router]);

  async function handleApprove() {
    if (!program) return;
    setSaving(true);
    setError("");

    try {
      const res = await saveGeneratedProgram({ clientId, program });
      if (res?.error) {
        setError(res.error);
        setSaving(false);
        return;
      }

      localStorage.removeItem("pending_program");
      localStorage.removeItem("pending_program_client_id");
      // Redirect to the program editor so the coach can review/edit before publishing
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

  function handleRegenerate() {
    localStorage.removeItem("pending_program");
    localStorage.removeItem("pending_program_client_id");
    router.push(`/clients/${clientId}/generate/loading`);
  }

  if (!program) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  const totalWorkouts = program.weeks.reduce((sum, w) => sum + w.workouts.length, 0);
  const totalExercises = program.weeks.reduce(
    (sum, w) => sum + w.workouts.reduce((ws, wo) => ws + wo.exercises.length, 0),
    0
  );

  return (
    <>
      <TopBar
        title="Review Program"
        left={
          <button
            onClick={() => router.back()}
            className="text-sm text-primary/60 hover:text-primary"
          >
            &larr; Back
          </button>
        }
      />
      <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
        {/* Program header */}
        <Card padding="lg">
          <h2 className="font-heading text-xl font-semibold text-primary">
            {program.program_name}
          </h2>
          <p className="mt-1 text-sm text-muted">{program.program_description}</p>
          <div className="mt-3 flex gap-4 text-xs text-primary/50">
            <span>{program.weeks.length} weeks</span>
            <span>{totalWorkouts} workouts</span>
            <span>{totalExercises} exercises</span>
          </div>
          <p className="mt-1 text-xs text-primary/50">
            For {clientName}
          </p>
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
        {program.weeks
          .filter((w) => w.week_number === expandedWeek)
          .map((week) => (
            <div key={week.week_number} className="flex flex-col gap-3">
              <p className="text-sm font-medium text-primary/60">
                Focus: {week.focus}
              </p>

              {week.workouts.map((workout, wi) => (
                <Card key={wi} padding="md">
                  <div className="mb-2 flex items-baseline justify-between">
                    <h3 className="font-heading text-base font-semibold text-primary">
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
                  <div className="flex flex-col gap-2">
                    {workout.exercises.map((ex, ei) => (
                      <div
                        key={ei}
                        className="flex items-center justify-between rounded-lg bg-bg/50 px-3 py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary truncate">
                            {ex.exercise_name}
                          </p>
                          {ex.notes && (
                            <p className="text-[10px] text-primary/40 truncate">{ex.notes}</p>
                          )}
                        </div>
                        <div className="ml-3 shrink-0 text-right text-xs text-primary/60">
                          <span>{ex.sets} &times; {ex.reps}</span>
                          <span className="ml-2 text-primary/30">{ex.rest_seconds}s</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ))}

        {/* Error */}
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleRegenerate}
            disabled={saving}
          >
            Regenerate
          </Button>
          <Button
            fullWidth
            size="lg"
            onClick={handleApprove}
            disabled={saving}
          >
            {saving ? "Saving..." : "Approve & Save"}
          </Button>
        </div>
      </div>
    </>
  );
}
