"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/lib/actions/auth.actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import StepParq from "@/components/intake/StepParq";
import StepGoals from "@/components/intake/StepGoals";
import StepPreferences from "@/components/intake/StepPreferences";
import StepReview from "@/components/intake/StepReview";
import DisclaimerScreen from "@/components/disclaimer/DisclaimerScreen";
import { acceptDisclaimer } from "@/lib/disclaimer/actions";
import { LOCALSTORAGE_KEY } from "@/lib/disclaimer/constants";
import { requiresHealthDisclaimer } from "@/lib/disclaimer/keywords";
import AiDisclaimer from "@/components/disclaimer/AiDisclaimer";
import type { IntakeData } from "@/lib/actions/intake.actions";

/* ── Gender chips ────────────────────────────────────────── */
const GENDERS = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say",
] as const;

const TRAINING_AGE_STOPS = [0, 1, 2, 3, 5, 7, 10, 15, 20] as const;

/* ── Step definitions (same for both roles) ─────────────── */
// profile → body → disclaimer → PAR-Q → goals → preferences → review
type Step = "profile" | "body" | "disclaimer" | "parq" | "goals" | "preferences" | "review";

const STEPS: Step[] = ["profile", "body", "disclaimer", "parq", "goals", "preferences", "review"];
const PROGRESS_STEPS = STEPS.filter((s) => s !== "disclaimer");

interface Props {
  role: "client" | "solo";
  needsPassword: boolean;
}

