import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils/date";
import ClientNotes from "@/components/notes/ClientNotes";
import { getClientNotes } from "@/lib/queries/notes.queries";
import { recordClientView } from "@/lib/actions/notes.actions";
import { getAllPRs } from "@/lib/queries/pr.queries";
import { getWeeklyVolume } from "@/lib/queries/volume.queries";
import { getStreakData } from "@/lib/queries/streaks.queries";
import { getScheduledWorkoutsForClient } from "@/lib/queries/calendar.queries";
import ActivityCalendar from "@/components/coach/ActivityCalendar";
import VolumeWithRange from "@/components/coach/VolumeWithRange";

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

  const { data: relationship } = await supabase
    .from("coach_client_relationships")
    .select("client_id")
    .eq("coach_id", user.id)
    .eq("client_id", id)
    .maybeSingle();

  if (!relationship) notFound();

  const today = new Date();
  const calStart = new Date(today);
  calStart.setDate(calStart.getDate() - 12 * 7);
  const calEnd = new Date(today);
  calEnd.setDate(calEnd.getDate() + 4 * 7);
  const calendarStart = calStart.toISOString().split("T")[0];
  const calendarEnd = calEnd.toISOString().split("T")[0];

  const [
    { data: profile },
    { data: programs },
    { data: sessions },
    notes,
    prs,
    volumeResult,
    streakData,
    scheduledWorkouts,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase
      .from("programs")
      .select("*")
      .eq("client_id", id)
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("workout_sessions")
      .select("*, workout_template:workout_templates(title)")
      .eq("client_id", id)
      .order("started_at", { ascending: false })
      .limit(20),
    getClientNotes(id),
    getAllPRs(id),
    getWeeklyVolume(id, undefined, 12),
    getStreakData(id),
    getScheduledWorkoutsForClient(id, calendarStart, calendarEnd),
  ]);

  if (!profile) notFound();

  recordClientView(id);

  // ── Derived data ──────────────────────────────────────────

  const lastSession = sessions?.[0];
  const lastActiveText = lastSession?.started_at
    ? formatRelativeTime(lastSession.started_at)
    : "No sessions yet";

  // Adherence: completed vs total scheduled workouts for active program
  const activeProgram = programs?.find((p) => p.is_active);
  let adherenceText: string | null = null;
  if (activeProgram) {
    const { count: totalScheduled } = await supabase
      .from("scheduled_workouts")
      .select("*", { count: "exact", head: true })
      .eq("client_id", id)
      .eq("program_id", activeProgram.id);

    const { count: completedScheduled } = await supabase
      .from("scheduled_workouts")
      .select("*", { count: "exact", head: true })
      .eq("client_id", id)
      .eq("program_id", activeProgram.id)
      .eq("status", "completed");

    if (totalScheduled && totalScheduled > 0) {
      const pct = Math.round(((completedScheduled ?? 0) / totalScheduled) * 100);
      adherenceText = `${pct}% adherence · ${completedScheduled ?? 0}/${totalScheduled} sessions`;
    }
  }

  // Recent PRs (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentPRs = prs.filter(
    (pr) => new Date(pr.achievedAt) >= sevenDaysAgo
  );

  // Activity calendar data
  const calendarSessions = (sessions ?? [])
    .filter((s) => s.started_at)
    .map((s) => ({
      date: new Date(s.started_at!).toISOString().split("T")[0],
      status: (s.status === "completed" ? "completed" : "missed") as
        | "completed"
        | "missed"
        | "skipped",
    }));

  const completedDates = new Set(calendarSessions.map((s) => s.date));
  const missedScheduled = scheduledWorkouts
    .filter(
      (sw) =>
        (sw.status === "missed" || sw.status === "skipped") &&
        !completedDates.has(sw.scheduled_date)
    )
    .map((sw) => ({
      date: sw.scheduled_date,
      status: "missed" as const,
    }));

  const allCalendarSessions = [...calendarSessions, ...missedScheduled];
  const scheduledOnlyDates = scheduledWorkouts
    .filter(
      (sw) =>
        sw.status === "scheduled" && !completedDates.has(sw.scheduled_date)
    )
    .map((sw) => sw.scheduled_date);

  // Merged session list: completed sessions + missed scheduled workouts
  type SessionEntry = {
    type: "session" | "missed";
    id: string;
    title: string;
    date: string;
    status: string;
    duration?: number | null;
    skippedCount?: number;
  };

  const sessionEntries: SessionEntry[] = [];

  (sessions ?? []).forEach((s) => {
    const template = s.workout_template as { title: string } | null;
    sessionEntries.push({
      type: "session",
      id: s.id,
      title: template?.title ?? "Workout",
      date: s.started_at,
      status: s.status ?? "completed",
      duration: s.duration_seconds ? Math.round(s.duration_seconds / 60) : null,
      skippedCount:
        (s as unknown as { skipped_exercises?: string[] }).skipped_exercises
          ?.length ?? 0,
    });
  });

  scheduledWorkouts
    .filter(
      (sw) =>
        (sw.status === "missed" || sw.status === "skipped") &&
        sw.scheduled_date < calendarEnd
    )
    .forEach((sw) => {
      if (!sessions?.some((s) => s.id === sw.session_id)) {
        sessionEntries.push({
          type: "missed",
          id: sw.id,
          title: sw.template.title,
          date: sw.scheduled_date,
          status: "missed",
        });
      }
    });

  sessionEntries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const displayedEntries = sessionEntries.slice(0, 15);

  return (
    <>
      <TopBar
        title={profile.full_name ?? "Client"}
        left={
          <Link
            href="/clients"
            className="text-sm text-primary/60 hover:text-primary"
          >
            &larr; Back
          </Link>
        }
      />
      <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
        {/* 1. Header */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {profile.full_name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-primary">
                {profile.full_name ?? "Unnamed Client"}
              </p>
              <p className="text-xs text-primary/40">{lastActiveText}</p>
              {adherenceText && (
                <p className="text-xs text-primary/50 mt-0.5">
                  {adherenceText}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* 2. PR Highlights (conditional) */}
        {recentPRs.length > 0 && (
          <Card className="bg-accent/5 border border-accent/20">
            <div className="flex items-center gap-2">
              <span className="text-lg">&#x1F3C6;</span>
              <p className="text-sm text-primary">
                <span className="font-semibold">
                  {recentPRs.length} new PR{recentPRs.length > 1 ? "s" : ""}{" "}
                  this week
                </span>
                <span className="text-primary/50">
                  {" "}
                  &mdash;{" "}
                  {recentPRs
                    .slice(0, 3)
                    .map((pr) => pr.exerciseName)
                    .join(", ")}
                </span>
              </p>
            </div>
          </Card>
        )}

        {/* 3. Training Sessions */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Training Sessions
        </h3>
        {displayedEntries.length === 0 ? (
          <p className="text-sm text-primary/40 italic">No sessions yet.</p>
        ) : (
          displayedEntries.map((entry) =>
            entry.type === "session" ? (
              <Link
                key={entry.id}
                href={`/clients/${id}/sessions/${entry.id}`}
              >
                <Card className="active:scale-[0.98] transition-transform">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-primary truncate">
                        {entry.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-primary/40">
                          {formatRelativeTime(entry.date)}
                        </span>
                        {entry.duration && (
                          <span className="text-xs text-primary/30">
                            {entry.duration}m
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {entry.skippedCount ? (
                        <span className="text-[10px] text-primary/40">
                          {entry.skippedCount} skipped
                        </span>
                      ) : null}
                      <Badge
                        variant={
                          entry.status === "completed"
                            ? "success"
                            : entry.status === "skipped"
                              ? "default"
                              : "accent"
                        }
                      >
                        {entry.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            ) : (
              <Card key={entry.id} className="opacity-60">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-primary truncate">
                      {entry.title}
                    </p>
                    <span className="text-xs text-primary/40">
                      {formatRelativeTime(entry.date)}
                    </span>
                  </div>
                  <Badge variant="default">
                    <span className="text-red-500">Missed</span>
                  </Badge>
                </div>
              </Card>
            )
          )
        )}
        {sessionEntries.length > 15 && (
          <p className="text-center text-xs text-primary/40">
            Showing 15 of {sessionEntries.length} sessions
          </p>
        )}

        {/* 4. Consistency */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Consistency
        </h3>
        <Card>
          <ActivityCalendar
            sessions={allCalendarSessions}
            scheduledDates={scheduledOnlyDates}
            currentStreak={streakData.currentStreak}
            longestStreak={streakData.longestStreak}
          />
        </Card>

        {/* 5. Training Volume */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Training Volume
        </h3>
        <VolumeWithRange volumeData={volumeResult.data} unit={volumeResult.unit} />

        {/* 6. Notes & Messages */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/50">
          Notes &amp; Messages
        </h3>
        <ClientNotes clientId={id} coachId={user.id} initialNotes={notes} />

        {/* 7. Client Profile & Intake */}
        <Link href={`/clients/${id}/profile`}>
          <Card className="active:scale-[0.98] transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-primary">
                  Client Profile &amp; Intake
                </p>
                <p className="text-xs text-primary/40 mt-0.5">
                  PAR-Q, goals, preferences, equipment
                </p>
              </div>
              <span className="text-primary/30 text-lg">&rsaquo;</span>
            </div>
          </Card>
        </Link>

        {/* 8. Design Program */}
        <Link href={`/clients/${id}/generate`}>
          <Card className="active:scale-[0.98] transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-primary">Design Program</p>
                <p className="text-xs text-primary/40 mt-0.5">
                  Generate a new AI program for this client
                </p>
              </div>
              <span className="text-primary/30 text-lg">&rsaquo;</span>
            </div>
          </Card>
        </Link>
      </div>
    </>
  );
}
