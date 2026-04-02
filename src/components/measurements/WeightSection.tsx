"use client";

import { useState, useMemo } from "react";
import WeightChart from "./WeightChart";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import type { BodyMeasurement } from "@/types/app.types";

type Timeframe = "30d" | "90d" | "all";

interface WeightSectionProps {
  measurements: BodyMeasurement[];
  unit: string;
  /** Show trend indicators (current weight, 30-day change). Used on coach view. */
  showTrend?: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function WeightSection({
  measurements,
  unit,
  showTrend = false,
}: WeightSectionProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");

  const filtered = useMemo(() => {
    if (timeframe === "all") return measurements;
    const days = timeframe === "30d" ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return measurements.filter((m) => new Date(m.measured_at) >= cutoff);
  }, [measurements, timeframe]);

  // Trend calculations (from full dataset, not filtered)
  const current = measurements.length > 0 ? measurements[0] : null;
  const thirtyDaysAgo = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return measurements.find((m) => new Date(m.measured_at) <= cutoff) ?? null;
  }, [measurements]);

  const delta = current && thirtyDaysAgo ? current.value - thirtyDaysAgo.value : null;

  const timeframes: { key: Timeframe; label: string }[] = [
    { key: "30d", label: "30d" },
    { key: "90d", label: "90d" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Trend indicators (coach view) */}
      {showTrend && current && (
        <div className="flex gap-3">
          <Card className="flex-1 text-center">
            <p className="text-xs text-primary/50">Current</p>
            <p className="text-lg font-bold text-primary">
              {Number.isInteger(current.value) ? current.value : current.value.toFixed(1)} {unit}
            </p>
          </Card>
          <Card className="flex-1 text-center">
            <p className="text-xs text-primary/50">30-day change</p>
            {delta !== null ? (
              <p className={cn(
                "text-lg font-bold",
                delta > 0 ? "text-red-600" : delta < 0 ? "text-green-600" : "text-primary"
              )}>
                {delta > 0 ? "\u2191" : delta < 0 ? "\u2193" : "\u2014"}{" "}
                {Math.abs(delta).toFixed(1)} {unit}
              </p>
            ) : (
              <p className="text-lg font-bold text-primary/30">&mdash;</p>
            )}
          </Card>
        </div>
      )}

      {/* Timeframe toggle */}
      <div className="flex gap-1">
        {timeframes.map((tf) => (
          <button
            key={tf.key}
            onClick={() => setTimeframe(tf.key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              timeframe === tf.key
                ? "bg-primary text-white"
                : "bg-primary/5 text-primary/50 hover:bg-primary/10"
            )}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <WeightChart data={filtered} unit={unit} />

      {/* Recent log list */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-primary/40">
            Recent Logs
          </p>
          {filtered.slice(0, 10).map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between py-1.5 border-b border-primary/5 last:border-0"
            >
              <span className="text-sm text-primary/60">{formatDate(m.measured_at)}</span>
              <span className="text-sm font-medium text-primary">
                {Number.isInteger(m.value) ? m.value : m.value.toFixed(1)} {unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
