import { createClient } from "@/lib/supabase/server";
import {
  formatProgramNoteLine as _formatProgramNoteLine,
  type ProgramNote as _ProgramNote,
} from "@/lib/utils/program-notes";

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

// Re-export the client-safe shape and formatter so existing imports keep working.
export type ProgramNote = _ProgramNote;
export const formatProgramNoteLine = _formatProgramNoteLine;

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
 * Aggregate every note attached to a specific program — set-level
 * (session_exercise_notes), session-level (workout_sessions.notes), and
 * general client_notes linked to a session of that program. Returns a
 * chronologically ordered list (ascending) the prompt builder formats with
 * source prefixes like "[set note, 2026-04-12, bench press]: ...".
 *
 * Notes joined via workout_sessions.program_id — a note that was attached to
 * a free workout (no program_id) won't appear here, which is the right
 * scoping for "prior block" context.
 */
export async function getNotesForProgram(programId: string): Promise<ProgramNote[]> {
  const supabase = await createClient();

  // Sessions belonging to this program. Used as the join anchor for all three
  // note sources.
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, started_at, notes")
    .eq("program_id", programId)
    .order("started_at", { ascending: true });

  const sessionRows = sessions ?? [];
  const sessionIds = sessionRows.map((s) => s.id);
  const sessionStartedAt = new Map(sessionRows.map((s) => [s.id, s.started_at as string]));

  if (sessionIds.length === 0) return [];

  const [{ data: setNotes }, { data: clientNotes }] = await Promise.all([
    supabase
      .from("session_exercise_notes")
      .select("session_id, content, created_at, template_exercise:workout_template_exercises!template_exercise_id(exercise:exercises!exercise_id(name))")
      .in("session_id", sessionIds)
      .not("content", "is", null),
    supabase
      .from("client_notes")
      .select("session_log_id, content, created_at")
      .in("session_log_id", sessionIds),
  ]);

  const out: ProgramNote[] = [];

  // 1. Session-level notes from workout_sessions.notes
  for (const s of sessionRows) {
    if (s.notes) {
      out.push({
        created_at: s.started_at as string,
        source: "session",
        exercise_name: null,
        session_id: s.id,
        content: s.notes as string,
      });
    }
  }

  // 2. Set-level notes from session_exercise_notes
  for (const n of setNotes ?? []) {
    if (!n.content) continue;
    const tmpl = n.template_exercise as { exercise: { name: string | null } | null } | null;
    out.push({
      created_at: n.created_at as string,
      source: "set",
      exercise_name: tmpl?.exercise?.name ?? null,
      session_id: n.session_id as string,
      content: n.content as string,
    });
  }

  // 3. Free-form client_notes that the coach attached against a session of
  //    this program (note_type may be 'post_session' or similar — we include
  //    everything attached to a relevant session).
  for (const n of clientNotes ?? []) {
    out.push({
      created_at: (sessionStartedAt.get(n.session_log_id as string) ?? n.created_at) as string,
      source: "general",
      exercise_name: null,
      session_id: n.session_log_id as string | null,
      content: n.content as string,
    });
  }

  // Chronological ascending — the prompt assembler renders in this order.
  out.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return out;
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
