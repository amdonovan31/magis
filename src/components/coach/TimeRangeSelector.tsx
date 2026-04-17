"use client";

export type TimeRange = "1w" | "4w" | "12w";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const OPTIONS: TimeRange[] = ["1w", "4w", "12w"];

export default function TimeRangeSelector({
  value,
  onChange,
}: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-primary/5 p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === opt
              ? "bg-primary text-white"
              : "text-primary/50 hover:text-primary"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
