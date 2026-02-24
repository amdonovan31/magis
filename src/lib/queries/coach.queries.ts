import { createClient } from "@/lib/supabase/server";
import type { CoachDashboardData, ClientWithProgram } from "@/types/app.types";

export async function getCoachDashboard(): Promise<CoachDashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get coach profile
  const { data: coach } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!coach) return null;

  // Get all client relationships with their profiles
  const { data: relationships } = await supabase
    .from("coach_client_relationships")
    .select("client_id, profiles!client_id(*)")
    .eq("coach_id", user.id);

  if (!relationships) return { coach, clients: [] };

  // For each client, fetch their active program and last session
  const clients: ClientWithProgram[] = await Promise.all(
    relationships.map(async (rel) => {
      const profile = rel.profiles as unknown as import("@/types/app.types").Profile;

      const [{ data: activeProgram }, { data: lastSession }] =
        await Promise.all([
          supabase
            .from("programs")
            .select("*")
            .eq("client_id", profile.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("workout_sessions")
            .select("started_at")
            .eq("client_id", profile.id)
            .eq("status", "completed")
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      return {
        profile,
        activeProgram: activeProgram ?? null,
        lastSessionDate: lastSession?.started_at ?? null,
      };
    })
  );

  return { coach, clients };
}

export async function getCoachClients() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("coach_client_relationships")
    .select("client_id, profiles!client_id(*)")
    .eq("coach_id", user.id);

  return data?.map((r) => r.profiles).filter(Boolean) ?? [];
}
