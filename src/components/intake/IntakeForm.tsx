"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { submitIntake, type IntakeData } from "@/lib/actions/intake.actions";
import StepParq from "./StepParq";
import StepGoals from "./StepGoals";
import StepPreferences from "./StepPreferences";
import StepReview from "./StepReview";

const TOTAL_STEPS = 4;

const STEP_LABELS = ["Health Screening", "Goals", "Preferences", "Review"];

export default function IntakeForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<IntakeData>({
    parq_heart_condition: false,
    parq_chest_pain_activity: false,
    parq_chest_pain_rest: false,
    parq_dizziness: false,
    parq_bone_joint: false,
    parq_blood_pressure_meds: false,
    parq_other_reason: false,
    parq_notes: null,
    primary_goal: "",
    secondary_goal: null,
    injuries_limitations: null,
    days_per_week: 3,
    session_duration: 60,
    training_focus: [],
    equipment_available: [],
    additional_notes: null,
  });

  function update(partial: Partial<IntakeData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function canAdvance(): boolean {
    if (step === 2 && !data.primary_goal) return false;
    if (step === 3 && data.training_focus.length === 0) return false;
    if (step === 3 && data.equipment_available.length === 0) return false;
    return true;
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const result = await submitIntake(data);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Step {step} of {TOTAL_STEPS}
          </span>
          <span className="text-sm text-muted">{STEP_LABELS[step - 1]}</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < step ? "bg-accent" : "bg-primary/10"
              }`}
            />
          ))}
        </div>
      </div>

      <Card padding="lg">
        {step === 1 && <StepParq data={data} update={update} />}
        {step === 2 && <StepGoals data={data} update={update} />}
        {step === 3 && <StepPreferences data={data} update={update} />}
        {step === 4 && <StepReview data={data} />}

        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button
              variant="primary"
              size="md"
              fullWidth
              disabled={!canAdvance()}
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onClick={handleSubmit}
            >
              Submit
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
