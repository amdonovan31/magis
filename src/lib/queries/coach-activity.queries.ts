import { createClient } from "@/lib/supabase/server";
import {
  maybeMaterializeEndOfProgramAlerts,
  maybeMaterializeClientInactiveAlerts,
} from "@/lib/actions/coach-events.actions";

/**
 * One enriched item in the coach Activity feed — the passive log of what
 * happened. Discriminated on `kind`. Action-needed items (alerts) live in
 * CoachAttentionItem / getCoachAttention instead.
 */
export type CoachActivityItem =
  | {
      kind: "workout_completed";
      id: string;
      occurredAt: string;
      clientId: string;
      clientName: string;
      sessionId: string;
      workoutTitle: string | null;
      programTitle: string | null;
      isCardio: boolean;
      setsLogged: number;
      topSet: { exerciseName: string; weight: number; reps: number } | null;
      hasPR: boolean;
    }
  | {
      kind: "client_joined";
      id: string;
      occurredAt: string;
      clientId: string;
      clientName: string;
    }
  | {
      kind: "client_left";
      id: string;
      occurredAt: string;
      clientId: string;
      clientName: string;
    }
  | {
      kind: "client_intake_completed";
      id: string;
      occurredAt: string;
      clientId: string;
      clientName: string;
    };

/**
 * One item on the coach Attention page — action-needed alerts. Discriminated
 * on `kind`.
 */
export type CoachAttentionItem =
  | {
      kind: "end_of_program_alert";
      id: string;
      occurredAt: string;
      clientId: string;
      clientName: string;
      programId: string;
      programTitle: string;
      endsOn: string;
    }
  | {
      kind: "client_inactive_alert";
      id: string;
      occurredAt: string;
      clientId: string;
      clientName: string;
      lastWorkoutAt: string | null;
    };

export interface CoachActivityFeed {
  items: CoachActivityItem[];
  sinceDays: number;
}

export interface CoachAttention {
  count: number;
  items: CoachAttentionItem[];
}

/** Event types that belong on the Activity feed (the passive log). */
const ACTIVITY_EVENT_TYPES = [
  "workout_completed",
  "client_joined",
  "client_left",
  "client_intake_completed",
] as const;

/** Event types that belong on the Attention page (action-needed alerts). */
const ATTENTION_EVENT_TYPES = ["end_of_program_alert", "client_inactive_alert"] as const;

/**
 * Build the coach Activity feed — newest-first, last `sinceDays` days, scoped
 * to the coach's own clients (RLS-enforced). The feed is a passive log and
 * never materializes anything (alerts are materialized on the Attention
 * surface). workout_completed events whose session was deleted are silently
 * dropped (orphan filter).
 */
export async function getCoachActivityFeed(sinceDays = 7): Promise<CoachActivityFeed | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "coach") return null;

  const cutoff = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: events } = await supabase
    .from("coach_events")
    .select("id, client_id, event_type, payload, source_id, occurred_at")
    .eq("coach_id", user.id)
    .in("event_type", ACTIVITY_EVENT_TYPES as unknown as string[])
    .is("cleared_at", null)
    .gte("occurred_at", cutoff)
    .order("occurred_at", { ascending: false });

  const rows = events ?? [];
  if (rows.length === 0) return { items: [], sinceDays };

  // ── Batch-resolve client names ──────────────────────────────────────────
  const allClientIds = Array.from(new Set(rows.map((e) => e.client_id)));
  const { data: clientProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", allClientIds);
  const clientName = new Map(
    (clientProfiles ?? []).map((p) => [p.id, p.full_name ?? null])
  );

  // ── workout_completed enrichment ────────────────────────────────────────
  const woEvents = rows.filter((e) => e.event_type === "workout_completed");
  const sessionIds = woEvents.map((e) => e.source_id);

  const sessionsById = new Map<
    string,
    {
      workoutTitle: string | null;
      programTitle: string | null;
      isCardio: boolean;
    }
  >();
  const setsBySession = new Map<string, { count: number; topWeight: number; topReps: number; topName: string | null }>();
  const prSessions = new Set<string>();

  if (sessionIds.length > 0) {
    const [{ data: sessions }, { data: setLogs }, { data: prs }] = await Promise.all([
      supabase
        .from("workout_sessions")
        .select("id, free_workout_type, workout_template:workout_templates!workout_template_id(title, type), program:programs!program_id(title)")
        .in("id", sessionIds),
      supabase
        .from("set_logs")
        .select("session_id, weight_value, reps_completed, exercise:exercises!exercise_id(name), template_exercise:workout_template_exercises!template_exercise_id(exercise:exercises!exercise_id(name))")
        .in("session_id", sessionIds)
        .eq("is_completed", true)
        .eq("is_skipped", false),
      supabase
        .from("personal_records")
        .select("session_id")
        .in("session_id", sessionIds),
    ]);

    for (const s of sessions ?? []) {
      const tmpl = s.workout_template as { title: string | null; type: string | null } | null;
      const prog = s.program as { title: string | null } | null;
      const isCardio = tmpl?.type === "cardio" || s.free_workout_type === "cardio";
      sessionsById.set(s.id, {
        workoutTitle: tmpl?.title ?? (s.free_workout_type ? "Free workout" : null),
        programTitle: prog?.title ?? null,
        isCardio,
      });
    }

    for (const sl of setLogs ?? []) {
      const sid = sl.session_id as string;
      let agg = setsBySession.get(sid);
      if (!agg) {
        agg = { count: 0, topWeight: 0, topReps: 0, topName: null };
        setsBySession.set(sid, agg);
      }
      agg.count += 1;
      const weight = (sl.weight_value as number | null) ?? 0;
      if (weight > agg.topWeight) {
        const directEx = sl.exercise as { name: string | null } | null;
        const te = sl.template_exercise as { exercise: { name: string | null } | null } | null;
        agg.topWeight = weight;
        agg.topReps = (sl.reps_completed as number | null) ?? 0;
        agg.topName = directEx?.name ?? te?.exercise?.name ?? null;
      }
    }

    for (const pr of prs ?? []) {
      if (pr.session_id) prSessions.add(pr.session_id as string);
    }
  }

  // ── Assemble + orphan-filter ────────────────────────────────────────────
  const items: CoachActivityItem[] = [];
  for (const e of rows) {
    const payload = (e.payload ?? {}) as Record<string, unknown>;
    // Prefer the live profile name; fall back to the payload snapshot.
    const snapshotName =
      typeof payload.client_name === "string" ? payload.client_name : null;
    const base = {
      id: e.id,
      occurredAt: e.occurred_at,
      clientId: e.client_id,
      clientName: clientName.get(e.client_id) ?? snapshotName ?? "Unnamed client",
    };

    if (e.event_type === "workout_completed") {
      const session = sessionsById.get(e.source_id);
      if (!session) continue; // session deleted → orphan, drop
      const sets = setsBySession.get(e.source_id);
      items.push({
        kind: "workout_completed",
        ...base,
        sessionId: e.source_id,
        workoutTitle: session.workoutTitle,
        programTitle: session.programTitle,
        isCardio: session.isCardio,
        setsLogged: sets?.count ?? 0,
        topSet:
          sets && sets.topName
            ? { exerciseName: sets.topName, weight: sets.topWeight, reps: sets.topReps }
            : null,
        hasPR: prSessions.has(e.source_id),
      });
    } else if (e.event_type === "client_joined") {
      items.push({ kind: "client_joined", ...base });
    } else if (e.event_type === "client_left") {
      items.push({ kind: "client_left", ...base });
    } else if (e.event_type === "client_intake_completed") {
      items.push({ kind: "client_intake_completed", ...base });
    }
  }

  return { items, sinceDays };
}

