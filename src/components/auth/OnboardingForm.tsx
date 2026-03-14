"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/lib/actions/auth.actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

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

interface Props {
  role: "client" | "solo";
  needsPassword: boolean;
}

type Step = "profile" | "goals" | "equipment" | "days";

const STEPS: Step[] = ["profile", "goals", "equipment", "days"];

export default function OnboardingForm({ role, needsPassword }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Intake fields
  const [goals, setGoals] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState(4);

  // Result (solo only)
  const [result, setResult] = useState<{
    programTitle: string;
    explanation: string;
    dayCount: number;
  } | null>(null);

  const stepIndex = STEPS.indexOf(step);

  function toggleChip(value: string, list: string[], setter: (v: string[]) => void) {
    if (list.includes(value)) {
      setter(list.filter((v) => v !== value));
    } else {
      setter([...list, value]);
    }
  }

  function validateProfile(): boolean {
    if (!fullName.trim()) {
      setError("Full name is required");
      return false;
    }
    if (needsPassword) {
      if (!password || password.length < 8) {
        setError("Password must be at least 8 characters");
        return false;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    }
    return true;
  }

  function nextStep() {
    setError(null);
    if (step === "profile" && !validateProfile()) return;
    if (step === "goals" && goals.length === 0) return;
    if (step === "equipment" && equipment.length === 0) return;

    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }

  function prevStep() {
    setError(null);
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await completeOnboarding({
        fullName: fullName.trim(),
        password: needsPassword ? password : undefined,
        goals,
        equipment,
        daysPerWeek,
      });
      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      if (res?.programTitle) {
        // Solo users see the result screen
        setResult({
          programTitle: res.programTitle,
          explanation: res.explanation!,
          dayCount: res.dayCount!,
        });
        setLoading(false);
      }
      // Clients get redirected by the server action
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // Solo result screen
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
        <Button fullWidth size="lg" onClick={() => router.push("/home")}>
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
            {role === "solo"
              ? "Building your personalized program..."
              : "Setting up your profile..."}
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
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-2 w-2 rounded-full transition-colors ${
              i <= stepIndex ? "bg-primary" : "bg-primary/20"
            }`}
          />
        ))}
      </div>

      {step === "profile" && (
        <>
          <h2 className="text-lg font-semibold text-primary text-center">
            About you
          </h2>
          <Input
            label="Full Name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          {needsPassword && (
            <>
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </>
          )}
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}
          <Button fullWidth size="lg" onClick={nextStep}>
            Next
          </Button>
        </>
      )}

      {step === "goals" && (
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
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={prevStep}>
              Back
            </Button>
            <Button fullWidth size="lg" disabled={goals.length === 0} onClick={nextStep}>
              Next
            </Button>
          </div>
        </>
      )}

      {step === "equipment" && (
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
            <Button variant="secondary" fullWidth onClick={prevStep}>
              Back
            </Button>
            <Button fullWidth size="lg" disabled={equipment.length === 0} onClick={nextStep}>
              Next
            </Button>
          </div>
        </>
      )}

      {step === "days" && (
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
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={prevStep}>
              Back
            </Button>
            <Button fullWidth size="lg" onClick={handleSubmit}>
              {role === "solo" ? "Generate Program" : "Complete Setup"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
