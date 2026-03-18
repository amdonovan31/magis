"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import PRChart from "@/components/pr/PRChart";
import type { PRHistoryPoint } from "@/types/app.types";
import { fetchPRHistory } from "@/lib/actions/pr.actions";
import { formatDate } from "@/lib/utils/date";

interface PRDetailModalProps {
  exerciseId: string;
  exerciseName: string;
  isOpen: boolean;
  onClose: () => void;
}

type TimeFilter = "all" | "3mo" | "6mo" | "1yr";

const FILTER_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "3mo", label: "3mo" },
  { value: "6mo", label: "6mo" },
  { value: "1yr", label: "1yr" },
];

function filterByTime(
  data: PRHistoryPoint[],
  filter: TimeFilter
): PRHistoryPoint[] {
  if (filter === "all") return data;
  const now = Date.now();
  const months = filter === "3mo" ? 3 : filter === "6mo" ? 6 : 12;
  const cutoff = now - months * 30 * 24 * 60 * 60 * 1000;
  return data.filter((d) => new Date(d.date).getTime() >= cutoff);
}

export default function PRDetailModal({
  exerciseId,
  exerciseName,
  isOpen,
  onClose,
}: PRDetailModalProps) {
  const [data, setData] = useState<PRHistoryPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<TimeFilter>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const history = await fetchPRHistory(exerciseId);
      setData(history);
    } catch {
      setData([]);
    }
    setLoading(false);
  }, [exerciseId]);

  useEffect(() => {
    if (isOpen && exerciseId) {
      setData(null);
      setFilter("all");
      fetchData();
    }
  }, [isOpen, exerciseId, fetchData]);

  const filtered = data ? filterByTime(data, filter) : [];

  // Find all-time best
  const best = data?.reduce<PRHistoryPoint | null>(
    (max, d) => (!max || d.weight > max.weight ? d : max),
    null
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={exerciseName}>
      <div className="flex flex-col gap-4 pb-4">
        {/* Time filter pills */}
        <div className="flex gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === opt.value
                  ? "bg-primary text-white"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Chart area */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : filtered.length < 2 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <p className="text-primary/60">
              {data && data.length === 0
                ? "No PRs recorded yet."
                : data && data.length === 1
                  ? "One PR logged — keep training to see your trend."
                  : "No PRs in this time range."}
            </p>
            <p className="text-sm text-primary/40 mt-1">
              PRs are detected automatically when you complete a workout.
            </p>
          </div>
        ) : (
          <PRChart data={filtered} />
        )}

        {/* All-time best callout */}
        {best && (
          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-primary/50">All-Time Best</p>
                <p className="text-lg font-bold text-primary">
                  {best.weight} {best.unit}
                  {best.reps ? (
                    <span className="text-sm font-normal text-primary/60">
                      {" "}
                      × {best.reps}
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-primary/50">Est. 1RM</p>
                <p className="text-sm font-semibold text-muted">
                  ~{best.estimated1RM} {best.unit}
                </p>
                <p className="text-xs text-primary/40">
                  {formatDate(best.date)}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Modal>
  );
}
