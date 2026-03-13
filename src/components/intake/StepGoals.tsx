"use client";

import type { IntakeData } from "@/lib/actions/intake.actions";

interface Props {
  data: IntakeData;
  update: (partial: Partial<IntakeData>) => void;
}

const GOAL_OPTIONS = [
  "Build muscle",
  "Lose weight",
  "Improve endurance",
  "Increase flexibility",
  "General fitness",
  "Sport-specific performance",
];

export default function StepGoals({ data, update }: Props) {
  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-primary">
        Your Goals
      </h2>
      <p className="mt-1 text-sm text-muted">
        What are you looking to achieve?
      </p>

      {/* Primary goal */}
      <div className="mt-6">
        <label className="text-sm font-medium text-primary">
          Primary goal <span className="text-red-500">*</span>
        </label>
        <div className="mt-2 flex flex-col gap-2">
          {GOAL_OPTIONS.map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => update({ primary_goal: goal })}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                data.primary_goal === goal
                  ? "border-accent bg-accent text-accent-light"
                  : "border-primary/10 bg-bg text-primary hover:border-primary/30"
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary goal */}
      <div className="mt-6">
        <label className="text-sm font-medium text-primary">
          Secondary goal{" "}
          <span className="text-xs text-muted font-normal">(optional)</span>
        </label>
        <div className="mt-2 flex flex-col gap-2">
          {GOAL_OPTIONS.filter((g) => g !== data.primary_goal).map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() =>
                update({
                  secondary_goal: data.secondary_goal === goal ? null : goal,
                })
              }
              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                data.secondary_goal === goal
                  ? "border-accent bg-accent text-accent-light"
                  : "border-primary/10 bg-bg text-primary hover:border-primary/30"
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* Injuries */}
      <div className="mt-6">
        <label className="text-sm font-medium text-primary">
          Injuries or limitations{" "}
          <span className="text-xs text-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={data.injuries_limitations ?? ""}
          onChange={(e) =>
            update({ injuries_limitations: e.target.value || null })
          }
          rows={3}
          className="mt-1 w-full rounded-xl border border-primary/20 bg-surface px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="E.g., bad left knee, lower back issues..."
        />
      </div>
    </div>
  );
}
