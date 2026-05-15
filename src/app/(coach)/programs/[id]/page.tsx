import { notFound } from "next/navigation";
import { getProgramWithTemplates } from "@/lib/queries/program.queries";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import AssignToMeButton from "@/components/coach/AssignToMeButton";
import ProgramDetailPublishBar from "@/components/coach/ProgramDetailPublishBar";
import Link from "next/link";
import { getTodayISO } from "@/lib/utils/date";
import {
  formatDateRange,
  getProgramLifecycle,
  lifecyclePillLabel,
} from "@/lib/utils/program-lifecycle";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [program, supabase] = await Promise.all([
    getProgramWithTemplates(id),
    createClient(),
  ]);

  if (!program) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: viewerProfile } = user
    ? await supabase.from("profiles").select("timezone").eq("id", user.id).single()
    : { data: null };
  const todayISO = getTodayISO(viewerProfile?.timezone);
  const lifecycle = getProgramLifecycle(program, todayISO);
  const lifecycleVariant: "success" | "warning" | "default" =
    lifecycle === "active" ? "success" : lifecycle === "draft" ? "warning" : "default";

  // For Schedule-vs-Publish branching: does this client already have a
  // currently-published program (other than this one)?
  let priorPublishedExists = false;
  let priorEndsOn: string | null = null;
  if (program.client_id && program.status === "draft") {
    const { data: prior } = await supabase
      .from("programs")
      .select("ends_on")
      .eq("client_id", program.client_id)
      .eq("status", "published")
      .neq("id", program.id)
      .order("ends_on", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (prior) {
      priorPublishedExists = true;
      priorEndsOn = prior.ends_on;
    }
  }

  return (
    <>
      <TopBar
        title={program.title}
        left={
          <Link href="/programs" className="text-sm text-primary/60 hover:text-primary">
            ← Back
          </Link>
        }
      />
      <div className="flex flex-col gap-4 px-4 pt-4 pb-24">
        {program.description && (
          <p className="text-sm text-primary/60">{program.description}</p>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={lifecycleVariant}>{lifecyclePillLabel(lifecycle)}</Badge>
            <ProgramDetailPublishBar
              programId={program.id}
              initialStatus={program.status}
              priorPublishedExists={priorPublishedExists}
              priorEndsOn={priorEndsOn}
              todayISO={todayISO}
            />
            {program.status !== "draft" && (
              <span className="text-xs text-primary/40">
                {formatDateRange(program.starts_on, program.ends_on)}
              </span>
            )}
          </div>
          {user && (
            <AssignToMeButton
              programId={program.id}
              coachId={user.id}
              alreadyAssigned={program.client_id === user.id}
            />
          )}
        </div>

        <Link
          href={`/programs/${id}/edit`}
          className="flex items-center justify-center rounded-xl border border-primary/20 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
        >
          Edit Program
        </Link>

        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Workout Days
        </h3>

        {program.workout_templates.length === 0 ? (
          <p className="text-sm text-primary/40 italic">No workout days added yet.</p>
        ) : (
          (() => {
            const weekMap = new Map<number, typeof program.workout_templates>();
            for (const t of program.workout_templates) {
              const wn = t.week_number ?? 1;
              if (!weekMap.has(wn)) weekMap.set(wn, []);
              weekMap.get(wn)!.push(t);
            }
            return Array.from(weekMap.entries())
              .sort(([a], [b]) => a - b)
              .map(([weekNumber, templates]) => (
                <div key={weekNumber} className="flex flex-col gap-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
                    Week {weekNumber}
                  </h4>
                  {templates.map((template) => (
                    <Card key={template.id}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-primary">{template.title}</p>
                          {template.notes && (
                            <p className="mt-1 text-sm text-primary/60">{template.notes}</p>
                          )}
                        </div>
                        {template.day_number != null && (
                          <Badge>Day {template.day_number}</Badge>
                        )}
                      </div>

                      {template.exercises.length > 0 && (
                        <div className="mt-3 flex flex-col gap-1">
                          {template.exercises.map((te) => (
                            <div
                              key={te.id}
                              className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-sm"
                            >
                              <span className="text-primary">{te.exercise.name}</span>
                              <span className="text-primary/50">
                                {te.prescribed_sets && `${te.prescribed_sets}×`}
                                {te.prescribed_reps ?? ""}
                                {te.prescribed_weight ? ` @ ${te.prescribed_weight}` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ));
          })()
        )}
      </div>
    </>
  );
}
