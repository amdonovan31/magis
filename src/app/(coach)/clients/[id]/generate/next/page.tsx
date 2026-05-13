import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/layout/TopBar";
import { getNotesForProgram } from "@/lib/queries/notes.queries";
import ProgressionGenerateEntry from "@/components/coach/ProgressionGenerateEntry";

export default async function GenerateNextProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Verify coach owns this client
  const { data: relationship } = await supabase
    .from("coach_client_relationships")
    .select("client_id")
    .eq("coach_id", user.id)
    .eq("client_id", id)
    .maybeSingle();
  if (!relationship) notFound();

  // Find the prior block — most recent published, falling back to archived.
  // If neither exists, send the coach to the initial generate flow instead.
  const { data: priorPrograms } = await supabase
    .from("programs")
    .select("id, title, starts_on, ends_on, status")
    .eq("client_id", id)
    .in("status", ["published", "archived"])
    .order("created_at", { ascending: false })
    .limit(1);
  const prior = priorPrograms?.[0];
  if (!prior) redirect(`/clients/${id}/generate`);

  // If a scheduled program already exists for this client, the coach should
  // edit/cancel that one rather than generate yet another. Bounce them to the
  // scheduled program's edit screen.
  const { data: existingScheduled } = await supabase
    .from("programs")
    .select("id")
    .eq("client_id", id)
    .eq("status", "scheduled")
    .maybeSingle();
  if (existingScheduled) redirect(`/programs/${existingScheduled.id}/edit`);

  const [{ data: clientProfile }, notes] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", id).single(),
    getNotesForProgram(prior.id),
  ]);

  return (
    <>
      <TopBar title={`Next program for ${clientProfile?.full_name ?? "client"}`} />
      <ProgressionGenerateEntry
        clientId={id}
        priorProgram={{
          title: prior.title,
          starts_on: prior.starts_on,
          ends_on: prior.ends_on,
        }}
        notes={notes}
      />
    </>
  );
}
