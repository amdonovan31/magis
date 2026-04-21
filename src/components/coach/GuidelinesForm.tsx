"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  saveCoachGuidelines,
  type GuidelinesData,
} from "@/lib/actions/guidelines.actions";
import ExerciseSearch from "./ExerciseSearch";
import { CARDIO_MODALITIES, HR_ZONES } from "@/types/app.types";
import { cn } from "@/lib/utils/cn";

interface GuidelinesFormProps {
  clientId: string;
  exercises: { id: string; name: string; muscle_group: string | null }[];
}

const INTENSITY_OPTIONS = ["Beginner", "Intermediate", "Advanced"];
const PERIODIZATION_OPTIONS = [
  "Linear",
  "Undulating (DUP)",
  "Block",
  "Wave Loading",
  "None",
];

export default function GuidelinesForm({
  clientId,
  exercises,
}: GuidelinesFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [weeks, setWeeks] = useState(4);
  const [intensity, setIntensity] = useState("");
  const [periodization, setPeriodization] = useState("");
  const [includeIds, setIncludeIds] = useState<string[]>([]);
  const [avoidIds, setAvoidIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [includeCardio, setIncludeCardio] = useState(false);
  const [cardioDays, setCardioDays] = useState(2);
  const [cardioMods, setCardioMods] = useState<string[]>([]);
  const [cardioZone, setCardioZone] = useState<number | null>(null);
  const [cardioNotes, setCardioNotes] = useState("");

  const canSubmit = weeks >= 1 && intensity !== "";

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    const data: GuidelinesData = {
      client_id: clientId,
      program_length_weeks: weeks,
      intensity_level: intensity,
      periodization_style: periodization || "None",
      exercises_to_include: includeIds.length > 0 ? includeIds : null,
      exercises_to_avoid: avoidIds.length > 0 ? avoidIds : null,
      additional_notes: notes.trim() || null,
      include_cardio: includeCardio,
      cardio_days_per_week: includeCardio ? cardioDays : null,
      cardio_modalities: includeCardio && cardioMods.length > 0 ? cardioMods : null,
      cardio_zone_focus: includeCardio ? cardioZone : null,
      cardio_notes: includeCardio && cardioNotes.trim() ? cardioNotes.trim() : null,
    };

    const result = await saveCoachGuidelines(data);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/clients/${clientId}/generate/loading?guidelinesId=${result.id}`);
  }

  return (
    <Card padding="lg">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
        Coach Guidelines
      </h3>

      <div className="flex flex-col gap-5">
        {/* Program length */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-primary">
            Number of weeks <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={52}
            value={weeks}
            onChange={(e) => setWeeks(parseInt(e.target.value) || 1)}
            className="h-12 w-full rounded-xl border border-primary/20 bg-surface px-4 text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Intensity */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-primary">
            Intensity level <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {INTENSITY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setIntensity(opt)}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  intensity === opt
                    ? "bg-accent text-accent-light"
                    : "border border-primary/10 bg-bg text-primary hover:border-primary/30"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Periodization */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-primary">
            Periodization style
          </label>
          <div className="flex flex-wrap gap-2">
            {PERIODIZATION_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() =>
                  setPeriodization(periodization === opt ? "" : opt)
                }
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  periodization === opt
                    ? "bg-accent text-accent-light"
                    : "border border-primary/10 bg-bg text-primary hover:border-primary/30"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises to include */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-primary">
            Exercises to include
          </label>
          <ExerciseSearch
            exercises={exercises}
            selectedIds={includeIds}
            onChange={setIncludeIds}
            excludeIds={avoidIds}
            placeholder="Search exercises to include..."
          />
        </div>

        {/* Exercises to avoid */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-primary">
            Exercises to avoid
          </label>
          <ExerciseSearch
            exercises={exercises}
            selectedIds={avoidIds}
            onChange={setAvoidIds}
            excludeIds={includeIds}
            placeholder="Search exercises to avoid..."
          />
        </div>

        {/* Cardio */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setIncludeCardio(!includeCardio)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
              includeCardio
                ? "bg-accent text-accent-light"
                : "border border-primary/10 bg-bg text-primary hover:border-primary/30"
            )}
          >
            <span>{includeCardio ? "✓" : "+"}</span>
            Include cardio days
          </button>

          {includeCardio && (
            <div className="flex flex-col gap-4 rounded-xl border border-primary/10 bg-bg p-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-primary">Cardio days per week</label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={cardioDays}
                  onChange={(e) => setCardioDays(parseInt(e.target.value) || 1)}
                  className="h-10 w-20 rounded-xl border border-primary/20 bg-surface px-3 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-primary">Available modalities</label>
                <div className="flex flex-wrap gap-1.5">
                  {CARDIO_MODALITIES.map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() =>
                        setCardioMods((prev) =>
                          prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
                        )
                      }
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        cardioMods.includes(mod)
                          ? "bg-primary text-white"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {mod}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-primary">Primary zone focus</label>
                <select
                  value={cardioZone ?? ""}
                  onChange={(e) => setCardioZone(e.target.value ? parseInt(e.target.value) : null)}
                  className="h-10 rounded-xl border border-primary/20 bg-surface px-3 text-sm text-primary"
                >
                  <option value="">No preference</option>
                  {HR_ZONES.map((z) => (
                    <option key={z.zone} value={z.zone}>
                      {z.label} — {z.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-primary">Cardio notes</label>
                <textarea
                  value={cardioNotes}
                  onChange={(e) => setCardioNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g., client has a bike at home, no pool access"
                  className="rounded-xl border border-primary/20 bg-surface px-3 py-2 text-sm text-primary resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-primary">
            Additional coaching notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add any specific coaching instructions, client preferences, or context for the AI..."
            className="w-full rounded-xl border border-primary/20 bg-surface px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          Generate Program
        </Button>
      </div>
    </Card>
  );
}
