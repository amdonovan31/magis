import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getScheduledWorkout } from "@/lib/queries/calendar.queries";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
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
            <Card key={te.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/5 text-xs font-bold text-primary/40">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-body font-medium text-primary">
                      {te.exercise?.name ?? "Unknown Exercise"}
                    </p>
                    {te.exercise?.muscle_group && (
                      <span className="mt-0.5 inline-block rounded-full bg-surface border border-primary/5 px-2 py-0.5 text-[10px] text-muted">
                        {te.exercise.muscle_group}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-sm text-muted">
                    {te.prescribed_sets ?? "—"}×{te.prescribed_reps ?? "—"}
                  </span>
                  {te.prescribed_weight && (
                    <span className="text-xs text-primary/40">
                      @ {te.prescribed_weight}
                    </span>
                  )}
                  {te.rest_seconds != null && te.rest_seconds > 0 && (
                    <span className="text-xs text-primary/40">
                      {te.rest_seconds}s rest
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {workout.template.exercises.length === 0 && (
          <p className="text-sm text-primary/40 italic text-center py-6">
            No exercises added to this workout yet.
          </p>
        )}
      </div>
    </>
  );
}
