import { getTodayWorkout } from "@/lib/queries/session.queries";
import { getStreakData } from "@/lib/queries/streaks.queries";
import { getTodayWeight } from "@/lib/queries/measurements.queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import TodayWorkoutCard from "@/components/workout/TodayWorkoutCard";
import WeightCheckInCard from "@/components/measurements/WeightCheckInCard";
import StreakCard from "@/components/streaks/StreakCard";
import Card from "@/components/ui/Card";
import TopBar from "@/components/layout/TopBar";
import { formatDate, getTodayISO } from "@/lib/utils/date";
import {
  daysRemaining,
  getProgramLifecycle,
  type ProgramLifecycle,
} from "@/lib/utils/program-lifecycle";
import { maybePromoteScheduled } from "@/lib/actions/promotion.actions";
import type { Profile } from "@/types/app.types";

export default async function ClientHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Lazy promotion: if a scheduled program for this user has reached its
  // starts_on (in their TZ), flip it to published and archive the prior one.
  // Failures degrade gracefully so the home screen still renders.
  await maybePromoteScheduled([user.id]);

  const [
    { data: rawProfile },
    { count: intakeCount },
    todayWorkout,
    streakData,
    { data: activeProgram },
    { data: scheduledProgram },
    todayWeight,
    { data: activeFreeSession },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, intake_requested, timezone")
      .eq("id", user.id)
      .single(),
    supabase
      .from("client_intake")
      .select("id", { count: "exact", head: true })
      .eq("client_id", user.id),
    getTodayWorkout(),
    getStreakData(),
    supabase
      .from("programs")
      .select("id, status, starts_on, ends_on")
      .eq("client_id", user.id)
      .eq("is_active", true)
      .eq("status", "published")
      .maybeSingle(),
    supabase
      .from("programs")
      .select("id, starts_on")
      .eq("client_id", user.id)
      .eq("status", "scheduled")
      .order("starts_on", { ascending: true })
      .limit(1)
      .maybeSingle(),
    getTodayWeight(),
    supabase
      .from("workout_sessions")
      .select("id")
      .eq("client_id", user.id)
      .is("workout_template_id", null)
      .eq("status", "in_progress")
      .maybeSingle(),
  ]);

  const profile = rawProfile as Pick<Profile, "full_name" | "intake_requested" | "timezone"> | null;
  const showIntakeBanner = profile?.intake_requested && (intakeCount ?? 0) === 0;
  const todayISO = getTodayISO(profile?.timezone);

  let programLifecycle: ProgramLifecycle | null = null;
  let endsOn: string | null = null;
  let daysLeft = 0;
  let allCompleted = false;
  if (activeProgram) {
    programLifecycle = getProgramLifecycle(activeProgram, todayISO);
    endsOn = activeProgram.ends_on;
    daysLeft = daysRemaining(activeProgram.ends_on, todayISO);

    const { count: notCompletedCount } = await supabase
      .from("scheduled_workouts")
      .select("*", { count: "exact", head: true })
      .eq("program_id", activeProgram.id)
      .eq("client_id", user.id)
      .neq("status", "completed");
    allCompleted = (notCompletedCount ?? 0) === 0;
  }

  const canResumeWorkout = todayWorkout?.completedAt
    ? Date.now() - new Date(todayWorkout.completedAt).getTime() < 30 * 60 * 1000
    : false;

  return (
    <>
    <TopBar showLogo />
    <div className="flex flex-col gap-6 px-4 pt-4">
      {/* Header */}
      <div>
        <p className="text-sm text-primary/60">{formatDate(new Date())}</p>
        <h1 className="text-2xl font-bold text-primary">
          Hi, {profile?.full_name?.split(" ")[0] ?? "there"}!
        </h1>
      </div>

      {/* Intake banner */}
      {showIntakeBanner && (
        <Link href="/onboarding/intake">
          <Card className="border border-accent bg-accent/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-primary">Complete Your Intake Form</p>
                <p className="text-sm text-primary/60">Your coach needs this to build your program</p>
              </div>
              <span className="text-accent text-xl font-bold">&rarr;</span>
            </div>
          </Card>
        </Link>
      )}

      {/* Weight check-in */}
      <WeightCheckInCard todayEntry={todayWeight.entry} preferredUnit={todayWeight.preferredUnit} />

      {/* Today's workout card */}
      <TodayWorkoutCard
        todayWorkout={todayWorkout}
        hasProgram={!!activeProgram}
        activeFreeSessionId={activeFreeSession?.id ?? null}
        canResume={canResumeWorkout}
        programLifecycle={programLifecycle}
        endsOn={endsOn}
        daysLeft={daysLeft}
        allCompleted={allCompleted}
        scheduledProgramStartsOn={scheduledProgram?.starts_on ?? null}
      />

      {/* Streak card */}
      <StreakCard streakData={streakData} />

      {/* Quick links */}
      {todayWorkout && (
        <div className="rounded-2xl bg-surface p-4 border border-primary/10">
          <p className="text-xs font-medium uppercase tracking-wide text-primary/40 mb-3">
            Quick Actions
          </p>
          <div className="flex gap-3">
            <a
              href="/history"
              className="flex-1 rounded-xl bg-primary/5 p-3 text-center"
            >
              <p className="text-lg font-bold text-primary">📋</p>
              <p className="text-xs text-primary/60 mt-0.5">History</p>
            </a>
            <a
              href="/profile"
              className="flex-1 rounded-xl bg-primary/5 p-3 text-center"
            >
              <p className="text-lg font-bold text-primary">👤</p>
              <p className="text-xs text-primary/60 mt-0.5">Profile</p>
            </a>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
