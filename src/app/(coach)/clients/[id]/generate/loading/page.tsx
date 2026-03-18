import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GeneratingScreen from "@/components/coach/GeneratingScreen";

export default async function GenerateLoadingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: { regenFeedback?: string; regenProgramId?: string };
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

  if (!relationship) notFound();

  // Get client name + most recent guidelines in parallel
  const [{ data: profile }, { data: guidelines }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", clientId)
      .single(),
    supabase
      .from("coach_guidelines")
      .select("id")
      .eq("client_id", clientId)
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile) notFound();

  // No guidelines saved yet — send coach back to the form
  if (!guidelines) {
    redirect(`/clients/${clientId}/generate`);
  }

  // If regenerating, fetch the previous program's pending_json
  let previousProgramJson: string | null = null;
  if (searchParams.regenProgramId) {
    const { data: prevProgram } = await supabase
      .from("programs")
      .select("pending_json")
      .eq("id", searchParams.regenProgramId)
      .single();

    if (prevProgram?.pending_json) {
      const pending = prevProgram.pending_json as { program?: unknown };
      if (pending.program) {
        previousProgramJson = JSON.stringify(pending.program);
      }
    }

    // Delete the old pending_review program since we're regenerating
    await supabase
      .from("programs")
      .delete()
      .eq("id", searchParams.regenProgramId)
      .eq("status", "pending_review");
  }

  return (
    <GeneratingScreen
      clientId={clientId}
      clientName={profile.full_name ?? "Client"}
      guidelinesId={guidelines.id}
      regenerationFeedback={searchParams.regenFeedback ?? null}
      previousProgramJson={previousProgramJson}
    />
  );
}
