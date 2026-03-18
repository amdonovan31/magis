"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Sparkline from "@/components/pr/Sparkline";
import type { PRSummary } from "@/types/app.types";
import { formatDate } from "@/lib/utils/date";

interface CoachPRSummaryProps {
  prs: PRSummary[];
}

export default function CoachPRSummary({ prs }: CoachPRSummaryProps) {
  const [showAll, setShowAll] = useState(false);

  if (prs.length === 0) {
    return (
      <p className="text-sm text-primary/40 italic">No personal records yet.</p>
    );
  }

  const displayed = showAll ? prs : prs.slice(0, 5);

  return (
    <div className="flex flex-col gap-2">
      {displayed.map((pr) => (
        <Card key={pr.exerciseId}>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-primary truncate">
                {pr.exerciseName}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-primary/70">
                  <span className="font-semibold">{pr.currentBest} kg</span>
                  {pr.currentBestReps ? (
                    <span className="text-primary/50">
                      {" "}
                      &times; {pr.currentBestReps}
                    </span>
                  ) : null}
                </p>
                {pr.muscleGroup && <Badge>{pr.muscleGroup}</Badge>}
              </div>
              <p className="text-xs text-primary/40 mt-0.5">
                {formatDate(pr.achievedAt)}
              </p>
            </div>
            {pr.recentPRs.length >= 2 && (
              <Sparkline values={pr.recentPRs.map((r) => r.value)} />
            )}
          </div>
        </Card>
      ))}

      {!showAll && prs.length > 5 && (
        <button
          onClick={() => setShowAll(true)}
          className="text-sm font-medium text-accent text-center py-2 active:opacity-70"
        >
          View All ({prs.length}) &rarr;
        </button>
      )}
    </div>
  );
}
