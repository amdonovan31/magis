"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Sparkline from "@/components/pr/Sparkline";
import Spinner from "@/components/ui/Spinner";
import VolumeBarChart from "@/components/volume/VolumeBarChart";
import {
  fetchWeeklyVolume,
  fetchMonthlyVolume,
} from "@/lib/actions/volume.actions";
import { cn } from "@/lib/utils/cn";
import type { VolumeDataPoint } from "@/types/app.types";
import { MUSCLE_GROUP_COLORS } from "@/types/app.types";

interface VolumeChartsProps {
  initialData: VolumeDataPoint[];
}

interface MuscleGroupSummary {
  muscleGroup: string;
  thisWeekVolume: number;
  lastWeekVolume: number;
  sparklineValues: number[];
  thisWeekSets: number;
}

function buildSummaries(data: VolumeDataPoint[]): MuscleGroupSummary[] {
  // Group by muscle group, then by period
  const byMuscle = new Map<string, Map<string, { volume: number; sets: number }>>();

  for (const d of data) {
    let periods = byMuscle.get(d.muscleGroup);
    if (!periods) {
      periods = new Map();
      byMuscle.set(d.muscleGroup, periods);
    }
    periods.set(d.periodStart, {
      volume: d.totalVolume,
      sets: d.setCount,
    });
  }

  const summaries: MuscleGroupSummary[] = [];

  byMuscle.forEach((periods, muscleGroup) => {
    const sortedPeriods = Array.from(periods.entries()).sort(
      ([a], [b]) => a.localeCompare(b)
    );

    const sparklineValues = sortedPeriods.map(([, v]) => v.volume);
    const lastEntry = sortedPeriods[sortedPeriods.length - 1];
    const prevEntry =
      sortedPeriods.length >= 2
        ? sortedPeriods[sortedPeriods.length - 2]
        : null;

    summaries.push({
      muscleGroup,
      thisWeekVolume: lastEntry?.[1].volume ?? 0,
      lastWeekVolume: prevEntry?.[1].volume ?? 0,
      sparklineValues: sparklineValues.slice(-8),
      thisWeekSets: lastEntry?.[1].sets ?? 0,
    });
  });

  // Sort by most volume this period, descending
  summaries.sort((a, b) => b.thisWeekVolume - a.thisWeekVolume);
  return summaries;
}

type TimeRange = "4w" | "8w" | "12w" | "6m";
type Aggregation = "weekly" | "monthly";

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: "4w", label: "4 wk" },
  { key: "8w", label: "8 wk" },
  { key: "12w", label: "12 wk" },
  { key: "6m", label: "6 mo" },
];

export default function VolumeCharts({ initialData }: VolumeChartsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("8w");
  const [aggregation, setAggregation] = useState<Aggregation>("weekly");
  const [chartData, setChartData] = useState<VolumeDataPoint[]>(initialData);
  const [loading, setLoading] = useState(false);

  // Refetch when time range or aggregation changes
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      let result: VolumeDataPoint[];

      if (aggregation === "monthly") {
        const months = timeRange === "6m" ? 6 : timeRange === "12w" ? 3 : 3;
        result = await fetchMonthlyVolume(months);
      } else {
        const weeks =
          timeRange === "4w"
            ? 4
            : timeRange === "8w"
              ? 8
              : timeRange === "12w"
                ? 12
                : 26;
        result = await fetchWeeklyVolume(weeks);
      }

      if (!cancelled) {
        setChartData(result);
        setLoading(false);
      }
    }

    // Skip fetch on initial render if we have initialData and defaults match
    if (timeRange === "8w" && aggregation === "weekly") {
      setChartData(initialData);
    } else {
      fetchData();
    }

    return () => {
      cancelled = true;
    };
  }, [timeRange, aggregation, initialData]);

  const summaries = buildSummaries(chartData);

  if (initialData.length === 0 && chartData.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <p className="text-primary/60">No volume data yet</p>
        <p className="text-sm text-primary/40 mt-1">
          Start logging workouts to see your volume trends here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Section 1: Muscle group summary cards */}
      <div className="flex flex-col gap-2">
        {summaries.map((s) => {
          const diff = s.thisWeekVolume - s.lastWeekVolume;
          const pctChange =
            s.lastWeekVolume > 0
              ? Math.round((diff / s.lastWeekVolume) * 100)
              : null;
          const increased = diff > 0;

          let changeText: string | null = null;
          if (pctChange !== null && pctChange !== 0) {
            const arrow = increased ? "\u2191" : "\u2193";
            changeText = `${arrow} ${Math.abs(pctChange)}% vs last`;
          }

          return (
            <Card
              key={s.muscleGroup}
              className={cn(increased && "border-l-2 border-l-accent")}
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-8 w-1 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      MUSCLE_GROUP_COLORS[s.muscleGroup] ?? "#A0A0A0",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary truncate">
                    {s.muscleGroup}
                  </p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <p className="text-sm text-primary/70">
                      <span className="font-semibold">
                        {s.thisWeekVolume.toLocaleString()}
                      </span>
                      <span className="text-primary/50 ml-1">kg</span>
                    </p>
                    <span className="text-xs text-primary/40">
                      {s.thisWeekSets} sets
                    </span>
                  </div>
                  {changeText && (
                    <p className="text-xs text-primary/50 mt-0.5">
                      {changeText}
                    </p>
                  )}
                </div>
                {s.sparklineValues.length >= 2 && (
                  <Sparkline values={s.sparklineValues} />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Section 2: Full chart */}
      <Card padding="sm">
        {/* Time filter + aggregation toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {TIME_RANGES.map((tr) => (
              <button
                key={tr.key}
                onClick={() => setTimeRange(tr.key)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  timeRange === tr.key
                    ? "bg-accent text-accent-light"
                    : "text-primary/50 hover:text-primary/70"
                )}
              >
                {tr.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-primary/10 overflow-hidden">
            <button
              onClick={() => setAggregation("weekly")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium transition-colors",
                aggregation === "weekly"
                  ? "bg-accent text-accent-light"
                  : "text-primary/50"
              )}
            >
              Wk
            </button>
            <button
              onClick={() => setAggregation("monthly")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium transition-colors",
                aggregation === "monthly"
                  ? "bg-accent text-accent-light"
                  : "text-primary/50"
              )}
            >
              Mo
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-primary/40 text-center py-8">
            No data for this period.
          </p>
        ) : (
          <VolumeBarChart data={chartData} periodType={aggregation} />
        )}
      </Card>
    </div>
  );
}
