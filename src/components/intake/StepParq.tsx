"use client";

import type { IntakeData } from "@/lib/actions/intake.actions";

interface Props {
  data: IntakeData;
  update: (partial: Partial<IntakeData>) => void;
}

const PARQ_QUESTIONS: { key: keyof IntakeData; label: string }[] = [
  {
    key: "parq_heart_condition",
    label: "Has a doctor ever said you have a heart condition?",
  },
  {
    key: "parq_chest_pain_activity",
    label: "Do you feel chest pain during physical activity?",
  },
  {
    key: "parq_chest_pain_rest",
    label: "Do you experience chest pain at rest?",
  },
  {
    key: "parq_dizziness",
    label: "Do you ever feel faint or dizzy?",
  },
  {
    key: "parq_bone_joint",
    label:
      "Do you have a bone or joint problem that could be aggravated by exercise?",
  },
  {
    key: "parq_blood_pressure_meds",
    label: "Are you currently on blood pressure medication?",
  },
  {
    key: "parq_other_reason",
    label: "Is there any other reason you should not exercise?",
  },
];

export default function StepParq({ data, update }: Props) {
  const anyYes = PARQ_QUESTIONS.some((q) => data[q.key] === true);

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-primary">
        Health Screening
      </h2>
      <p className="mt-1 text-sm text-muted">
        Please answer these standard health screening questions honestly before
        we get started.
      </p>
      <p className="mt-3 text-xs text-primary/50 italic">
        Your health information is stored securely and used only to personalise
        your fitness programming. It is never shared with third parties.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {PARQ_QUESTIONS.map((q) => (
          <div
            key={q.key}
            className="flex items-start justify-between gap-4 rounded-xl border border-primary/10 bg-bg p-4"
          >
            <span className="text-sm text-primary leading-snug">{q.label}</span>
            <div className="flex flex-shrink-0 gap-1">
              <button
                type="button"
                onClick={() => update({ [q.key]: false })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  data[q.key] === false
                    ? "bg-primary text-accent-light"
                    : "bg-primary/5 text-muted hover:bg-primary/10"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => update({ [q.key]: true })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  data[q.key] === true
                    ? "bg-red-600 text-white"
                    : "bg-primary/5 text-muted hover:bg-primary/10"
                }`}
              >
                Yes
              </button>
            </div>
          </div>
        ))}
      </div>

      {anyYes && (
        <div className="mt-4">
          <label className="text-sm font-medium text-primary">
            Please describe any conditions or concerns
          </label>
          <textarea
            value={data.parq_notes ?? ""}
            onChange={(e) =>
              update({ parq_notes: e.target.value || null })
            }
            rows={3}
            className="mt-1 w-full rounded-xl border border-primary/20 bg-surface px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Describe your condition(s)..."
          />
        </div>
      )}
    </div>
  );
}
