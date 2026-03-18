import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProgramReview from "@/components/coach/ProgramReview";

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: { programId?: string };
}) {
  const { id: clientId } = await params;
  const programId = searchParams.programId;

  if (!programId) {
    redirect(`/clients/${clientId}/generate`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify coach-client relationship
  const { data: relationship } = await supabase
    .from("coach_client_relationships")
    .select("client_id")
    .eq("coach_id", user.id)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!relationship) redirect("/clients");

  // Fetch the pending program
  const { data: pendingProgram } = await supabase
    .from("programs")
    .select("id, pending_json")
    .eq("id", programId)
    .eq("coach_id", user.id)
    .eq("status", "pending_review")
    .single();

  if (!pendingProgram?.pending_json) {
    redirect(`/clients/${clientId}/generate`);
  }

  const pendingData = pendingProgram.pending_json as {
    program: unknown;
    exerciseNames: Record<string, string>;
  };

  const [{ data: profile }, { data: exercises }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", clientId)
      .single(),
    supabase
      .from("exercises")
      .select("id, name, muscle_group, equipment, instructions")
      .eq("is_archived", false)
      .order("name", { ascending: true }),
  ]);

  return (
    <ProgramReview
      clientId={clientId}
      clientName={profile?.full_name ?? "Client"}
      programId={pendingProgram.id}
      initialProgram={pendingData.program}
      initialExerciseNames={pendingData.exerciseNames}
      exercises={(exercises ?? []).map((e) => ({
        id: e.id,
        name: e.name,
        muscle_group: e.muscle_group,
        equipment: e.equipment,
        instructions: e.instructions,
      }))}
    />
  );
}
