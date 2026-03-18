"use server";

import { getStreakData as _getStreakData } from "@/lib/queries/streaks.queries";
import type { StreakData } from "@/types/app.types";

export async function fetchStreakData(): Promise<StreakData> {
  return _getStreakData();
}
