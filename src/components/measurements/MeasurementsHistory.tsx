"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Sparkline from "@/components/pr/Sparkline";
import LogMeasurementModal from "@/components/measurements/LogMeasurementModal";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { BodyMeasurement } from "@/types/app.types";

interface MeasurementsHistoryProps {
  measurements: BodyMeasurement[];
}

function formatMetricName(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isRecentlyLogged(dateStr: string): boolean {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return new Date(dateStr).getTime() > sevenDaysAgo;
}

interface MetricGroup {
  metricType: string;
  latest: BodyMeasurement;
  previous: BodyMeasurement | null;
  entries: BodyMeasurement[];
  sparklineValues: number[];
}

function groupByMetric(measurements: BodyMeasurement[]): MetricGroup[] {
  const map = new Map<string, BodyMeasurement[]>();

  for (const m of measurements) {
    const existing = map.get(m.metric_type);
    if (existing) {
      existing.push(m);
    } else {
      map.set(m.metric_type, [m]);
    }
  }

  const groups: MetricGroup[] = [];
  map.forEach((entries, metricType) => {
    // entries are already sorted desc by measured_at from the query
    const latest = entries[0];
    const previous = entries.length > 1 ? entries[1] : null;

    // Sparkline needs chronological order (asc), take last 8
    const recentAsc = entries.slice(0, 8).reverse();

    groups.push({
      metricType,
      latest,
      previous,
      entries,
      sparklineValues: recentAsc.map((e) => e.value),
    });
  });

  // Sort by most recently logged first
  groups.sort(
    (a, b) =>
      new Date(b.latest.measured_at).getTime() -
      new Date(a.latest.measured_at).getTime()
  );

  return groups;
}

function MetricCard({ group }: { group: MetricGroup }) {
  const [expanded, setExpanded] = useState(false);

  const { latest, previous, entries, sparklineValues, metricType } = group;
  const recent = isRecentlyLogged(latest.measured_at);

  let changeText: string | null = null;
  if (previous) {
    const diff = latest.value - previous.value;
    if (diff !== 0) {
      const arrow = diff > 0 ? "\u2191" : "\u2193";
      const abs = Math.abs(diff);
      const formatted = Number.isInteger(abs) ? abs.toString() : abs.toFixed(1);
      changeText = `${arrow} ${formatted} ${latest.unit} since last`;
    }
  }

  return (
    <div>
      <Card
        className={cn(
          "cursor-pointer active:scale-[0.99] transition-transform",
          recent && "border-l-2 border-l-accent"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-primary">
              {formatMetricName(metricType)}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-lg font-semibold text-primary">
                {Number.isInteger(latest.value)
                  ? latest.value
                  : latest.value.toFixed(1)}{" "}
                <span className="text-sm font-normal text-primary/50">
                  {latest.unit}
                </span>
              </p>
            </div>
            {changeText && (
              <p className="text-xs text-primary/50 mt-0.5">{changeText}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {sparklineValues.length >= 2 && (
              <Sparkline values={sparklineValues} />
            )}
            <svg
              className={cn(
                "h-4 w-4 text-primary/30 transition-transform",
                expanded && "rotate-180"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </Card>

      {/* Expanded history list */}
      {expanded && (
        <div className="ml-2 border-l-2 border-primary/10 pl-3 mt-1 mb-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-baseline justify-between py-2 border-b border-primary/5 last:border-b-0"
            >
              <div>
                <p className="text-sm text-primary/70">
                  {formatDate(entry.measured_at)}
                </p>
                {entry.notes && (
                  <p className="text-xs text-primary/40 mt-0.5">
                    {entry.notes}
                  </p>
                )}
              </div>
              <p className="text-sm font-medium text-primary">
                {Number.isInteger(entry.value)
                  ? entry.value
                  : entry.value.toFixed(1)}{" "}
                {entry.unit}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MeasurementsHistory({
  measurements,
}: MeasurementsHistoryProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const groups = groupByMetric(measurements);

  return (
    <>
      {groups.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <p className="text-primary/60">Start tracking your progress</p>
          <p className="text-sm text-primary/40 mt-1">
            Log your first measurement to see trends here.
          </p>
          <div className="mt-4 w-full max-w-xs">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setModalOpen(true)}
            >
              Log Measurement
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map((group) => (
            <MetricCard key={group.metricType} group={group} />
          ))}

          <Button
            variant="secondary"
            fullWidth
            onClick={() => setModalOpen(true)}
            className="mt-2"
          >
            Log Measurement
          </Button>
        </div>
      )}

      <LogMeasurementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
