/**
 * Single source of truth for "is this program over?" — date-based.
 *
 * All inputs are YYYY-MM-DD ISO strings (the shape Postgres date columns
 * have when serialized via supabase-js). String comparison works for these
 * because YYYY-MM-DD sorts lexicographically the same way it sorts as a date.
 *
 * Pure module — safe to import from server or client components.
 */

export type ProgramLifecycle =
  | "not_started"
  | "active"
  | "ended"
  | "draft"
  | "archived";

export interface ProgramForLifecycle {
  starts_on: string;
  ends_on: string;
  status: string;
}

/**
 * Resolve a program's lifecycle state given today's date in the client's TZ.
 *
 * - draft / archived → returned literally (the lifecycle pill shows the label)
 * - published → not_started / active / ended based on today's date
 * - scheduled (whitelisted for PR 1) → soft-promotion view: shows as
 *   not_started before starts_on, active otherwise. PR 1 must guarantee
 *   on-read promotion from scheduled → published before any lifecycle call
 *   site renders, otherwise this lies about the DB state.
 * - any unknown status → "ended" (defensive default; existing code only
 *   knows about draft/published/archived/pending_review)
 */
export function getProgramLifecycle(
  program: ProgramForLifecycle,
  todayISO: string,
): ProgramLifecycle {
  if (program.status === "draft") return "draft";
  if (program.status === "archived") return "archived";

  if (program.status === "published" || program.status === "scheduled") {
    if (todayISO < program.starts_on) return "not_started";
    if (todayISO > program.ends_on) return "ended";
    return "active";
  }

  return "ended";
}

/**
 * Whole-day count from todayISO until endsOn. Negative if endsOn has passed.
 * Same day → 0.
 */
export function daysRemaining(endsOn: string, todayISO: string): number {
  const end = new Date(endsOn + "T00:00:00");
  const today = new Date(todayISO + "T00:00:00");
  return Math.round((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * "5/12 – 6/8" — short MM/DD range, no padding, en dash separator.
 */
export function formatDateRange(startsOn: string, endsOn: string): string {
  return `${formatShort(startsOn)} – ${formatShort(endsOn)}`;
}

/**
 * "5/12" from "2026-05-12".
 */
export function formatShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}

/**
 * Human-readable copy for a lifecycle pill.
 */
export function lifecyclePillLabel(l: ProgramLifecycle): string {
  switch (l) {
    case "not_started": return "Not started";
    case "active": return "Active";
    case "ended": return "Ended";
    case "draft": return "Draft";
    case "archived": return "Archived";
  }
}
