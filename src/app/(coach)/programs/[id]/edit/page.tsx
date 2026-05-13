import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProgramWithTemplates } from "@/lib/queries/program.queries";
import { getAllExerciseNames } from "@/lib/queries/exercise.queries";
import ProgramEditor from "@/components/coach/ProgramEditor";

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: programId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const program = await getProgramWithTemplates(programId);
  if (!program) notFound();

  // Verify the coach owns this program
  if (program.coach_id !== user.id) notFound();

  const exercises = await getAllExerciseNames();

  let clientName: string | null = null;
  if (program.client_id) {
    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", program.client_id)
      .single();
    clientName = clientProfile?.full_name ?? null;
  }

  // Fetch future scheduled workouts (non-started) for date editing
  const { data: scheduledWorkouts } = await supabase
    .from("scheduled_workouts")
    .select("id, workout_template_id, scheduled_date, status")
    .eq("program_id", programId)
    .eq("status", "scheduled")
    .order("scheduled_date", { ascending: true });

  // For Schedule-vs-Publish branching: does this client already have a
  // currently-published program (other than this one)?
  let priorPublishedExists = false;
  let priorEndsOn: string | null = null;
  if (program.client_id && program.status === "draft") {
    const { data: prior } = await supabase
      .from("programs")
      .select("ends_on")
      .eq("client_id", program.client_id)
      .eq("status", "published")
      .neq("id", program.id)
      .order("ends_on", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (prior) {
      priorPublishedExists = true;
      priorEndsOn = prior.ends_on;
    }
  }

  return (
    <ProgramEditor
      program={program}
      exercises={exercises}
      clientName={clientName}
      scheduledWorkouts={scheduledWorkouts ?? []}
      priorPublishedExists={priorPublishedExists}
      priorEndsOn={priorEndsOn}
    />
  );
}
