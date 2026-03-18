"use client";

import { useState, useRef, useCallback } from "react";
import type { VolumeDataPoint } from "@/types/app.types";
import { MUSCLE_GROUP_COLORS } from "@/types/app.types";

interface VolumeBarChartProps {
  data: VolumeDataPoint[];
  periodType: "weekly" | "monthly";
}

const CHART_HEIGHT = 220;
const PADDING = { top: 16, right: 8, bottom: 36, left: 48 };

function formatPeriodLabel(iso: string, type: "weekly" | "monthly"): string {
  const d = new Date(iso + "T00:00:00");
  if (type === "monthly") {
    return d.toLocaleDateString("en-US", { month: "short" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatVolume(v: number): string {
  if (v >= 10000) return `${(v / 1000).toFixed(1)}k`;
  if (v >= 1000) return v.toLocaleString();
  return v.toString();
}

export default function VolumeBarChart({
  data,
  periodType,
}: VolumeBarChartProps) {
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (data.length === 0) return null;

  // Group data by period
  const periods: string[] = [];
  const periodSet = new Set<string>();
  for (const d of data) {
    if (!periodSet.has(d.periodStart)) {
      periodSet.add(d.periodStart);
      periods.push(d.periodStart);
    }
  }
  periods.sort();

  // Collect all muscle groups present
  const muscleGroups = Array.from(new Set(data.map((d) => d.muscleGroup)));

  // Build stacked data per period
  type StackedBar = {
    period: string;
    total: number;
    segments: { muscleGroup: string; volume: number; y: number; height: number }[];
  };

  const chartWidth = 360;
  const plotW = chartWidth - PADDING.left - PADDING.right;
  const plotH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  // Compute totals per period
  const barData: StackedBar[] = periods.map((period) => {
    const periodPoints = data.filter((d) => d.periodStart === period);
    const total = periodPoints.reduce((sum, d) => sum + d.totalVolume, 0);
    return { period, total, segments: [] };
  });

  const maxTotal = Math.max(...barData.map((b) => b.total), 1);
  const yMax = Math.ceil(maxTotal / 1000) * 1000 || maxTotal; // round up to nearest 1000

  // Build stacked segments
  for (const bar of barData) {
    const periodPoints = data.filter((d) => d.periodStart === bar.period);
    // Sort segments for consistent stacking order
    periodPoints.sort(
      (a, b) =>
        muscleGroups.indexOf(a.muscleGroup) -
        muscleGroups.indexOf(b.muscleGroup)
    );

    let cumY = 0;
    for (const pt of periodPoints) {
      const height = (pt.totalVolume / yMax) * plotH;
      bar.segments.push({
        muscleGroup: pt.muscleGroup,
        volume: pt.totalVolume,
        y: cumY,
        height,
      });
      cumY += height;
    }
  }

  // Bar sizing
  const barGap = periods.length > 10 ? 2 : 4;
  const barWidth = Math.max(
    8,
    (plotW - barGap * (periods.length - 1)) / periods.length
  );
  const totalBarsWidth =
    barWidth * periods.length + barGap * (periods.length - 1);
  const barsOffset = PADDING.left + (plotW - totalBarsWidth) / 2;

  // Y-axis ticks (4 ticks)
  const yTicks: number[] = [];
  const tickStep = Math.ceil(yMax / 4 / 500) * 500 || Math.ceil(yMax / 4);
  for (let v = 0; v <= yMax; v += tickStep) {
    yTicks.push(v);
  }

  function barX(i: number): number {
    return barsOffset + i * (barWidth + barGap);
  }

  function yPos(val: number): number {
    return PADDING.top + plotH - (val / yMax) * plotH;
  }

  // X-axis labels — show all if <=8, otherwise reduce
  const xLabels: { index: number; label: string }[] = [];
  if (periods.length <= 8) {
    periods.forEach((p, i) =>
      xLabels.push({ index: i, label: formatPeriodLabel(p, periodType) })
    );
  } else {
    // Show first, last, and evenly spaced
    xLabels.push({
      index: 0,
      label: formatPeriodLabel(periods[0], periodType),
    });
    const step = Math.floor((periods.length - 1) / 4);
    for (let i = step; i < periods.length - 1; i += step) {
      xLabels.push({
        index: i,
        label: formatPeriodLabel(periods[i], periodType),
      });
    }
    xLabels.push({
      index: periods.length - 1,
      label: formatPeriodLabel(periods[periods.length - 1], periodType),
    });
  }

  // Touch handling
  const handleInteraction = useCallback(
    (clientX: number) => {
      if (!svgRef.current || periods.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const relX = ((clientX - rect.left) / rect.width) * chartWidth;

      let nearest = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < periods.length; i++) {
        const cx = barX(i) + barWidth / 2;
        const dist = Math.abs(cx - relX);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = i;
        }
      }
      setActiveBar(nearest);
    },
    [periods.length, barWidth]
  );

  const activeData = activeBar !== null ? barData[activeBar] : null;

  return (
    <div className="relative">
      {/* Tooltip */}
      {activeData && activeBar !== null && (
        <div
          className="absolute z-10 rounded-xl bg-primary px-3 py-2 text-xs text-white shadow-lg max-w-[200px]"
          style={{
            left: `${((barX(activeBar) + barWidth / 2) / chartWidth) * 100}%`,
            top: 0,
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-semibold">
            {formatPeriodLabel(activeData.period, periodType)}
          </p>
          <p className="text-white/70">
            Total: {activeData.total.toLocaleString()} kg
          </p>
          {activeData.segments
            .filter((s) => s.volume > 0)
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5)
            .map((s) => (
              <div
                key={s.muscleGroup}
                className="flex items-center gap-1.5 mt-0.5"
              >
                <span
                  className="inline-block h-2 w-2 rounded-sm flex-shrink-0"
                  style={{
                    backgroundColor:
                      MUSCLE_GROUP_COLORS[s.muscleGroup] ?? "#A0A0A0",
                  }}
                />
                <span className="text-white/60 truncate">
                  {s.muscleGroup}: {s.volume.toLocaleString()}
                </span>
              </div>
            ))}
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        onPointerDown={(e) => handleInteraction(e.clientX)}
        onPointerMove={(e) => {
          if (e.buttons > 0) handleInteraction(e.clientX);
        }}
        onPointerLeave={() => setActiveBar(null)}
      >
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <line
            key={tick}
            x1={PADDING.left}
            x2={chartWidth - PADDING.right}
            y1={yPos(tick)}
            y2={yPos(tick)}
            stroke="#2C4A2E"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick) => (
          <text
            key={`y-${tick}`}
            x={PADDING.left - 6}
            y={yPos(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={10}
            fill="#2C4A2E"
            fillOpacity={0.4}
          >
            {formatVolume(tick)}
          </text>
        ))}

        {/* Stacked bars */}
        {barData.map((bar, i) => (
          <g key={bar.period}>
            {bar.segments.map((seg) => (
              <rect
                key={`${bar.period}-${seg.muscleGroup}`}
                x={barX(i)}
                y={yPos(0) - seg.y - seg.height}
                width={barWidth}
                height={Math.max(seg.height, 0)}
                rx={2}
                fill={MUSCLE_GROUP_COLORS[seg.muscleGroup] ?? "#A0A0A0"}
                opacity={
                  activeBar === null || activeBar === i ? 1 : 0.4
                }
                className="transition-opacity"
              />
            ))}
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map(({ index, label }) => (
          <text
            key={`x-${index}`}
            x={barX(index) + barWidth / 2}
            y={CHART_HEIGHT - 4}
            textAnchor="middle"
            fontSize={9}
            fill="#2C4A2E"
            fillOpacity={0.4}
          >
            {label}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 px-1">
        {muscleGroups.map((mg) => (
          <span key={mg} className="flex items-center gap-1 text-[10px] text-primary/50">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ backgroundColor: MUSCLE_GROUP_COLORS[mg] ?? "#A0A0A0" }}
            />
            {mg}
          </span>
        ))}
      </div>
    </div>
  );
}
