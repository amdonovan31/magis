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

  const activeProgram =
    programs?.find((p) => p.is_active && p.status === "published") ??
    programs?.find((p) => p.is_active);
  let programWeekInfo: { currentWeek: number; totalWeeks: number; completedSessions: number; totalSessions: number } | null = null;

  if (activeProgram) {
    const [{ data: templateWeeks }, { count: totalScheduled }, { count: completedScheduled }] = await Promise.all([
      supabase
        .from("workout_templates")
        .select("week_number")
        .eq("program_id", activeProgram.id),
      supabase
        .from("scheduled_workouts")
        .select("*", { count: "exact", head: true })
        .eq("program_id", activeProgram.id)
        .eq("client_id", id),
      supabase
        .from("scheduled_workouts")
        .select("*", { count: "exact", head: true })
        .eq("program_id", activeProgram.id)
        .eq("client_id", id)
        .eq("status", "completed"),
    ]);

    const distinctWeeks = new Set((templateWeeks ?? []).map((t) => t.week_number ?? 1));
    const totalWeeks = distinctWeeks.size || 1;

    let currentWeek = 1;
    if (activeProgram.starts_on) {
      const startDate = new Date(activeProgram.starts_on + "T00:00:00");
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      currentWeek = Math.max(1, Math.min(totalWeeks, Math.floor(daysDiff / 7) + 1));
    }

    programWeekInfo = {
      currentWeek,
      totalWeeks,
      completedSessions: completedScheduled ?? 0,
      totalSessions: totalScheduled ?? 0,
    };
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
      <div className="flex flex-col gap-4 px-4 pt-4 pb-24">
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
            </div>
          </div>
        </Card>

        {/* 1b. Active Program */}
        {activeProgram && programWeekInfo ? (
          <Link href={`/programs/${activeProgram.id}/edit`}>
            <Card className="active:scale-[0.98] transition-transform border border-accent/20">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-accent/70">
                    Active Program
                  </p>
                  <p className="font-semibold text-primary mt-0.5 truncate">
                    {activeProgram.title}
                  </p>
                  <p className="text-xs text-primary/50 mt-0.5">
                    Week {programWeekInfo.currentWeek} of {programWeekInfo.totalWeeks}
                    {" \u00B7 "}
                    {programWeekInfo.completedSessions}/{programWeekInfo.totalSessions} sessions
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                  <span className="text-sm font-semibold text-accent">
                    {programWeekInfo.totalSessions > 0
                      ? Math.round((programWeekInfo.completedSessions / programWeekInfo.totalSessions) * 100)
                      : 0}%
                  </span>
                  <span className="text-primary/30 text-lg">&rsaquo;</span>
                </div>
              </div>
              <div className="mt-2.5 h-1.5 rounded-full bg-primary/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{
                    width: `${programWeekInfo.totalSessions > 0
                      ? Math.round((programWeekInfo.completedSessions / programWeekInfo.totalSessions) * 100)
                      : 0}%`,
                  }}
                />
              </div>
            </Card>
          </Link>
        ) : (
          <Link href={`/clients/${id}/generate`}>
            <Card className="active:scale-[0.98] transition-transform border border-dashed border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-primary/60">No active program</p>
                  <p className="text-xs text-primary/40 mt-0.5">
                    Tap to design a program for this client
                  </p>
                </div>
                <span className="text-primary/30 text-lg">+</span>
              </div>
            </Card>
          </Link>
        )}

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

      </div>
    </>
  );
}
