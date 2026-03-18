"use server";

import { getPRHistory as _getPRHistory } from "@/lib/queries/pr.queries";
import type { PRHistoryPoint } from "@/types/app.types";

export async function fetchPRHistory(
  exerciseId: string
): Promise<PRHistoryPoint[]> {
  return _getPRHistory(exerciseId);
}
