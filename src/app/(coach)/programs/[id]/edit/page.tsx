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

  return <ProgramEditor program={program} exercises={exercises} clientName={clientName} />;
}
