import Card from "@/components/ui/Card";
import type { Database } from "@/types/database.types";

type ClientIntake = Database["public"]["Tables"]["client_intake"]["Row"];

interface IntakeSummaryCardProps {
  intake: ClientIntake;
}

const PARQ_LABELS: { key: keyof ClientIntake; label: string }[] = [
  { key: "parq_heart_condition", label: "Heart condition" },
  { key: "parq_chest_pain_activity", label: "Chest pain (activity)" },
  { key: "parq_chest_pain_rest", label: "Chest pain (rest)" },
  { key: "parq_dizziness", label: "Dizziness / fainting" },
  { key: "parq_bone_joint", label: "Bone / joint problem" },
  { key: "parq_blood_pressure_meds", label: "BP medication" },
  { key: "parq_other_reason", label: "Other reason" },
];

const DURATION_MAP: Record<number, string> = {
  30: "30 min",
  45: "45 min",
  60: "60 min",
  75: "75+ min",
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-surface px-2.5 py-0.5 text-xs text-muted">
      {children}
    </span>
  );
}

export default function IntakeSummaryCard({ intake }: IntakeSummaryCardProps) {
  const flagged = PARQ_LABELS.filter((q) => intake[q.key] === true);

  return (
    <Card padding="lg">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
        Client Intake Summary
      </h3>

      {/* PAR-Q */}
      <div className="mb-4 pb-3 border-b border-primary/5">
        <p className="text-xs font-medium text-muted mb-1">PAR-Q Flags</p>
        {flagged.length === 0 ? (
          <p className="text-sm text-primary">No flags</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {flagged.map((q) => (
              <p key={q.key} className="text-sm text-red-600">
                {q.label}
              </p>
            ))}
            {intake.parq_notes && (
              <p className="mt-1 text-xs text-muted italic">
                {intake.parq_notes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Goals */}
      <div className="mb-4 pb-3 border-b border-primary/5">
        <p className="text-xs font-medium text-muted mb-1">Goals</p>
        <p className="text-sm text-primary">
          {intake.primary_goal ?? "—"}
          {intake.secondary_goal && (
            <span className="text-muted"> · {intake.secondary_goal}</span>
          )}
        </p>
        {intake.injuries_limitations && (
          <p className="mt-1 text-xs text-muted">
            Limitations: {intake.injuries_limitations}
          </p>
        )}
      </div>

      {/* Preferences */}
      <div>
        <p className="text-xs font-medium text-muted mb-2">Preferences</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Chip>
            {intake.days_per_week ?? "?"} days/week
          </Chip>
          <Chip>
            {intake.session_duration
              ? DURATION_MAP[intake.session_duration] ?? `${intake.session_duration} min`
              : "?"}
          </Chip>
        </div>
        {intake.training_focus && intake.training_focus.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {intake.training_focus.map((f) => (
              <Chip key={f}>{f}</Chip>
            ))}
          </div>
        )}
        {intake.equipment_available && intake.equipment_available.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {intake.equipment_available.map((e) => (
              <Chip key={e}>{e}</Chip>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
