"use client";

import type { IntakeData } from "@/lib/actions/intake.actions";

interface Props {
  data: IntakeData;
  update: (partial: Partial<IntakeData>) => void;
}

const FOCUS_OPTIONS = [
  "Strength",
  "Hypertrophy",
  "Cardio",
  "Mobility",
  "HIIT",
  "Sport-specific",
];

const EQUIPMENT_OPTIONS = [
  "Full Gym",
  "Barbell",
  "Dumbbells",
  "Kettlebells",
  "Cables/Machines",
  "Resistance Bands",
  "Bodyweight only",
];

const DURATION_OPTIONS = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
  { label: "75+ min", value: 75 },
];

function toggleArrayItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item];
}

export default function StepPreferences({ data, update }: Props) {
  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-primary">
        Program Preferences
      </h2>
      <p className="mt-1 text-sm text-muted">
        Help us tailor your training plan.
      </p>

      {/* Days per week */}
      <div className="mt-6">
        <label className="text-sm font-medium text-primary">
          Days per week
        </label>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => update({ days_per_week: n })}
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                data.days_per_week === n
                  ? "bg-accent text-accent-light"
                  : "border border-primary/10 bg-bg text-primary hover:border-primary/30"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Session duration */}
      <div className="mt-6">
        <label className="text-sm font-medium text-primary">
          Session duration
        </label>
        <div className="mt-2 flex gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ session_duration: opt.value })}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                data.session_duration === opt.value
                  ? "bg-accent text-accent-light"
                  : "border border-primary/10 bg-bg text-primary hover:border-primary/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Training focus */}
      <div className="mt-6">
        <label className="text-sm font-medium text-primary">
          Training focus <span className="text-red-500">*</span>
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {FOCUS_OPTIONS.map((focus) => (
            <button
              key={focus}
              type="button"
              onClick={() =>
                update({
                  training_focus: toggleArrayItem(data.training_focus, focus),
                })
              }
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                data.training_focus.includes(focus)
                  ? "bg-accent text-accent-light"
                  : "border border-primary/10 bg-bg text-primary hover:border-primary/30"
              }`}
            >
              {focus}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div className="mt-6">
        <label className="text-sm font-medium text-primary">
          Equipment available <span className="text-red-500">*</span>
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((eq) => (
            <button
              key={eq}
              type="button"
              onClick={() =>
                update({
                  equipment_available: toggleArrayItem(
                    data.equipment_available,
                    eq
                  ),
                })
              }
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                data.equipment_available.includes(eq)
                  ? "bg-accent text-accent-light"
                  : "border border-primary/10 bg-bg text-primary hover:border-primary/30"
              }`}
            >
              {eq}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
