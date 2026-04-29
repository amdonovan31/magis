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
import { formatDate } from "@/lib/utils/date";
import type { Profile } from "@/types/app.types";

export default async function ClientHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: rawProfile }, { count: intakeCount }, todayWorkout, streakData, { count: programCount }, todayWeight, { data: activeFreeSession }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, intake_requested")
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
      .select("id", { count: "exact", head: true })
      .eq("client_id", user.id)
      .eq("is_active", true)
      .eq("status", "published"),
    getTodayWeight(),
    supabase
      .from("workout_sessions")
      .select("id")
      .eq("client_id", user.id)
      .is("workout_template_id", null)
      .eq("status", "in_progress")
      .maybeSingle(),
  ]);

  const profile = rawProfile as Pick<Profile, "full_name" | "intake_requested"> | null;
  const showIntakeBanner = profile?.intake_requested && (intakeCount ?? 0) === 0;

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
      <TodayWorkoutCard todayWorkout={todayWorkout} hasProgram={(programCount ?? 0) > 0} activeFreeSessionId={activeFreeSession?.id ?? null} />

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
