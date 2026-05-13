/**
 * Client/server-safe shape and formatter for prior-block notes used by the
 * progression-mode generator. The DB-touching query lives in
 * src/lib/queries/notes.queries.ts; this module is pure so client components
 * can import it without dragging in next/headers via the Supabase server module.
 */

export type ProgramNote = {
  created_at: string;
  source: "set" | "session" | "general";
  exercise_name: string | null;
  session_id: string | null;
  content: string;
};

/**
 * Format a ProgramNote as a single prompt line so Claude can distinguish
 * set-level signals from session-level notes from general notes.
 *
 * Examples:
 *   [set note, 2026-04-12, bench press]: felt sharp twinge in left shoulder
 *   [session note, 2026-04-15]: low energy today, dropped accessories
 *   [general note, 2026-04-18]: starting to plateau on squat
 */
export function formatProgramNoteLine(note: ProgramNote): string {
  const date = note.created_at.slice(0, 10);
  if (note.source === "set") {
    const ex = note.exercise_name ?? "exercise";
    return `[set note, ${date}, ${ex}]: ${note.content}`;
  }
  if (note.source === "session") {
    return `[session note, ${date}]: ${note.content}`;
  }
  return `[general note, ${date}]: ${note.content}`;
}
