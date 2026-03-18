"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Sparkline from "@/components/pr/Sparkline";
import { formatDate } from "@/lib/utils/date";
import type { BodyMeasurement } from "@/types/app.types";

interface CoachMeasurementsSummaryProps {
  measurements: BodyMeasurement[];
}

function formatMetricName(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface MetricSummary {
  metricType: string;
  latest: BodyMeasurement;
  previous: BodyMeasurement | null;
  sparklineValues: number[];
}

function buildSummaries(measurements: BodyMeasurement[]): MetricSummary[] {
  const map = new Map<string, BodyMeasurement[]>();

  for (const m of measurements) {
    const existing = map.get(m.metric_type);
    if (existing) {
      existing.push(m);
    } else {
      map.set(m.metric_type, [m]);
    }
  }

  const summaries: MetricSummary[] = [];
  map.forEach((entries, metricType) => {
    const latest = entries[0];
    const previous = entries.length > 1 ? entries[1] : null;
    const recentAsc = entries.slice(0, 8).reverse();

    summaries.push({
      metricType,
      latest,
      previous,
      sparklineValues: recentAsc.map((e) => e.value),
    });
  });

  summaries.sort(
    (a, b) =>
      new Date(b.latest.measured_at).getTime() -
      new Date(a.latest.measured_at).getTime()
  );

  return summaries;
}

export default function CoachMeasurementsSummary({
  measurements,
}: CoachMeasurementsSummaryProps) {
  const [showAll, setShowAll] = useState(false);
  const summaries = buildSummaries(measurements);

  if (summaries.length === 0) {
    return (
      <p className="text-sm text-primary/40 italic">
        No measurements logged yet.
      </p>
    );
  }

  const displayed = showAll ? summaries : summaries.slice(0, 5);

  return (
    <div className="flex flex-col gap-2">
      {displayed.map((s) => {
        let changeText: string | null = null;
        if (s.previous) {
          const diff = s.latest.value - s.previous.value;
          if (diff !== 0) {
            const arrow = diff > 0 ? "\u2191" : "\u2193";
            const abs = Math.abs(diff);
            const formatted = Number.isInteger(abs)
              ? abs.toString()
              : abs.toFixed(1);
            changeText = `${arrow} ${formatted} ${s.latest.unit}`;
          }
        }

        return (
          <Card key={s.metricType}>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary truncate">
                  {formatMetricName(s.metricType)}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm text-primary/70">
                    <span className="font-semibold">
                      {Number.isInteger(s.latest.value)
                        ? s.latest.value
                        : s.latest.value.toFixed(1)}{" "}
                      {s.latest.unit}
                    </span>
                    {changeText && (
                      <span className="text-primary/50 ml-1.5">
                        {changeText}
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-xs text-primary/40 mt-0.5">
                  {formatDate(s.latest.measured_at)}
                </p>
              </div>
              {s.sparklineValues.length >= 2 && (
                <Sparkline values={s.sparklineValues} />
              )}
            </div>
          </Card>
        );
      })}

      {!showAll && summaries.length > 5 && (
        <button
          onClick={() => setShowAll(true)}
          className="text-sm font-medium text-accent text-center py-2 active:opacity-70"
        >
          View All ({summaries.length}) &rarr;
        </button>
      )}
    </div>
  );
}
