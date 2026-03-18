"use client";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
}

export default function Sparkline({
  values,
  width = 80,
  height = 24,
}: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const padding = 3; // space for the end dot
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * plotW;
    const y = padding + plotH - ((v - min) / range) * plotH;
    return { x, y };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="flex-shrink-0"
    >
      <polyline
        points={polyline}
        fill="none"
        stroke="currentColor"
        className="text-primary/40"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={last.x}
        cy={last.y}
        r={2.5}
        fill="currentColor"
        className="text-primary"
      />
    </svg>
  );
}
