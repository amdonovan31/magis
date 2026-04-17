"use client";

import { useMemo, useState } from "react";
import TimeRangeSelector, { type TimeRange } from "./TimeRangeSelector";
import CoachVolumeSummary from "@/components/volume/CoachVolumeSummary";
import BodyHeatMap from "@/components/volume/BodyHeatMap";
import type { VolumeDataPoint } from "@/types/app.types";

const WEEKS_MAP: Record<TimeRange, number> = { "1w": 1, "4w": 4, "12w": 12 };

interface VolumeWithRangeProps {
  volumeData: VolumeDataPoint[];
  unit?: "kg" | "lbs";
}

export default function VolumeWithRange({ volumeData, unit = "lbs" }: VolumeWithRangeProps) {
  const [range, setRange] = useState<TimeRange>("4w");

  const filtered = useMemo(() => {
    const weeks = WEEKS_MAP[range];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);
    const cutoffIso = cutoff.toISOString().split("T")[0];
    return volumeData.filter((d) => d.periodStart >= cutoffIso);
  }, [volumeData, range]);

  const volumeByMuscle = useMemo(() => {
    const result: Record<string, number> = {};
    for (const d of filtered) {
      result[d.muscleGroup] = (result[d.muscleGroup] ?? 0) + d.totalVolume;
    }
    return result;
  }, [filtered]);

  return (
    <div className="flex flex-col gap-3">
      <TimeRangeSelector value={range} onChange={setRange} />
      <BodyHeatMap volumeByMuscle={volumeByMuscle} unit={unit} />
      <CoachVolumeSummary volumeData={filtered} unit={unit} />
    </div>
  );
}