export default function OnboardingForm({ role, needsPassword }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(STEPS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  /* ── Profile fields ─────────────────────────────────────── */
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* ── Body / biometric fields ────────────────────────────── */
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [heightUnit, setHeightUnit] = useState<"imperial" | "metric">("imperial");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightUnit, setWeightUnit] = useState<"imperial" | "metric">("imperial");
  const [weightLbs, setWeightLbs] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [trainingAge, setTrainingAge] = useState(1);

  /* ── Intake data (PAR-Q + goals + preferences) ──────────── */
  const [intakeData, setIntakeData] = useState<IntakeData>({
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

  function updateIntake(partial: Partial<IntakeData>) {
    setIntakeData((prev) => ({ ...prev, ...partial }));
  }

  /* ── Result (solo only — AI program) ─────────────────────── */
  const [result, setResult] = useState<{
    programTitle: string;
    explanation: string;
    dayCount: number;
  } | null>(null);

  const stepIndex = STEPS.indexOf(step);

  /* ── Helpers ────────────────────────────────────────────── */
  function getHeightCm(): number {
    if (heightUnit === "metric") return parseFloat(heightCm) || 0;
    const ft = parseInt(heightFt) || 0;
    const inches = parseInt(heightIn) || 0;
    return Math.round((ft * 12 + inches) * 2.54);
  }

  function getWeightKg(): number {
    if (weightUnit === "metric") return parseFloat(weightKg) || 0;
    return Math.round((parseFloat(weightLbs) || 0) * 0.453592 * 10) / 10;
  }

  /* ── Validation ─────────────────────────────────────────── */
  function validateProfile(): boolean {
    if (!fullName.trim()) { setError("Full name is required"); return false; }
    if (needsPassword) {
      if (!password || password.length < 8) { setError("Password must be at least 8 characters"); return false; }
      if (password !== confirmPassword) { setError("Passwords do not match"); return false; }
    }
    return true;
  }

  function validateBody(): boolean {
    if (!birthdate) { setError("Birthdate is required"); return false; }
    const bd = new Date(birthdate);
    const age = (Date.now() - bd.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 13) { setError("You must be at least 13 years old"); return false; }
    if (age > 120) { setError("Please enter a valid birthdate"); return false; }
    if (!gender) { setError("Please select a gender"); return false; }
    const cm = getHeightCm();
    if (cm < 100 || cm > 275) { setError("Please enter a valid height"); return false; }
    const kg = getWeightKg();
    if (kg < 25 || kg > 350) { setError("Please enter a valid weight"); return false; }
    return true;
  }

  function canAdvance(): boolean {
    if (step === "goals" && !intakeData.primary_goal) return false;
    if (step === "preferences" && (intakeData.training_focus.length === 0 || intakeData.equipment_available.length === 0)) return false;
    return true;
  }

  function nextStep() {
    setError(null);
    if (step === "profile" && !validateProfile()) return;
    if (step === "body" && !validateBody()) return;
    if (!canAdvance()) return;
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }

  function prevStep() {
    setError(null);
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  }

  /* ── Submit ─────────────────────────────────────────────── */
  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await completeOnboarding({
        fullName: fullName.trim(),
        password: needsPassword ? password : undefined,
        birthdate,
        gender,
        heightCm: getHeightCm(),
        weightKg: getWeightKg(),
        trainingAgeYears: trainingAge,
        intakeData,
      });
      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      if (res?.programTitle) {
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

  /* ── Result screen (solo only) ──────────────────────────── */
  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <Card padding="lg" className="text-center">
          <div className="text-4xl mb-3">&#x2728;</div>
          <h2 className="text-xl font-bold text-primary">{result.programTitle}</h2>
          <p className="mt-2 text-sm text-primary/60">{result.dayCount} workouts per week</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-primary/80 whitespace-pre-line">{result.explanation}</p>
        </Card>
        {requiresHealthDisclaimer(result.explanation) && <AiDisclaimer />}
        <Button fullWidth size="lg" onClick={() => router.push("/home")}>
          Start Training &#x2192;
        </Button>
      </div>
    );
  }

  /* ── Loading screen ─────────────────────────────────────── */
  if (loading) {
    return (
      <Card padding="lg" className="text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-primary/60">
            {role === "solo" ? "Building your personalized program..." : "Setting up your profile..."}
          </p>
          <p className="text-xs text-primary/40">This may take a moment</p>
        </div>
      </Card>
    );
  }

  /* ── Training age slider index ──────────────────────────── */
  const trainingAgeIndex = TRAINING_AGE_STOPS.indexOf(
    TRAINING_AGE_STOPS.reduce((prev, curr) =>
      Math.abs(curr - trainingAge) < Math.abs(prev - trainingAge) ? curr : prev
    )
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Progress dots — hidden on disclaimer step */}
      {step !== "disclaimer" && (
        <div className="flex justify-center gap-2 mb-2">
          {PROGRESS_STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition-colors ${
                i <= PROGRESS_STEPS.indexOf(step) ? "bg-primary" : "bg-primary/20"
              }`}
            />
          ))}
        </div>
      )}

      {/* ── Step: Profile ───────────────────────────────────── */}
      {step === "profile" && (
        <>
          <h2 className="text-lg font-semibold text-primary text-center">About you</h2>
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
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <Button fullWidth size="lg" onClick={nextStep}>Next</Button>
        </>
      )}

      {/* ── Step: Body ──────────────────────────────────────── */}
      {step === "body" && (
        <>
          <h2 className="text-lg font-semibold text-primary text-center">Your body</h2>

          <Input
            label="Birthdate"
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="font-body text-sm font-medium text-primary">Gender</label>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    gender === g ? "bg-primary text-white" : "bg-primary/10 text-primary"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Height */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="font-body text-sm font-medium text-primary">Height</label>
              <button
                type="button"
                onClick={() => {
                  if (heightUnit === "imperial") {
                    const cm = getHeightCm();
                    if (cm > 0) setHeightCm(String(cm));
                    setHeightUnit("metric");
                  } else {
                    const cm = parseFloat(heightCm) || 0;
                    if (cm > 0) {
                      const totalIn = Math.round(cm / 2.54);
                      setHeightFt(String(Math.floor(totalIn / 12)));
                      setHeightIn(String(totalIn % 12));
                    }
                    setHeightUnit("imperial");
                  }
                }}
                className="text-xs font-medium text-primary/60 hover:text-primary transition-colors"
              >
                Switch to {heightUnit === "imperial" ? "cm" : "ft/in"}
              </button>
            </div>
            {heightUnit === "imperial" ? (
              <div className="flex gap-2">
                <Input type="number" placeholder="ft" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} min="3" max="8" className="flex-1" />
                <Input type="number" placeholder="in" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} min="0" max="11" className="flex-1" />
              </div>
            ) : (
              <Input type="number" placeholder="cm" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} min="100" max="275" />
            )}
          </div>

          {/* Weight */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="font-body text-sm font-medium text-primary">Weight</label>
              <button
                type="button"
                onClick={() => {
                  if (weightUnit === "imperial") {
                    const kg = getWeightKg();
                    if (kg > 0) setWeightKg(String(kg));
                    setWeightUnit("metric");
                  } else {
                    const kg = parseFloat(weightKg) || 0;
                    if (kg > 0) setWeightLbs(String(Math.round(kg / 0.453592)));
                    setWeightUnit("imperial");
                  }
                }}
                className="text-xs font-medium text-primary/60 hover:text-primary transition-colors"
              >
                Switch to {weightUnit === "imperial" ? "kg" : "lbs"}
              </button>
            </div>
            {weightUnit === "imperial" ? (
              <Input type="number" placeholder="lbs" value={weightLbs} onChange={(e) => setWeightLbs(e.target.value)} min="55" max="770" />
            ) : (
              <Input type="number" placeholder="kg" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} min="25" max="350" />
            )}
          </div>

          {/* Training Age */}
          <div className="flex flex-col gap-1">
            <label className="font-body text-sm font-medium text-primary">Training experience</label>
            <input
              type="range"
              min={0}
              max={TRAINING_AGE_STOPS.length - 1}
              step={1}
              value={trainingAgeIndex}
              onChange={(e) => setTrainingAge(TRAINING_AGE_STOPS[parseInt(e.target.value)])}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-primary/40 px-0.5">
              {TRAINING_AGE_STOPS.map((y) => (
                <span key={y}>{y}y</span>
              ))}
            </div>
            <p className="text-center text-sm font-medium text-primary">
              {trainingAge === 0 ? "Brand new" : trainingAge === 1 ? "1 year" : `${trainingAge} years`}
            </p>
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={prevStep}>Back</Button>
            <Button fullWidth size="lg" onClick={nextStep}>Next</Button>
          </div>
        </>
      )}

      {/* ── Step: Disclaimer ──────────────────────────────────── */}
      {step === "disclaimer" && (
        <DisclaimerScreen
          alreadyAccepted={disclaimerAccepted}
          onAccept={async () => {
            await acceptDisclaimer();
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(LOCALSTORAGE_KEY, new Date().toISOString());
              } catch {}
            }
            setDisclaimerAccepted(true);
            nextStep();
          }}
        />
      )}

      {/* ── Step: PAR-Q ──────────────────────────────────────── */}
      {step === "parq" && (
        <>
          <StepParq data={intakeData} update={updateIntake} />
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={prevStep}>Back</Button>
            <Button fullWidth size="lg" onClick={nextStep}>Next</Button>
          </div>
        </>
      )}

      {/* ── Step: Goals ──────────────────────────────────────── */}
      {step === "goals" && (
        <>
          <StepGoals data={intakeData} update={updateIntake} />
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={prevStep}>Back</Button>
            <Button fullWidth size="lg" disabled={!canAdvance()} onClick={nextStep}>Next</Button>
          </div>
        </>
      )}

      {/* ── Step: Preferences ────────────────────────────────── */}
      {step === "preferences" && (
        <>
          <StepPreferences data={intakeData} update={updateIntake} />
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={prevStep}>Back</Button>
            <Button fullWidth size="lg" disabled={!canAdvance()} onClick={nextStep}>Next</Button>
          </div>
        </>
      )}

      {/* ── Step: Review ─────────────────────────────────────── */}
      {step === "review" && (
        <>
          <StepReview data={intakeData} />
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={prevStep}>Back</Button>
            <Button fullWidth size="lg" onClick={handleSubmit}>
              {role === "solo" ? "Generate Program" : "Complete Setup"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
