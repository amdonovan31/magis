"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Sparkline from "@/components/pr/Sparkline";
import PRDetailModal from "@/components/pr/PRDetailModal";
import type { PRSummary } from "@/types/app.types";
import { formatDate } from "@/lib/utils/date";

type SortMode = "recent" | "az" | "muscle";

interface PRListProps {
  prs: PRSummary[];
  /** If provided, auto-open this exercise's detail modal on mount */
  initialExerciseId?: string;
}

function isRecentPR(achievedAt: string): boolean {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return new Date(achievedAt).getTime() >= sevenDaysAgo;
}

function sortPRs(prs: PRSummary[], mode: SortMode): PRSummary[] {
  const sorted = [...prs];
  switch (mode) {
    case "recent":
      sorted.sort(
        (a, b) =>
          new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
      );
      break;
    case "az":
      sorted.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
      break;
    case "muscle":
      sorted.sort((a, b) => {
        const ga = a.muscleGroup ?? "ZZZ";
        const gb = b.muscleGroup ?? "ZZZ";
        if (ga !== gb) return ga.localeCompare(gb);
        return a.exerciseName.localeCompare(b.exerciseName);
      });
      break;
  }
  return sorted;
}

export default function PRList({ prs, initialExerciseId }: PRListProps) {
  const [sort, setSort] = useState<SortMode>("recent");
  const [selectedExercise, setSelectedExercise] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Auto-open from URL param
  useEffect(() => {
    if (initialExerciseId) {
      const match = prs.find((p) => p.exerciseId === initialExerciseId);
      if (match) {
        setSelectedExercise({
          id: match.exerciseId,
          name: match.exerciseName,
        });
      }
    }
  }, [initialExerciseId, prs]);

  const sorted = sortPRs(prs, sort);

  if (prs.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <p className="text-primary/60">No personal records yet.</p>
        <p className="text-sm text-primary/40 mt-1">
          Complete workouts to start tracking PRs automatically.
        </p>
      </div>
    );
  }

  let currentGroup = "";

  return (
    <>
      {/* Sort controls */}
      <div className="flex gap-2 mb-3">
        {(
          [
            { value: "recent", label: "Recent" },
            { value: "az", label: "A–Z" },
            { value: "muscle", label: "Muscle" },
          ] as { value: SortMode; label: string }[]
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              sort === opt.value
                ? "bg-primary text-white"
                : "bg-primary/10 text-primary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-2">
        {sorted.map((pr) => {
          // Show muscle group header when sorting by muscle
          let groupHeader: React.ReactNode = null;
          if (sort === "muscle" && (pr.muscleGroup ?? "Other") !== currentGroup) {
            currentGroup = pr.muscleGroup ?? "Other";
            groupHeader = (
              <p
                key={`group-${currentGroup}`}
                className="text-xs font-semibold uppercase tracking-wide text-primary/40 mt-2 first:mt-0"
              >
                {currentGroup}
              </p>
            );
          }

          return (
            <div key={pr.exerciseId}>
              {groupHeader}
              <button
                onClick={() =>
                  setSelectedExercise({
                    id: pr.exerciseId,
                    name: pr.exerciseName,
                  })
                }
                className="w-full text-left"
              >
                <Card className="active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3">
                    {/* Left: exercise info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isRecentPR(pr.achievedAt) && (
                          <span className="inline-block h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                        )}
                        <p className="font-medium text-primary truncate">
                          {pr.exerciseName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm text-primary/70">
                          <span className="font-semibold">{pr.currentBest} {pr.unit}</span>
                          {pr.currentBestReps ? (
                            <span className="text-primary/50">
                              {" "}
                              × {pr.currentBestReps}
                            </span>
                          ) : null}
                        </p>
                        {pr.muscleGroup && sort !== "muscle" && (
                          <Badge>{pr.muscleGroup}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-primary/40">
                          ~{pr.estimated1RM} {pr.unit} e1RM
                        </p>
                        <p className="text-xs text-primary/40">
                          {formatDate(pr.achievedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Right: sparkline */}
                    {pr.recentPRs.length >= 2 && (
                      <Sparkline values={pr.recentPRs.map((r) => r.value)} />
                    )}
                  </div>
                </Card>
              </button>
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      {selectedExercise && (
        <PRDetailModal
          exerciseId={selectedExercise.id}
          exerciseName={selectedExercise.name}
          isOpen={!!selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </>
  );
}
