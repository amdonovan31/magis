"use client";

import Card from "@/components/ui/Card";
import Sparkline from "@/components/pr/Sparkline";
import type { VolumeDataPoint } from "@/types/app.types";
import { MUSCLE_GROUP_COLORS } from "@/types/app.types";

interface CoachVolumeSummaryProps {
  volumeData: VolumeDataPoint[];
}

interface MuscleGroupSummary {
  muscleGroup: string;
  thisWeekVolume: number;
  lastWeekVolume: number;
  sparklineValues: number[];
}

function buildSummaries(data: VolumeDataPoint[]): {
  totalThisWeek: number;
  totalLastWeek: number;
  topMuscleGroups: MuscleGroupSummary[];
} {
  if (data.length === 0) {
    return { totalThisWeek: 0, totalLastWeek: 0, topMuscleGroups: [] };
  }

  // Get all unique periods sorted
  const allPeriods = Array.from(new Set(data.map((d) => d.periodStart))).sort();
  const latestPeriod = allPeriods[allPeriods.length - 1];
  const prevPeriod = allPeriods.length >= 2 ? allPeriods[allPeriods.length - 2] : null;

  // Group by muscle group
  const byMuscle = new Map<string, Map<string, number>>();
  for (const d of data) {
    let periods = byMuscle.get(d.muscleGroup);
    if (!periods) {
      periods = new Map();
      byMuscle.set(d.muscleGroup, periods);
    }
    periods.set(d.periodStart, d.totalVolume);
  }

  let totalThisWeek = 0;
  let totalLastWeek = 0;

  const summaries: MuscleGroupSummary[] = [];
  byMuscle.forEach((periods, muscleGroup) => {
    const thisWeekVolume = periods.get(latestPeriod) ?? 0;
    const lastWeekVolume = prevPeriod ? (periods.get(prevPeriod) ?? 0) : 0;

    totalThisWeek += thisWeekVolume;
    totalLastWeek += lastWeekVolume;

    const sortedPeriods = Array.from(periods.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    summaries.push({
      muscleGroup,
      thisWeekVolume,
      lastWeekVolume,
      sparklineValues: sortedPeriods.slice(-8),
    });
  });

  summaries.sort((a, b) => b.thisWeekVolume - a.thisWeekVolume);

  return {
    totalThisWeek,
    totalLastWeek,
    topMuscleGroups: summaries.slice(0, 3),
  };
}

export default function CoachVolumeSummary({
  volumeData,
}: CoachVolumeSummaryProps) {
  if (volumeData.length === 0) {
    return (
      <p className="text-sm text-primary/40 italic">No volume data yet.</p>
    );
  }

  const { totalThisWeek, totalLastWeek, topMuscleGroups } =
    buildSummaries(volumeData);

  const diff = totalThisWeek - totalLastWeek;
  const pctChange =
    totalLastWeek > 0 ? Math.round((diff / totalLastWeek) * 100) : null;

  return (
    <div className="flex flex-col gap-2">
      {/* Total volume card */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-primary/50">This Week</p>
            <p className="text-lg font-semibold text-primary">
              {totalThisWeek.toLocaleString()}{" "}
              <span className="text-sm font-normal text-primary/50">kg</span>
            </p>
          </div>
          {pctChange !== null && pctChange !== 0 && (
            <p className="text-sm text-primary/50">
              {diff > 0 ? "\u2191" : "\u2193"} {Math.abs(pctChange)}% vs last
              week
            </p>
          )}
        </div>
      </Card>

      {/* Top 3 muscle groups */}
      {topMuscleGroups.map((s) => (
        <Card key={s.muscleGroup}>
          <div className="flex items-center gap-3">
            <span
              className="h-6 w-1 rounded-full flex-shrink-0"
              style={{
                backgroundColor:
                  MUSCLE_GROUP_COLORS[s.muscleGroup] ?? "#A0A0A0",
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-primary truncate">
                {s.muscleGroup}
              </p>
              <p className="text-sm text-primary/70">
                <span className="font-semibold">
                  {s.thisWeekVolume.toLocaleString()}
                </span>
                <span className="text-primary/50 ml-1">kg</span>
              </p>
            </div>
            {s.sparklineValues.length >= 2 && (
              <Sparkline values={s.sparklineValues} />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
