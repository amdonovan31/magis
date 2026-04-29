import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getScheduledWorkout } from "@/lib/queries/calendar.queries";
import { startWorkoutSession } from "@/lib/actions/session.actions";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import CalendarExerciseCard from "@/components/workout/CalendarExerciseCard";
import ProgramDisclaimerFooter from "@/components/disclaimer/ProgramDisclaimerFooter";
import Link from "next/link";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const workout = await getScheduledWorkout(workoutId);
  if (!workout) notFound();

  // Check for any existing session for this template+client.
  // Prevents duplicate logging when a user has an in-progress or completed
  // session that the scheduled_workouts.status hasn't been updated to reflect.
  const { data: existingSession } = await supabase
    .from("workout_sessions")
    .select("id, status")
    .eq("client_id", user.id)
    .eq("workout_template_id", workout.template.id)
    .in("status", ["in_progress", "completed"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const inProgressSessionId =
    existingSession?.status === "in_progress" ? existingSession.id : null;
  const completedSessionId =
    existingSession?.status === "completed"
      ? existingSession.id
      : workout.session_id ?? null;

  // Fetch exercise notes and substitutions for completed workouts
  const notesByExercise: Record<string, string> = {};
  const subsByExercise: Record<string, { substituteName: string; originalName: string }> = {};
  if (workout.status === "completed" && workout.session_id) {
    const [{ data: notes }, { data: subs }] = await Promise.all([
      supabase
        .from("session_exercise_notes")
        .select("template_exercise_id, content")
        .eq("session_id", workout.session_id),
      supabase
        .from("exercise_substitutions")
        .select("template_exercise_id, original_exercise:exercises!exercise_substitutions_original_exercise_id_fkey(name), substitute_exercise:exercises!exercise_substitutions_substitute_exercise_id_fkey(name)")
        .eq("session_id", workout.session_id),
    ]);

    if (notes) {
      for (const n of notes) {
        if (n.content) notesByExercise[n.template_exercise_id] = n.content;
      }
    }

    if (subs) {
      for (const s of subs) {
        const orig = s.original_exercise as unknown as { name: string } | null;
        const sub = s.substitute_exercise as unknown as { name: string } | null;
        if (orig && sub) {
          subsByExercise[s.template_exercise_id] = {
            substituteName: sub.name,
            originalName: orig.name,
          };
        }
      }
    }
  }

  const isScheduled = workout.status === "scheduled";
  const isMissed = workout.status === "missed";
  const isSkipped = workout.status === "skipped";
  const isCompleted = workout.status === "completed" || completedSessionId != null;
  // Only allow new starts/logs if there's no existing session for this template
  const canLog = (isScheduled || isMissed || isSkipped) && !inProgressSessionId && !isCompleted;

  async function startSession() {
    "use server";
    await startWorkoutSession(workout!.template.id, workout!.program.id);
  }

  const scheduledDate = new Date(workout.scheduled_date + "T00:00:00");
  const dateLabel = scheduledDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <TopBar
        title={workout.template.title}
        left={
          <Link
            href="/calendar"
            className="text-sm text-primary/60 hover:text-primary"
          >
            ← Back
          </Link>
        }
      />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-24">
        {/* Date + Program */}
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-muted">
            {dateLabel}
          </p>
          <p className="mt-1 text-sm text-primary/50">
            {workout.program.title}
          </p>
        </div>

        {/* Exercises */}
        <div className="flex flex-col gap-2">
          {workout.template.exercises.map((te, i) => (
            <CalendarExerciseCard
              key={te.id}
              index={i + 1}
              name={te.exercise?.name ?? "Unknown Exercise"}
              muscleGroup={te.exercise?.muscle_group ?? null}
              prescribedSets={te.prescribed_sets}
              prescribedReps={te.prescribed_reps}
              prescribedWeight={te.prescribed_weight}
              restSeconds={te.rest_seconds}
              alternates={
                (te.alternateExercises ?? []).map((alt) => ({
                  id: alt.id,
                  name: alt.name,
                  equipment: alt.equipment ?? null,
                }))
              }
              note={notesByExercise[te.id]}
              substituteName={subsByExercise[te.id]?.substituteName}
              substituteOriginalName={subsByExercise[te.id]?.originalName}
            />
          ))}
        </div>

        {workout.template.exercises.length === 0 && (
          <p className="text-sm text-primary/40 italic text-center py-6">
            No exercises added to this workout yet.
          </p>
        )}

        {/* In-progress session takes priority — show resume */}
        {inProgressSessionId && (
          <Link href={`/workout/${inProgressSessionId}`}>
            <Button fullWidth size="lg" variant="accent">
              Resume Workout →
            </Button>
          </Link>
        )}

        {/* Completed session — show summary */}
        {!inProgressSessionId && isCompleted && completedSessionId && (
          <Link href={`/workout/${completedSessionId}/summary`}>
            <Button fullWidth size="lg" variant="secondary">
              View Summary →
            </Button>
          </Link>
        )}

        {/* No existing session — allow live start or retro log */}
        {canLog && (
          <div className="flex flex-col gap-2">
            <form action={startSession}>
              <Button type="submit" fullWidth size="lg">
                Do Workout Now &rarr;
              </Button>
            </form>
            <Link href={`/calendar/${workoutId}/log`}>
              <Button fullWidth size="lg" variant="secondary">
                Log Past Results
              </Button>
            </Link>
          </div>
        )}

        <ProgramDisclaimerFooter variant="coached" />
      </div>
    </>
  );
}
