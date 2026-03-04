import { createClient } from "@/lib/supabase/server";
import { computeStreak } from "@/lib/utils/date";
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

  // For each client, fetch their active program, last session, and streak
  const clientResults = await Promise.all(
    relationships.map(async (rel) => {
      const profile = rel.profiles as unknown as import("@/types/app.types").Profile | null;

      if (!profile?.id) return null;

      // Fetch last 60 days of completed sessions for streak calculation
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const cutoff = sixtyDaysAgo.toISOString();

      const [{ data: activeProgram }, { data: recentSessions }] =
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
            .gte("started_at", cutoff)
            .order("started_at", { ascending: true }),
        ]);

      const sessionDates = (recentSessions ?? []).map((s) =>
        s.started_at.slice(0, 10)
      );
      const streak = computeStreak(sessionDates);
      const lastSessionDate =
        sessionDates.length > 0
          ? recentSessions![recentSessions!.length - 1].started_at
          : null;

      return {
        profile,
        activeProgram: activeProgram ?? null,
        lastSessionDate,
        streak,
      };
    })
  );

  const clients = clientResults.filter(Boolean) as ClientWithProgram[];
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
