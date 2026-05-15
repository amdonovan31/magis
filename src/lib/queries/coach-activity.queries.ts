import { createClient } from "@/lib/supabase/server";
import { maybeMaterializeEndOfProgramAlerts } from "@/lib/actions/coach-events.actions";

/**
 * One enriched item in the coach Activity feed. Discriminated on `kind`.
 */
export type CoachActivityItem =
  | {
      kind: "workout_completed";
      id: string;
      occurredAt: string;
      clientId: string;
      clientName: string;
      workoutTitle: string | null;
      programTitle: string | null;
      isCardio: boolean;
      setsLogged: number;
      topSet: { exerciseName: string; weight: number; reps: number } | null;
      hasPR: boolean;
    }
  | {
      kind: "client_comment";
      id: string;
      occurredAt: string;
      clientId: string;
      clientName: string;
      content: string;
      exerciseName: string | null;
      programTitle: string | null;
    }
  | {
      kind: "end_of_program_alert";
      id: string;
      occurredAt: string;
      clientId: string;
      clientName: string;
      programId: string;
      programTitle: string;
      endsOn: string;
    };

export interface CoachActivityFeed {
  items: CoachActivityItem[];
  sinceDays: number;
}

/**
 * Build the coach Activity feed — newest-first, last `sinceDays` days, scoped
 * to the coach's own clients (RLS-enforced). Materializes end-of-program
 * alerts first so freshly-qualifying programs appear. Events whose underlying
 * source row was deleted are silently dropped (orphan filter).
 */
export async function getCoachActivityFeed(sinceDays = 7): Promise<CoachActivityFeed | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "coach") return null;

  // Resolve this coach's clients.
  const { data: relationships } = await supabase
    .from("coach_client_relationships")
    .select("client_id")
    .eq("coach_id", user.id);
  const clientIds = (relationships ?? []).map((r) => r.client_id);

  // Lazily materialize end-of-program alerts before reading the feed.
  await maybeMaterializeEndOfProgramAlerts(clientIds);

  const cutoff = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: events } = await supabase
    .from("coach_events")
    .select("id, client_id, event_type, payload, source_id, occurred_at")
    .eq("coach_id", user.id)
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
    (clientProfiles ?? []).map((p) => [p.id, p.full_name ?? "Unnamed client"])
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

  // ── client_comment enrichment ───────────────────────────────────────────
  const commentEvents = rows.filter((e) => e.event_type === "client_comment");
  const noteIds = commentEvents.map((e) => e.source_id);
  const noteExists = new Set<string>();
  const noteCtx = new Map<string, { sessionId: string | null; templateExerciseId: string | null }>();

  if (noteIds.length > 0) {
    const { data: notes } = await supabase
      .from("session_exercise_notes")
      .select("id, session_id, template_exercise_id")
      .in("id", noteIds);
    for (const n of notes ?? []) {
      noteExists.add(n.id);
      noteCtx.set(n.id, {
        sessionId: (n.session_id as string | null) ?? null,
        templateExerciseId: (n.template_exercise_id as string | null) ?? null,
      });
    }
  }

  // Resolve exercise names + program titles for comments.
  const teIds = Array.from(
    new Set(Array.from(noteCtx.values()).map((c) => c.templateExerciseId).filter((x): x is string => !!x))
  );
  const commentSessionIds = Array.from(
    new Set(Array.from(noteCtx.values()).map((c) => c.sessionId).filter((x): x is string => !!x))
  );
  const exerciseNameByTe = new Map<string, string | null>();
  const programTitleBySession = new Map<string, string | null>();

  if (teIds.length > 0) {
    const { data: tes } = await supabase
      .from("workout_template_exercises")
      .select("id, exercise:exercises!exercise_id(name)")
      .in("id", teIds);
    for (const te of tes ?? []) {
      const ex = te.exercise as { name: string | null } | null;
      exerciseNameByTe.set(te.id, ex?.name ?? null);
    }
  }
  if (commentSessionIds.length > 0) {
    const { data: sess } = await supabase
      .from("workout_sessions")
      .select("id, program:programs!program_id(title)")
      .in("id", commentSessionIds);
    for (const s of sess ?? []) {
      const prog = s.program as { title: string | null } | null;
      programTitleBySession.set(s.id, prog?.title ?? null);
    }
  }

  // ── Assemble + orphan-filter ────────────────────────────────────────────
  const items: CoachActivityItem[] = [];
  for (const e of rows) {
    const base = {
      id: e.id,
      occurredAt: e.occurred_at,
      clientId: e.client_id,
      clientName: clientName.get(e.client_id) ?? "Unnamed client",
    };
    const payload = (e.payload ?? {}) as Record<string, unknown>;

    if (e.event_type === "workout_completed") {
      const session = sessionsById.get(e.source_id);
      if (!session) continue; // session deleted → orphan, drop
      const sets = setsBySession.get(e.source_id);
      items.push({
        kind: "workout_completed",
        ...base,
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
    } else if (e.event_type === "client_comment") {
      if (!noteExists.has(e.source_id)) continue; // note deleted → orphan, drop
      const content = typeof payload.content === "string" ? payload.content : "";
      if (!content) continue;
      const ctx = noteCtx.get(e.source_id);
      items.push({
        kind: "client_comment",
        ...base,
        content,
        exerciseName: ctx?.templateExerciseId
          ? exerciseNameByTe.get(ctx.templateExerciseId) ?? null
          : null,
        programTitle: ctx?.sessionId ? programTitleBySession.get(ctx.sessionId) ?? null : null,
      });
    } else if (e.event_type === "end_of_program_alert") {
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
    }
  }

  return { items, sinceDays };
}
