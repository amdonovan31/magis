"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PRSummary } from "@/types/app.types";
import PRList from "@/components/pr/PRList";

type Tab = "workouts" | "records" | "measurements" | "volume";

interface HistoryTabsProps {
  workoutsContent: React.ReactNode;
  prs: PRSummary[];
  measurementsContent: React.ReactNode;
  volumeContent: React.ReactNode;
}

export default function HistoryTabs({
  workoutsContent,
  prs,
  measurementsContent,
  volumeContent,
}: HistoryTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: Tab =
    tabParam === "records"
      ? "records"
      : tabParam === "measurements"
        ? "measurements"
        : tabParam === "volume"
          ? "volume"
          : "workouts";
  const initialExerciseId = searchParams.get("exercise") ?? undefined;

  const [tab, setTab] = useState<Tab>(initialTab);

  const tabs: { key: Tab; label: string }[] = [
    { key: "workouts", label: "Workouts" },
    { key: "records", label: "Records" },
    { key: "volume", label: "Volume" },
    { key: "measurements", label: "Body" },
  ];

  return (
    <>
      {/* Tab toggle */}
      <div className="flex gap-1 bg-primary/5 rounded-xl p-1 mb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
              tab === t.key
                ? "bg-surface text-primary shadow-sm"
                : "text-primary/50"
            }`}
          >
            {t.label}
            {t.key === "records" && prs.length > 0 && (
              <span className="ml-1 text-xs text-primary/40">
                {prs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "workouts" ? (
        workoutsContent
      ) : tab === "records" ? (
        <PRList prs={prs} initialExerciseId={initialExerciseId} />
      ) : tab === "volume" ? (
        volumeContent
      ) : (
        measurementsContent
      )}
    </>
  );
}
