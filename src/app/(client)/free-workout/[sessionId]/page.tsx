import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FreeWorkoutClient from "@/components/workout/FreeWorkoutClient";
import type { SetLog } from "@/types/app.types";

interface FreeWorkoutPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function FreeWorkoutPage({ params }: FreeWorkoutPageProps) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("workout_sessions")
    .select("id, client_id, status, started_at")
    .eq("id", sessionId)
    .single();

  if (!session || session.client_id !== user.id) redirect("/home");
  if (session.status === "completed") redirect(`/workout/${sessionId}/summary`);

  const { data: setLogs } = await supabase
    .from("set_logs")
    .select("*, exercise:exercises!exercise_id(id, name, muscle_group)")
    .eq("session_id", sessionId)
    .order("set_number", { ascending: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_unit")
    .eq("id", user.id)
    .single();
  const preferredUnit = (profile?.preferred_unit as "kg" | "lbs") ?? "lbs";

  return (
    <FreeWorkoutClient
      sessionId={sessionId}
      startedAt={session.started_at}
      existingLogs={(setLogs ?? []) as SetLog[]}
      preferredUnit={preferredUnit}
    />
  );
}
