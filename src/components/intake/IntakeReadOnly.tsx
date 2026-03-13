import Card from "@/components/ui/Card";
import type { Database } from "@/types/database.types";

type ClientIntake = Database["public"]["Tables"]["client_intake"]["Row"];

interface IntakeReadOnlyProps {
  intake: ClientIntake;
}

const PARQ_QUESTIONS: { key: keyof ClientIntake; label: string }[] = [
  { key: "parq_heart_condition", label: "Has a doctor ever said you have a heart condition?" },
  { key: "parq_chest_pain_activity", label: "Do you feel chest pain during physical activity?" },
  { key: "parq_chest_pain_rest", label: "Do you experience chest pain at rest?" },
  { key: "parq_dizziness", label: "Do you ever feel faint or dizzy?" },
  { key: "parq_bone_joint", label: "Do you have a bone or joint problem aggravated by exercise?" },
  { key: "parq_blood_pressure_meds", label: "Are you currently on blood pressure medication?" },
  { key: "parq_other_reason", label: "Is there any other reason you should not exercise?" },
];

const DURATION_MAP: Record<number, string> = {
  30: "30 min",
  45: "45 min",
  60: "60 min",
  75: "75+ min",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card padding="lg">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </h4>
      {children}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-primary/5 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-primary">{value}</span>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
      {children}
    </span>
  );
}

export default function IntakeReadOnly({ intake }: IntakeReadOnlyProps) {
  const flaggedParq = PARQ_QUESTIONS.filter((q) => intake[q.key] === true);

  return (
    <div className="flex flex-col gap-3">
      {/* PAR-Q */}
      <Section title="Health Screening (PAR-Q)">
        {PARQ_QUESTIONS.map((q) => {
          const answered = intake[q.key] as boolean;
          return (
            <div
              key={q.key}
              className="flex items-start justify-between gap-3 py-2 border-b border-primary/5 last:border-0"
            >
              <span className="text-sm text-primary leading-snug">{q.label}</span>
              <span
                className={`flex-shrink-0 text-xs font-semibold ${
                  answered ? "text-red-600" : "text-primary/40"
                }`}
              >
                {answered ? "Yes" : "No"}
              </span>
            </div>
          );
        })}
        {flaggedParq.length > 0 && intake.parq_notes && (
          <div className="mt-2 rounded-xl bg-bg p-3">
            <p className="text-xs font-medium text-muted mb-1">Notes</p>
            <p className="text-sm text-primary">{intake.parq_notes}</p>
          </div>
        )}
      </Section>

      {/* Goals */}
      <Section title="Goals">
        <Row label="Primary goal" value={intake.primary_goal ?? "—"} />
        <Row label="Secondary goal" value={intake.secondary_goal ?? "—"} />
        {intake.injuries_limitations && (
          <div className="mt-2 rounded-xl bg-bg p-3">
            <p className="text-xs font-medium text-muted mb-1">Injuries / Limitations</p>
            <p className="text-sm text-primary">{intake.injuries_limitations}</p>
          </div>
        )}
      </Section>

      {/* Program Preferences */}
      <Section title="Program Preferences">
        <Row label="Days per week" value={intake.days_per_week ?? "—"} />
        <Row
          label="Session duration"
          value={
            intake.session_duration
              ? DURATION_MAP[intake.session_duration] ?? `${intake.session_duration} min`
              : "—"
          }
        />

        {intake.training_focus && intake.training_focus.length > 0 && (
          <div className="py-2 border-b border-primary/5">
            <p className="text-sm text-muted mb-2">Training focus</p>
            <div className="flex flex-wrap gap-1.5">
              {intake.training_focus.map((f) => (
                <Chip key={f}>{f}</Chip>
              ))}
            </div>
          </div>
        )}

        {intake.equipment_available && intake.equipment_available.length > 0 && (
          <div className="py-2">
            <p className="text-sm text-muted mb-2">Equipment available</p>
            <div className="flex flex-wrap gap-1.5">
              {intake.equipment_available.map((e) => (
                <Chip key={e}>{e}</Chip>
              ))}
            </div>
          </div>
        )}

        {intake.additional_notes && (
          <div className="mt-2 rounded-xl bg-bg p-3">
            <p className="text-xs font-medium text-muted mb-1">Additional notes</p>
            <p className="text-sm text-primary">{intake.additional_notes}</p>
          </div>
        )}
      </Section>
    </div>
  );
}
