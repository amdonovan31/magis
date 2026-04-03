import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils/date";
import IntakeReadOnly from "@/components/intake/IntakeReadOnly";
import SendIntakeRequestButton from "@/components/intake/SendIntakeRequestButton";
import ClientNotes from "@/components/notes/ClientNotes";
import { getClientNotes } from "@/lib/queries/notes.queries";
import { recordClientView } from "@/lib/actions/notes.actions";
import { getAllPRs } from "@/lib/queries/pr.queries";
import { getMeasurements } from "@/lib/queries/measurements.queries";
import { getWeeklyVolume } from "@/lib/queries/volume.queries";
import { getStreakData } from "@/lib/queries/streaks.queries";
import CoachPRSummary from "@/components/pr/CoachPRSummary";
import CoachMeasurementsSummary from "@/components/measurements/CoachMeasurementsSummary";
import WeightSection from "@/components/measurements/WeightSection";
import CoachVolumeSummary from "@/components/volume/CoachVolumeSummary";
import StreakCard from "@/components/streaks/StreakCard";
import StreakBadges from "@/components/streaks/StreakBadges";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Verify this client belongs to the coach
  const { data: relationship } = await supabase
    .from("coach_client_relationships")
    .select("client_id")
    .eq("coach_id", user.id)
    .eq("client_id", id)
    .maybeSingle();

  if (!relationship) notFound();

  // Fetch all client data in parallel (auth check above guarantees access)
  const [
    { data: profile },
    { data: programs },
    { data: intake },
    { data: sessions },
    notes,
    prs,
    measurements,
    weightMeasurements,
    volumeData,
    streakData,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single(),
    supabase
      .from("programs")
      .select("*")
      .eq("client_id", id)
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("client_intake")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("*, workout_template:workout_templates(title)")
      .eq("client_id", id)
      .order("started_at", { ascending: false })
      .limit(10),
    getClientNotes(id),
    getAllPRs(id),
    getMeasurements(id),
    getMeasurements(id, "weight", 200),
    getWeeklyVolume(id, undefined, 8),
    getStreakData(id),
  ]);

  if (!profile) notFound();

  // Record that the coach viewed this client (for unread indicator)
  recordClientView(id);

  return (
    <>
      <TopBar
        title={profile.full_name ?? "Client"}
        left={
          <Link href="/clients" className="text-sm text-primary/60 hover:text-primary">
            ← Back
          </Link>
        }
      />
      <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
        {/* Profile Header */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {profile.full_name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="text-lg font-semibold text-primary">
                {profile.full_name ?? "Unnamed Client"}
              </p>
              <p className="text-sm text-primary/50">Client</p>
            </div>
          </div>
        </Card>

        {/* Consistency */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Consistency
        </h3>
        <StreakCard streakData={streakData} />
        <StreakBadges longestStreak={streakData.longestStreak} />

        {/* Design Program CTA */}
        <Link
          href={`/clients/${id}/generate`}
          className="flex items-center justify-center rounded-xl bg-accent py-3.5 text-sm font-semibold uppercase tracking-widest text-accent-light transition-opacity active:opacity-80"
        >
          Design Program
        </Link>

        {/* Notes & Messages */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Notes &amp; Messages
        </h3>
        <ClientNotes clientId={id} coachId={user.id} initialNotes={notes} />

        {/* Intake */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Intake
        </h3>
        {intake ? (
          <IntakeReadOnly intake={intake} />
        ) : profile.intake_requested ? (
          <p className="text-sm text-primary/60 italic">
            Intake request sent — waiting for client to complete.
          </p>
        ) : (
          <SendIntakeRequestButton clientId={id} />
        )}

        {/* Programs */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Programs
        </h3>
        {!programs?.length ? (
          <p className="text-sm text-primary/40 italic">No programs assigned.</p>
        ) : (
          programs.map((program) => (
            <Link key={program.id} href={`/programs/${program.id}`}>
              <Card className="active:scale-[0.98] transition-transform">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-primary">{program.title}</p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={program.status === "published" ? "success" : "warning"}>
                      {program.status === "published" ? "Published" : "Draft"}
                    </Badge>
                    {program.is_active && (
                      <Badge variant="success">Active</Badge>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}

        {/* Personal Records */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Personal Records
        </h3>
        <CoachPRSummary prs={prs} />

        {/* Weight Trend */}
        {weightMeasurements.length > 0 && (
          <>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
              Weight Trend
            </h3>
            <Card>
              <WeightSection
                measurements={weightMeasurements}
                unit={(profile as Record<string, unknown>).preferred_unit as string ?? "lbs"}
                showTrend
              />
            </Card>
          </>
        )}

        {/* Body Measurements */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Body Measurements
        </h3>
        <CoachMeasurementsSummary measurements={measurements} />

        {/* Training Volume */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Training Volume
        </h3>
        <CoachVolumeSummary volumeData={volumeData} />

        {/* Recent Sessions */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Recent Sessions
        </h3>
        {!sessions?.length ? (
          <p className="text-sm text-primary/40 italic">No sessions yet.</p>
        ) : (
          sessions.map((session) => {
            const template = session.workout_template as { title: string } | null;
            return (
              <Link key={session.id} href={`/clients/${id}/sessions/${session.id}`}>
                <Card className="active:scale-[0.98] transition-transform">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-primary">
                        {template?.title ?? "Workout"}
                      </p>
                      {session.started_at && (
                        <p className="text-xs text-primary/40">
                          {formatRelativeTime(session.started_at)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(session as unknown as { skipped_exercises?: string[] }).skipped_exercises?.length ? (
                        <span className="text-[10px] text-primary/40">
                          {(session as unknown as { skipped_exercises: string[] }).skipped_exercises.length} skipped
                        </span>
                      ) : null}
                      <Badge
                        variant={
                          session.status === "completed"
                            ? "success"
                            : session.status === "skipped"
                              ? "default"
                              : "accent"
                        }
                      >
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
