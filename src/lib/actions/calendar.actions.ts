"use server";

import { getScheduledWorkouts } from "@/lib/queries/calendar.queries";
import type { ScheduledWorkoutWithDetails } from "@/lib/queries/calendar.queries";

/**
 * Fetch scheduled workouts for a given week (Mon–Sun).
 * @param weekStart - YYYY-MM-DD string for Monday of the target week
 */
export async function fetchWeekWorkouts(
  weekStart: string
): Promise<ScheduledWorkoutWithDetails[]> {
  const mon = new Date(weekStart + "T00:00:00");
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return getScheduledWorkouts(fmt(mon), fmt(sun));
}
