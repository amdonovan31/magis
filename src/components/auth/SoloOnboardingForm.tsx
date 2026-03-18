"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { generateSoloProgram } from "@/lib/actions/ai.actions";
import { requiresHealthDisclaimer } from "@/lib/disclaimer/keywords";
import AiDisclaimer from "@/components/disclaimer/AiDisclaimer";

const GOALS = [
  "Build Muscle",
  "Lose Fat",
  "Get Stronger",
  "Improve Fitness",
] as const;

const EQUIPMENT = [
  "Full Gym",
  "Dumbbells Only",
  "Barbell + Rack",
  "Bodyweight Only",
  "Home Gym",
] as const;

type Step = 1 | 2 | 3;

export default function SoloOnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [goals, setGoals] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    programTitle: string;
    explanation: string;
    dayCount: number;
  } | null>(null);

  function toggleChip(value: string, list: string[], setter: (v: string[]) => void) {
    if (list.includes(value)) {
      setter(list.filter((v) => v !== value));
    } else {
      setter([...list, value]);
    }
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await generateSoloProgram({
        goals,
        equipment,
        daysPerWeek,
      });
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      setResult({
        programTitle: res.programTitle!,
        explanation: res.explanation!,
        dayCount: res.dayCount!,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  // Show result screen
  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <Card padding="lg" className="text-center">
          <div className="text-4xl mb-3">&#x2728;</div>
          <h2 className="text-xl font-bold text-primary">{result.programTitle}</h2>
          <p className="mt-2 text-sm text-primary/60">
            {result.dayCount} workouts per week
          </p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-primary/80 whitespace-pre-line">{result.explanation}</p>
        </Card>
        {requiresHealthDisclaimer(result.explanation) && <AiDisclaimer />}
        <Button
          fullWidth
          size="lg"
          onClick={() => router.push("/home")}
        >
          Start Training &#x2192;
        </Button>
      </div>
    );
  }

  // Loading screen
  if (loading) {
    return (
      <Card padding="lg" className="text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-primary/60">
            Building your personalized program...
          </p>
          <p className="text-xs text-primary/40">This may take a moment</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-2">
        {([1, 2, 3] as Step[]).map((s) => (
          <div
            key={s}
            className={`h-2 w-2 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-primary/20"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <>
          <h2 className="text-lg font-semibold text-primary text-center">
            What are your goals?
          </h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => toggleChip(g, goals, setGoals)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  goals.includes(g)
                    ? "bg-primary text-white"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <Button
            fullWidth
            size="lg"
            disabled={goals.length === 0}
            onClick={() => setStep(2)}
          >
            Next
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-lg font-semibold text-primary text-center">
            What equipment do you have?
          </h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {EQUIPMENT.map((e) => (
              <button
                key={e}
                onClick={() => toggleChip(e, equipment, setEquipment)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  equipment.includes(e)
                    ? "bg-primary text-white"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              fullWidth
              size="lg"
              disabled={equipment.length === 0}
              onClick={() => setStep(3)}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="text-lg font-semibold text-primary text-center">
            How many days per week?
          </h2>
          <div className="flex justify-center gap-3">
            {[2, 3, 4, 5, 6].map((d) => (
              <button
                key={d}
                onClick={() => setDaysPerWeek(d)}
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold transition-colors ${
                  daysPerWeek === d
                    ? "bg-primary text-white"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-primary/40">
            {daysPerWeek} days per week
          </p>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setStep(2)}>
              Back
            </Button>
            <Button fullWidth size="lg" onClick={handleSubmit}>
              Generate Program
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