/**
 * Build the coach Attention page — all open action-needed alerts
 * (end_of_program_alert + client_inactive_alert), newest-first, scoped to the
 * coach's own clients (RLS-enforced). Both alert types are derived state, so
 * they are materialized before reading. Not date-windowed: every open alert is
 * shown until cleared.
 */
export async function getCoachAttention(): Promise<CoachAttention | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "coach") return null;

  // Resolve this coach's clients to scope the materialization RPCs.
  const { data: relationships } = await supabase
    .from("coach_client_relationships")
    .select("client_id")
    .eq("coach_id", user.id);
  const clientIds = (relationships ?? []).map((r) => r.client_id);

  // Lazily materialize both alert types before reading.
  await Promise.all([
    maybeMaterializeEndOfProgramAlerts(clientIds),
    maybeMaterializeClientInactiveAlerts(clientIds),
  ]);

  const { data: events } = await supabase
    .from("coach_events")
    .select("id, client_id, event_type, payload, source_id, occurred_at")
    .eq("coach_id", user.id)
    .in("event_type", ATTENTION_EVENT_TYPES as unknown as string[])
    .is("cleared_at", null)
    .order("occurred_at", { ascending: false });

  const rows = events ?? [];
  if (rows.length === 0) return { count: 0, items: [] };

  // ── Batch-resolve client names ──────────────────────────────────────────
  const allClientIds = Array.from(new Set(rows.map((e) => e.client_id)));
  const { data: clientProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", allClientIds);
  const clientName = new Map(
    (clientProfiles ?? []).map((p) => [p.id, p.full_name ?? null])
  );

  const items: CoachAttentionItem[] = [];
  for (const e of rows) {
    const payload = (e.payload ?? {}) as Record<string, unknown>;
    const snapshotName =
      typeof payload.client_name === "string" ? payload.client_name : null;
    const base = {
      id: e.id,
      occurredAt: e.occurred_at,
      clientId: e.client_id,
      clientName: clientName.get(e.client_id) ?? snapshotName ?? "Unnamed client",
    };

    if (e.event_type === "end_of_program_alert") {
      const programTitle = typeof payload.program_title === "string" ? payload.program_title : null;
      const endsOn = typeof payload.ends_on === "string" ? payload.ends_on : null;
      if (!programTitle || !endsOn) continue; // malformed payload → drop
      items.push({
        kind: "end_of_program_alert",
        ...base,
        programId: e.source_id,
        programTitle,
        endsOn,
      });
    } else if (e.event_type === "client_inactive_alert") {
      const lastWorkoutAt =
        typeof payload.last_workout_at === "string" ? payload.last_workout_at : null;
      items.push({
        kind: "client_inactive_alert",
        ...base,
        lastWorkoutAt,
      });
    }
  }

  return { count: items.length, items };
}
