"use client";

import { useState, useRef, useCallback } from "react";
import type { PRHistoryPoint } from "@/types/app.types";

interface PRChartProps {
  data: PRHistoryPoint[];
}

const CHART_HEIGHT = 200;
const PADDING = { top: 20, right: 16, bottom: 32, left: 44 };

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PRChart({ data }: PRChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Chart dimensions (responsive via viewBox)
  const chartWidth = 360;
  const plotW = chartWidth - PADDING.left - PADDING.right;
  const plotH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  // Scales
  const weights = data.map((d) => d.weight);
  const e1rms = data.map((d) => d.estimated1RM);
  const allValues = [...weights, ...e1rms];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const valRange = maxVal - minVal || 1;
  const yMin = minVal - valRange * 0.1;
  const yMax = maxVal + valRange * 0.1;
  const yRange = yMax - yMin;

  const dates = data.map((d) => new Date(d.date).getTime());
  const dateMin = Math.min(...dates);
  const dateMax = Math.max(...dates);
  const dateRange = dateMax - dateMin || 1;

  function xPos(i: number): number {
    if (data.length === 1) return PADDING.left + plotW / 2;
    const t = (dates[i] - dateMin) / dateRange;
    return PADDING.left + t * plotW;
  }

  function yPos(val: number): number {
    return PADDING.top + plotH - ((val - yMin) / yRange) * plotH;
  }

  // All-time best index
  const bestIndex = weights.reduce(
    (best, w, i) => (w > weights[best] ? i : best),
    0
  );

  // Build polyline strings
  const weightPoints = data.map((_, i) => `${xPos(i)},${yPos(weights[i])}`).join(" ");
  const e1rmPoints = data.map((_, i) => `${xPos(i)},${yPos(e1rms[i])}`).join(" ");

  // Y-axis ticks (4-5 ticks)
  const yTicks: number[] = [];
  const tickStep = Math.ceil(yRange / 4 / 5) * 5; // round to nearest 5
  const tickStart = Math.floor(yMin / tickStep) * tickStep;
  for (let v = tickStart; v <= yMax + tickStep; v += tickStep) {
    if (v >= yMin && v <= yMax) yTicks.push(v);
  }

  // X-axis labels — smart reduction
  const xLabels: { index: number; label: string }[] = [];
  if (data.length <= 5) {
    data.forEach((d, i) => xLabels.push({ index: i, label: formatShortDate(d.date) }));
  } else {
    xLabels.push({ index: 0, label: formatShortDate(data[0].date) });
    const step = Math.floor((data.length - 1) / 3);
    for (let i = step; i < data.length - 1; i += step) {
      xLabels.push({ index: i, label: formatShortDate(data[i].date) });
    }
    xLabels.push({
      index: data.length - 1,
      label: formatShortDate(data[data.length - 1].date),
    });
  }

  // Touch/click handling
  const handleInteraction = useCallback(
    (clientX: number) => {
      if (!svgRef.current || data.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const relX = ((clientX - rect.left) / rect.width) * chartWidth;

      // Find nearest point
      let nearest = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < data.length; i++) {
        const dist = Math.abs(xPos(i) - relX);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = i;
        }
      }
      setActiveIndex(nearest);
    },
    [data, dateMin, dateRange]
  );

  const active = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="relative">
      {/* Tooltip */}
      {active && activeIndex !== null && (
        <div
          className="absolute z-10 rounded-xl bg-primary px-3 py-2 text-xs text-white shadow-lg"
          style={{
            left: `${(xPos(activeIndex) / chartWidth) * 100}%`,
            top: 0,
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-semibold">
            {active.weight} kg
            {active.reps ? ` × ${active.reps}` : ""}
          </p>
          <p className="text-white/70">{formatFullDate(active.date)}</p>
          <p className="text-white/60">~{active.estimated1RM} kg e1RM</p>
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
        onPointerUp={() => {
          // keep tooltip visible after tap
        }}
        onPointerLeave={() => setActiveIndex(null)}
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
            key={`label-${tick}`}
            x={PADDING.left - 8}
            y={yPos(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={10}
            fill="#2C4A2E"
            fillOpacity={0.4}
          >
            {tick}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map(({ index, label }) => (
          <text
            key={`x-${index}`}
            x={xPos(index)}
            y={CHART_HEIGHT - 4}
            textAnchor="middle"
            fontSize={10}
            fill="#2C4A2E"
            fillOpacity={0.4}
          >
            {label}
          </text>
        ))}

        {/* Estimated 1RM line (secondary — dashed, muted, no markers) */}
        <polyline
          points={e1rmPoints}
          fill="none"
          stroke="#6B7B5E"
          strokeWidth={1}
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Weight PR line (primary) */}
        <polyline
          points={weightPoints}
          fill="none"
          stroke="#2C4A2E"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data point markers */}
        {data.map((_, i) => {
          const isBest = i === bestIndex;
          const isActive = i === activeIndex;
          return (
            <circle
              key={i}
              cx={xPos(i)}
              cy={yPos(weights[i])}
              r={isBest ? 7 : 6}
              fill={
                isActive
                  ? "#2C4A2E"
                  : isBest
                    ? "#1B2E4B"
                    : "#F5F3EE"
              }
              stroke={isBest ? "#1B2E4B" : "#2C4A2E"}
              strokeWidth={2}
            />
          );
        })}

        {/* Active point highlight ring */}
        {activeIndex !== null && (
          <circle
            cx={xPos(activeIndex)}
            cy={yPos(weights[activeIndex])}
            r={10}
            fill="none"
            stroke="#2C4A2E"
            strokeWidth={1}
            strokeOpacity={0.3}
          />
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-1 text-[10px] text-primary/40">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-primary" />
          Weight PR
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-0.5 w-4"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, #6B7B5E 0, #6B7B5E 4px, transparent 4px, transparent 7px)",
            }}
          />
          Est. 1RM
        </span>
      </div>
    </div>
  );
}
