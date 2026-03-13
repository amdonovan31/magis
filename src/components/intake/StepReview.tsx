"use client";

import type { IntakeData } from "@/lib/actions/intake.actions";

interface Props {
  data: IntakeData;
}

const PARQ_LABELS: { key: keyof IntakeData; label: string }[] = [
  { key: "parq_heart_condition", label: "Heart condition" },
  { key: "parq_chest_pain_activity", label: "Chest pain during activity" },
  { key: "parq_chest_pain_rest", label: "Chest pain at rest" },
  { key: "parq_dizziness", label: "Dizziness or fainting" },
  { key: "parq_bone_joint", label: "Bone or joint problem" },
  { key: "parq_blood_pressure_meds", label: "Blood pressure medication" },
  { key: "parq_other_reason", label: "Other reason" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-primary/10 pb-4 last:border-0 last:pb-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-primary">
        {value}
      </span>
    </div>
  );
}

const DURATION_MAP: Record<number, string> = {
  30: "30 min",
  45: "45 min",
  60: "60 min",
  75: "75+ min",
};

export default function StepReview({ data }: Props) {
  const flaggedParq = PARQ_LABELS.filter((q) => data[q.key] === true);

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-primary">
        Review Your Answers
      </h2>
      <p className="mt-1 text-sm text-muted">
        Make sure everything looks right before submitting.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {/* PAR-Q */}
        <Section title="Health Screening">
          {flaggedParq.length === 0 ? (
            <p className="text-sm text-primary">
              No health concerns flagged
            </p>
          ) : (
            <>
              {flaggedParq.map((q) => (
                <Row key={q.key} label={q.label} value="Yes" />
              ))}
              {data.parq_notes && (
                <Row label="Notes" value={data.parq_notes} />
              )}
            </>
          )}
        </Section>

        {/* Goals */}
        <Section title="Goals">
          <Row label="Primary goal" value={data.primary_goal} />
          {data.secondary_goal && (
            <Row label="Secondary goal" value={data.secondary_goal} />
          )}
          {data.injuries_limitations && (
            <Row label="Injuries / limitations" value={data.injuries_limitations} />
          )}
        </Section>

        {/* Preferences */}
        <Section title="Program Preferences">
          <Row label="Days per week" value={data.days_per_week} />
          <Row
            label="Session duration"
            value={DURATION_MAP[data.session_duration] ?? `${data.session_duration} min`}
          />
          <Row
            label="Training focus"
            value={data.training_focus.join(", ")}
          />
          <Row
            label="Equipment"
            value={data.equipment_available.join(", ")}
          />
        </Section>
      </div>
    </div>
  );
}
