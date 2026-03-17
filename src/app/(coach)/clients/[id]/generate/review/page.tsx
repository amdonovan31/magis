import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProgramReview from "@/components/coach/ProgramReview";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = await params;
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
