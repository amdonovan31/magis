import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getScheduledWorkout } from "@/lib/queries/calendar.queries";
import TopBar from "@/components/layout/TopBar";
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

      <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
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
            />
          ))}
        </div>

        {workout.template.exercises.length === 0 && (
          <p className="text-sm text-primary/40 italic text-center py-6">
            No exercises added to this workout yet.
          </p>
        )}

        <ProgramDisclaimerFooter variant="coached" />
      </div>
    </>
  );
}
