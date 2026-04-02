"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { logMeasurement, updateMeasurement } from "@/lib/actions/measurements.actions";

interface WeightCheckInCardProps {
  todayEntry: { id: string; value: number; unit: string } | null;
  preferredUnit: string;
}

export default function WeightCheckInCard({
  todayEntry,
  preferredUnit,
}: WeightCheckInCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(todayEntry?.value?.toString() ?? "");
  const [isPending, startTransition] = useTransition();

  const showInput = !todayEntry || editing;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(value);
    if (!num || num <= 0) return;

    startTransition(async () => {
      if (todayEntry && editing) {
        await updateMeasurement({ id: todayEntry.id, value: num, unit: preferredUnit });
      } else {
        await logMeasurement({ metricType: "weight", value: num, unit: preferredUnit });
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (!showInput && todayEntry) {
    return (
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-primary/50">Today&apos;s weight</span>
            <span className="text-sm font-semibold text-primary">
              {Number.isInteger(todayEntry.value)
                ? todayEntry.value
                : todayEntry.value.toFixed(1)}{" "}
              {preferredUnit}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setValue(todayEntry.value.toString());
              setEditing(true);
            }}
            className="text-xs font-medium text-accent hover:text-accent/80 transition-colors"
          >
            Edit
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <span className="text-sm text-primary/50 shrink-0">
          {editing ? "Update weight" : "Log weight"}
        </span>
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="—"
            className="h-9 w-24 rounded-lg border border-primary/20 bg-surface px-3 text-sm font-semibold text-primary text-center focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-primary/25"
            autoFocus={editing}
          />
          <span className="text-xs text-primary/40">{preferredUnit}</span>
        </div>
        <button
          type="submit"
          disabled={isPending || !value}
          className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          {isPending ? "..." : editing ? "Save" : "Log"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-primary/40 hover:text-primary/60 transition-colors"
          >
            Cancel
          </button>
        )}
      </form>
    </Card>
  );
}
