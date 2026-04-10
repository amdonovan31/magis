import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getScheduledWorkouts } from "@/lib/queries/calendar.queries";
import { getTodayISO, getTodayDayOfWeek } from "@/lib/utils/date";
import CalendarClient from "@/components/calendar/CalendarClient";

/**
 * Returns the Monday and Sunday bounding the current week,
 * using the timezone-aware date utilities.
 */
function getCurrentWeekRange(): { start: string; end: string } {
  const today = getTodayISO();
  const dow = getTodayDayOfWeek(); // 0=Sun
  const diffToMon = dow === 0 ? -6 : 1 - dow;

  const todayDate = new Date(today + "T12:00:00"); // noon avoids DST edge
  const mon = new Date(todayDate);
  mon.setDate(todayDate.getDate() + diffToMon);
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
