import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getScheduledWorkout } from "@/lib/queries/calendar.queries";
import TopBar from "@/components/layout/TopBar";
import RetroLogClient from "@/components/workout/RetroLogClient";
import Link from "next/link";

export default async function RetroLogPage({
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
  if (workout.status === "completed") redirect("/calendar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("weight_unit")
    .eq("id", user.id)
    .single();

  const weightUnit = (profile?.weight_unit as "lbs" | "kg") ?? "lbs";

  return (
    <>
      <TopBar
        title="Log Workout"
        left={
          <Link
            href={`/calendar/${workoutId}`}
            className="text-sm text-primary/60 hover:text-primary"
          >
            ← Back
          </Link>
        }
      />
      <RetroLogClient workout={workout} weightUnit={weightUnit} />
    </>
  );
}
