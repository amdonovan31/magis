import { createClient } from "@/lib/supabase/server";

export type ClientNoteRow = {
  id: string;
  client_id: string;
  coach_id: string;
  content: string;
  note_type: string;
  session_log_id: string | null;
  created_at: string;
  session: { started_at: string } | null;
};

export async function getClientNotes(clientId: string): Promise<ClientNoteRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("client_notes")
    .select("*, session:workout_sessions!session_log_id(started_at)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return (data ?? []) as ClientNoteRow[];
}

/**
 * Returns a map of client_id → count of notes created after the given cutoff.
 * Used for the unread indicator on the coach dashboard.
 */
export async function getUnreadNoteCounts(
  coachId: string,
  clientIds: string[],
  lastViewedMap: Record<string, string>
): Promise<Record<string, number>> {
  if (clientIds.length === 0) return {};

  const supabase = await createClient();
  const counts: Record<string, number> = {};

  // Fetch notes not authored by the coach, grouped per client
  for (const clientId of clientIds) {
    const cutoff = lastViewedMap[clientId] ?? "1970-01-01T00:00:00Z";
    const { count } = await supabase
      .from("client_notes")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("coach_id", coachId)
      .neq("note_type", "coach_observation")
      .gt("created_at", cutoff);

    if (count && count > 0) {
      counts[clientId] = count;
    }
  }

  return counts;
}
