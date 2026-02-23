import { getTodayWorkout } from "@/lib/queries/session.queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TodayWorkoutCard from "@/components/workout/TodayWorkoutCard";
import { formatDate } from "@/lib/utils/date";
import type { Profile } from "@/types/app.types";

export default async function ClientHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const profile = rawProfile as Pick<Profile, "full_name"> | null;
  const todayWorkout = await getTodayWorkout();

  return (
    <div className="flex flex-col gap-6 px-4 pt-6">
      {/* Header */}
      <div>
        <p className="text-sm text-primary/60">{formatDate(new Date())}</p>
        <h1 className="text-2xl font-bold text-primary">
          Hi, {profile?.full_name?.split(" ")[0] ?? "there"}!
        </h1>
      </div>

      {/* Today's workout card */}
      <TodayWorkoutCard todayWorkout={todayWorkout} />

      {/* Quick links */}
      {todayWorkout && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
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
  );
}
