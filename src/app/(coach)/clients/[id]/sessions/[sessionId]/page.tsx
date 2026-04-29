import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils/date";

interface SessionDetailPageProps {
  params: Promise<{ id: string; sessionId: string }>;
}

export default async function CoachSessionDetailPage({ params }: SessionDetailPageProps) {
  const { id: clientId, sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify coach-client relationship
  const { data: relationship } = await supabase
    .from("coach_client_relationships")
    .select("client_id")
    .eq("coach_id", user.id)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!relationship) notFound();

  // Fetch session with exercises, set logs, and notes
  const { data: session } = await supabase
    .from("workout_sessions")
    .select(`
      *,
      workout_template:workout_templates(
        title,
        exercises:workout_template_exercises(
          id,
          position,
          prescribed_sets,
          prescribed_reps,
          prescribed_weight,
          exercise:exercises(name, muscle_group)
        )
      ),
      set_logs(*),
      session_exercise_notes(*),
      session_extra_work(*)
    `)
    .eq("id", sessionId)
    .eq("client_id", clientId)
    .single();

  if (!session) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const template = session.workout_template as any;
  const exercises = (template?.exercises ?? []).sort(
    (a: { position: number }, b: { position: number }) => a.position - b.position
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setLogs = (session.set_logs ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notes = (session.session_exercise_notes ?? []) as any[];

  const notesByExercise = new Map(
    notes.filter((n: { content: string | null }) => n.content?.trim()).map((n: { template_exercise_id: string; content: string }) => [n.template_exercise_id, n.content])
  );

  // Group extra work by group_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extraWorkRaw = (session.session_extra_work ?? []) as any[];
  const extraWorkGroups = new Map<string, { name: string; sets: typeof extraWorkRaw }>();
  for (const row of extraWorkRaw) {
    if (!extraWorkGroups.has(row.group_id)) {
      extraWorkGroups.set(row.group_id, { name: row.exercise_name, sets: [] });
    }
    extraWorkGroups.get(row.group_id)!.sets.push(row);
  }
  // Sort sets within each group
  Array.from(extraWorkGroups.values()).forEach((group) => {
    group.sets.sort((a: { set_number: number }, b: { set_number: number }) => a.set_number - b.set_number);
  });

  const durationMin = session.duration_seconds
    ? Math.round(session.duration_seconds / 60)
    : null;

  return (
    <>
      <TopBar
        title={template?.title ?? "Session"}
        left={
          <Link href={`/clients/${clientId}`} className="text-sm text-primary/60 hover:text-primary">
            ← Back
          </Link>
        }
      />
      <div className="flex flex-col gap-4 px-4 pt-4 pb-24">
        {/* Session header */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary">
                {template?.title ?? "Workout"}
              </h2>
              {session.started_at && (
                <p className="text-xs text-primary/40">
                  {formatRelativeTime(session.started_at)}
                  {durationMin !== null && ` · ${durationMin} min`}
                </p>
              )}
            </div>
            <Badge
              variant={session.status === "completed" ? "success" : "default"}
            >
              {session.status}
            </Badge>
          </div>
        </Card>

        {/* Exercises with set logs and notes */}
        {exercises.map((te: {
          id: string;
          exercise: { name: string; muscle_group: string } | null;
          prescribed_sets: number | null;
          prescribed_reps: string | null;
          prescribed_weight: string | null;
        }) => {
          const exerciseLogs = setLogs
            .filter((l: { template_exercise_id: string }) => l.template_exercise_id === te.id)
            .sort((a: { set_number: number }, b: { set_number: number }) => a.set_number - b.set_number);
          const note = notesByExercise.get(te.id);

          return (
            <Card key={te.id}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-primary">
                    {te.exercise?.name ?? "Unknown"}
                  </h3>
                  {te.exercise?.muscle_group && (
                    <span className="rounded-full bg-surface border border-primary/5 px-2.5 py-0.5 text-xs text-primary/50">
                      {te.exercise.muscle_group}
                    </span>
                  )}
                </div>

                {/* Prescription */}
                <p className="text-xs text-primary/40">
                  Prescribed: {te.prescribed_sets ?? "–"}×{te.prescribed_reps ?? "–"}
                  {te.prescribed_weight ? ` @ ${te.prescribed_weight}` : ""}
                </p>

                {/* Set logs table */}
                {exerciseLogs.length > 0 ? (
                  <div className="mt-1">
                    <div className="grid grid-cols-4 gap-2 text-[10px] font-semibold uppercase tracking-wider text-primary/30 pb-1">
                      <span>Set</span>
                      <span>Reps</span>
                      <span>Weight</span>
                      <span>RPE</span>
                    </div>
                    {exerciseLogs.map((log: {
                      id: string;
                      set_number: number;
                      reps_completed: number | null;
                      weight_used: string | null;
                      weight_value: number | null;
                      weight_unit: string | null;
                      rpe: number | null;
                      is_skipped: boolean;
                    }) => log.is_skipped ? (
                      <div key={log.id} className="grid grid-cols-4 gap-2 text-sm py-0.5">
                        <span className="text-primary/30">{log.set_number}</span>
                        <span className="col-span-3 text-xs text-amber-600 italic">Skipped</span>
                      </div>
                    ) : (
                      <div key={log.id} className="grid grid-cols-4 gap-2 text-sm text-primary py-0.5">
                        <span>{log.set_number}</span>
                        <span>{log.reps_completed ?? "–"}</span>
                        <span>
                          {log.weight_value != null
                            ? `${log.weight_value}${log.weight_unit ?? ""}`
                            : log.weight_used ?? "–"}
                        </span>
                        <span className="text-primary/50">{log.rpe ?? "–"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-primary/30 italic">No sets logged</p>
                )}

                {/* Client note */}
                {note && (
                  <div className="mt-1 rounded-lg bg-primary/5 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/40 mb-0.5">
                      Client note:
                    </p>
                    <p className="text-xs text-primary/70 italic">{note}</p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {/* Extra work section — only rendered if extra work exists */}
        {extraWorkGroups.size > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-primary/50">
              Extra Work
            </h3>
            {Array.from(extraWorkGroups.entries()).map(([groupId, group]) => (
              <Card key={groupId}>
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold text-primary">
                    {group.name}
                  </h3>
                  <div className="mt-1">
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold uppercase tracking-wider text-primary/30 pb-1">
                      <span>Set</span>
                      <span>Reps</span>
                      <span>Weight</span>
                    </div>
                    {group.sets.map((row: {
                      id: string;
                      set_number: number;
                      reps_completed: number | null;
                      weight_value: number | null;
                      weight_unit: string | null;
                    }) => (
                      <div key={row.id} className="grid grid-cols-3 gap-2 text-sm text-primary py-0.5">
                        <span>{row.set_number}</span>
                        <span>{row.reps_completed ?? "–"}</span>
                        <span>
                          {row.weight_value != null
                            ? `${row.weight_value}${row.weight_unit ? ` ${row.weight_unit}` : ""}`
                            : "–"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
    </>
  );
}
