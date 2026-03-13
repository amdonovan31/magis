import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getScheduledWorkouts } from "@/lib/queries/calendar.queries";
import CalendarClient from "@/components/calendar/CalendarClient";

/**
 * Returns the Monday and Sunday bounding the current week.
 */
function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return { start: fmt(mon), end: fmt(sun) };
}

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { start, end } = getCurrentWeekRange();
  const workouts = await getScheduledWorkouts(start, end);

  return (
    <div className="flex flex-col gap-0 pb-8">
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-heading text-2xl font-bold text-primary">
          My Schedule
        </h1>
      </div>
      <CalendarClient workouts={workouts} weekStart={start} />
    </div>
  );
}
