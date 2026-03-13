import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllExerciseNames } from "@/lib/queries/exercise.queries";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Link from "next/link";
import IntakeSummaryCard from "@/components/intake/IntakeSummaryCard";
import GuidelinesForm from "@/components/coach/GuidelinesForm";

export default async function GenerateProgramPage({
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

  if (!relationship) notFound();

  // Get client profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", clientId)
    .single();

  if (!profile) notFound();

  // Get client intake
  const { data: intake } = await supabase
    .from("client_intake")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get exercises for the search selects
  const exercises = await getAllExerciseNames();

  return (
    <>
      <TopBar
        title="Generate Program"
        left={
          <Link
            href={`/clients/${clientId}`}
            className="text-sm text-primary/60 hover:text-primary"
          >
            ← Back
          </Link>
        }
      />
      <div className="flex flex-col gap-5 px-4 pt-4 pb-8">
        <div>
          <p className="text-sm text-muted">
            Creating program for
          </p>
          <h2 className="font-heading text-xl font-semibold text-primary">
            {profile.full_name ?? "Client"}
          </h2>
        </div>

        {/* Section A — Client Intake */}
        {intake ? (
          <IntakeSummaryCard intake={intake} />
        ) : (
          <Card padding="lg" className="border-yellow-200 bg-yellow-50/50">
            <p className="text-sm text-primary/70">
              This client hasn&apos;t completed their intake form yet. You can
              still generate a program but the AI will have limited context.
            </p>
          </Card>
        )}

        {/* Section B — Coach Guidelines */}
        <GuidelinesForm clientId={clientId} exercises={exercises} />
      </div>
    </>
  );
}
