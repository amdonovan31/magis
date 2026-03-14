import { createClient } from "@/lib/supabase/server";
import { computeStreak } from "@/lib/utils/date";
import type { CoachDashboardData, ClientWithProgram, Profile } from "@/types/app.types";

export async function getCoachDashboard(): Promise<CoachDashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch coach profile, relationships, and views in parallel
  const [{ data: coach }, { data: relationships }, { data: views }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("coach_client_relationships")
        .select("client_id, profiles!client_id(*)")
        .eq("coach_id", user.id),
      supabase
        .from("coach_client_views")
        .select("client_id, viewed_at")
        .eq("coach_id", user.id),
    ]);

  if (!coach) return null;
  if (!relationships) return { coach, clients: [] };

  const viewedMap: Record<string, string> = {};
  for (const v of views ?? []) {
    viewedMap[v.client_id] = v.viewed_at;
  }

  // For each client, fetch their active program, last session, streak, and unread notes
  const clientResults = await Promise.all(
    relationships.map(async (rel) => {
      const profile = rel.profiles as unknown as Profile | null;

      if (!profile?.id) return null;

      // Fetch last 60 days of completed sessions for streak calculation
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const cutoff = sixtyDaysAgo.toISOString();

      const lastViewed = viewedMap[profile.id] ?? "1970-01-01T00:00:00Z";

      const [{ data: activeProgram }, { data: recentSessions }, { count: unreadCount }, { count: intakeCount }] =
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
          supabase
            .from("client_notes")
            .select("*", { count: "exact", head: true })
            .eq("client_id", profile.id)
            .neq("note_type", "coach_observation")
            .gt("created_at", lastViewed),
          supabase
            .from("client_intake")
            .select("id", { count: "exact", head: true })
            .eq("client_id", profile.id),
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
        unreadNotes: unreadCount ?? 0,
        intakeComplete: (intakeCount ?? 0) > 0,
        intakeRequested: !!profile.intake_requested,
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
