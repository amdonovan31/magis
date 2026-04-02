"use client";

import { useState, useRef, useCallback } from "react";
import type { BodyMeasurement } from "@/types/app.types";

interface WeightChartProps {
  data: BodyMeasurement[];
  unit: string;
}

const CHART_HEIGHT = 200;
const PADDING = { top: 20, right: 16, bottom: 32, left: 44 };

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function WeightChart({ data, unit }: WeightChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Sort ascending by date for chart
  const sorted = [...data].sort(
    (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
  );

  const chartWidth = 360;
  const plotW = chartWidth - PADDING.left - PADDING.right;
  const plotH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const values = sorted.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal || 1;
  const yMin = minVal - valRange * 0.1;
  const yMax = maxVal + valRange * 0.1;
  const yRange = yMax - yMin;

  const dates = sorted.map((d) => new Date(d.measured_at).getTime());
  const dateMin = Math.min(...dates);
  const dateMax = Math.max(...dates);
  const dateRange = dateMax - dateMin || 1;

  function xPos(i: number): number {
    if (sorted.length === 1) return PADDING.left + plotW / 2;
    const t = (dates[i] - dateMin) / dateRange;
    return PADDING.left + t * plotW;
  }

  function yPos(val: number): number {
    return PADDING.top + plotH - ((val - yMin) / yRange) * plotH;
  }

  const handleInteraction = useCallback(
    (clientX: number) => {
      if (!svgRef.current || sorted.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const relX = ((clientX - rect.left) / rect.width) * chartWidth;
      let nearest = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < sorted.length; i++) {
        const dist = Math.abs(xPos(i) - relX);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = i;
        }
      }
      setActiveIndex(nearest);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sorted.length, dateMin, dateRange]
  );

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-primary/40">
        No weight data yet. Log your first weight to see the chart.
      </div>
    );
  }

  const points = sorted.map((_, i) => `${xPos(i)},${yPos(values[i])}`).join(" ");

  // Y-axis ticks
  const yTicks: number[] = [];
  const tickStep = Math.ceil(yRange / 4 / 5) * 5 || 1;
  const tickStart = Math.floor(yMin / tickStep) * tickStep;
  for (let v = tickStart; v <= yMax + tickStep; v += tickStep) {
    if (v >= yMin && v <= yMax) yTicks.push(v);
  }

  // X-axis labels
  const xLabels: { index: number; label: string }[] = [];
  if (sorted.length <= 5) {
    sorted.forEach((d, i) => xLabels.push({ index: i, label: formatShortDate(d.measured_at) }));
  } else {
    xLabels.push({ index: 0, label: formatShortDate(sorted[0].measured_at) });
    const step = Math.floor((sorted.length - 1) / 3);
    for (let i = step; i < sorted.length - 1; i += step) {
      xLabels.push({ index: i, label: formatShortDate(sorted[i].measured_at) });
    }
    xLabels.push({ index: sorted.length - 1, label: formatShortDate(sorted[sorted.length - 1].measured_at) });
  }

  const active = activeIndex !== null ? sorted[activeIndex] : null;

  return (
    <div className="relative">
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
            {Number.isInteger(active.value) ? active.value : active.value.toFixed(1)} {unit}
          </p>
          <p className="text-white/70">{formatFullDate(active.measured_at)}</p>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        onPointerDown={(e) => handleInteraction(e.clientX)}
        onPointerMove={(e) => { if (e.buttons > 0) handleInteraction(e.clientX); }}
        onPointerLeave={() => setActiveIndex(null)}
      >
        {/* Grid */}
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

        {/* Y labels */}
        {yTicks.map((tick) => (
          <text
            key={`y-${tick}`}
            x={PADDING.left - 8}
            y={yPos(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={10}
            fill="#2C4A2E"
            fillOpacity={0.4}
          >
            {Math.round(tick)}
          </text>
        ))}

        {/* X labels */}
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

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#2C4A2E"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {sorted.map((_, i) => (
          <circle
            key={i}
            cx={xPos(i)}
            cy={yPos(values[i])}
            r={i === activeIndex ? 6 : 4}
            fill={i === activeIndex ? "#2C4A2E" : "#F5F3EE"}
            stroke="#2C4A2E"
            strokeWidth={2}
          />
        ))}
      </svg>
    </div>
  );
}
