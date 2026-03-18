"use client";

import { useState, useCallback, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { logMeasurement } from "@/lib/actions/measurements.actions";
import { getTodayISO } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

interface LogMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const METRIC_TYPES = [
  { key: "weight", label: "Weight", defaultUnit: "kg", altUnit: "lbs", unitType: "weight" },
  { key: "body_fat", label: "Body Fat %", defaultUnit: "%", altUnit: null, unitType: "percent" },
  { key: "chest", label: "Chest", defaultUnit: "cm", altUnit: "in", unitType: "length" },
  { key: "waist", label: "Waist", defaultUnit: "cm", altUnit: "in", unitType: "length" },
  { key: "hips", label: "Hips", defaultUnit: "cm", altUnit: "in", unitType: "length" },
  { key: "left_arm", label: "Left Arm", defaultUnit: "cm", altUnit: "in", unitType: "length" },
  { key: "right_arm", label: "Right Arm", defaultUnit: "cm", altUnit: "in", unitType: "length" },
  { key: "left_thigh", label: "Left Thigh", defaultUnit: "cm", altUnit: "in", unitType: "length" },
  { key: "right_thigh", label: "Right Thigh", defaultUnit: "cm", altUnit: "in", unitType: "length" },
  { key: "neck", label: "Neck", defaultUnit: "cm", altUnit: "in", unitType: "length" },
  { key: "custom", label: "Custom", defaultUnit: "cm", altUnit: "in", unitType: "length" },
] as const;

type UnitType = "weight" | "percent" | "length";

const STORAGE_KEY = "magis_unit_prefs";

function loadUnitPrefs(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveUnitPrefs(prefs: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export default function LogMeasurementModal({
  isOpen,
  onClose,
}: LogMeasurementModalProps) {
  const [metricType, setMetricType] = useState("weight");
  const [customName, setCustomName] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(getTodayISO);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unitPrefs, setUnitPrefs] = useState<Record<string, string>>(loadUnitPrefs);

  // Re-initialize date when modal opens
  useEffect(() => {
    if (isOpen) {
      setDate(getTodayISO());
      setError("");
    }
  }, [isOpen]);

  const selectedMetric = METRIC_TYPES.find((m) => m.key === metricType) ?? METRIC_TYPES[0];
  const unitType: UnitType = selectedMetric.unitType as UnitType;

  const currentUnit =
    unitType === "percent"
      ? "%"
      : unitPrefs[unitType] ?? selectedMetric.defaultUnit;

  const toggleUnit = useCallback(() => {
    if (!selectedMetric.altUnit) return;
    const newUnit =
      currentUnit === selectedMetric.defaultUnit
        ? selectedMetric.altUnit
        : selectedMetric.defaultUnit;
    const next = { ...unitPrefs, [unitType]: newUnit };
    setUnitPrefs(next);
    saveUnitPrefs(next);
  }, [currentUnit, selectedMetric, unitPrefs, unitType]);

  function resetForm() {
    setValue("");
    setNotes("");
    setCustomName("");
    setMetricType("weight");
    setDate(getTodayISO());
    setError("");
  }

  async function handleSubmit() {
    setError("");

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setError("Enter a valid value");
      return;
    }

    const resolvedType =
      metricType === "custom" ? customName.trim() : metricType;
    if (!resolvedType) {
      setError("Enter a metric name");
      return;
    }

    setLoading(true);
    const result = await logMeasurement({
      metricType: resolvedType,
      value: numValue,
      unit: currentUnit,
      measuredAt: new Date(date + "T00:00:00").toISOString(),
      notes: notes.trim() || undefined,
    });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    resetForm();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Measurement">
      <div className="flex flex-col gap-5 pb-4">
        {/* Metric type selector */}
        <div>
          <label className="text-sm font-medium text-primary">
            Metric
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {METRIC_TYPES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMetricType(m.key)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  metricType === m.key
                    ? "bg-accent text-accent-light"
                    : "border border-primary/10 bg-bg text-primary hover:border-primary/30"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom metric name */}
        {metricType === "custom" && (
          <Input
            label="Metric Name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Calves, Forearm"
          />
        )}

        {/* Value + unit */}
        <div>
          <label className="text-sm font-medium text-primary">
            Value
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.0"
              className={cn(
                "h-14 flex-1 rounded-xl border border-primary/20 bg-surface px-4",
                "text-2xl font-semibold text-primary text-center",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
                "placeholder:text-primary/25"
              )}
            />

            {/* Unit toggle or fixed label */}
            {selectedMetric.altUnit ? (
              <div className="flex rounded-xl border border-primary/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    if (currentUnit !== selectedMetric.defaultUnit) toggleUnit();
                  }}
                  className={cn(
                    "px-3 py-2.5 text-sm font-medium transition-colors",
                    currentUnit === selectedMetric.defaultUnit
                      ? "bg-accent text-accent-light"
                      : "bg-bg text-primary hover:bg-primary/5"
                  )}
                >
                  {selectedMetric.defaultUnit}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUnit !== selectedMetric.altUnit) toggleUnit();
                  }}
                  className={cn(
                    "px-3 py-2.5 text-sm font-medium transition-colors",
                    currentUnit === selectedMetric.altUnit
                      ? "bg-accent text-accent-light"
                      : "bg-bg text-primary hover:bg-primary/5"
                  )}
                >
                  {selectedMetric.altUnit}
                </button>
              </div>
            ) : (
              <span className="text-lg font-medium text-primary/60 w-10 text-center">
                {currentUnit}
              </span>
            )}
          </div>
        </div>

        {/* Date */}
        <div>
          <label htmlFor="measurement-date" className="text-sm font-medium text-primary">
            Date
          </label>
          <input
            id="measurement-date"
            type="date"
            value={date}
            max={getTodayISO()}
            onChange={(e) => setDate(e.target.value)}
            className={cn(
              "mt-2 h-12 w-full rounded-xl border border-primary/20 bg-surface px-4",
              "text-sm text-primary",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
            )}
          />
        </div>

        {/* Notes */}
        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. morning fasted, post-workout"
        />

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          loading={loading}
          fullWidth
        >
          Save Measurement
        </Button>
      </div>
    </Modal>
  );
}
