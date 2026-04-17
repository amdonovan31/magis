"use server";

import {
  getWeeklyVolume as _getWeeklyVolume,
  getMonthlyVolume as _getMonthlyVolume,
} from "@/lib/queries/volume.queries";
import type { VolumeResult } from "@/types/app.types";

export async function fetchWeeklyVolume(
  weeksBack?: number,
  muscleGroup?: string
): Promise<VolumeResult> {
  return _getWeeklyVolume(undefined, muscleGroup, weeksBack);
}

export async function fetchMonthlyVolume(
  monthsBack?: number,
  muscleGroup?: string
): Promise<VolumeResult> {
  return _getMonthlyVolume(undefined, muscleGroup, monthsBack);
}
