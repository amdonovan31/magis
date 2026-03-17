"use client";

import { useState, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";

const MUSCLE_GROUPS = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Core",
  "Calves",
  "Full Body",
  "Cardio",
] as const;

export interface ExerciseOption {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment?: string | null;
  instructions?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseOption) => void;
  exercises: ExerciseOption[];
  excludeIds?: string[];
  title?: string;
}

export default function ExerciseSearchModal({
  isOpen,
  onClose,
  onSelect,
  exercises,
  excludeIds = [],
  title = "Select Exercise",
}: Props) {
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("All");

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      if (excludeIds.includes(e.id)) return false;
      if (muscleFilter !== "All" && e.muscle_group !== muscleFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          (e.muscle_group ?? "").toLowerCase().includes(q) ||
          (e.equipment ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [exercises, excludeIds, muscleFilter, query]);

  function handleSelect(exercise: ExerciseOption) {
    onSelect(exercise);
    setQuery("");
    setMuscleFilter("All");
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {/* Search input */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, muscle group, or equipment..."
        autoFocus
        className="mb-3 h-12 w-full rounded-xl border border-primary/20 bg-surface px-4 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />

      {/* Muscle group filter pills */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {MUSCLE_GROUPS.map((mg) => (
          <button
            key={mg}
            type="button"
            onClick={() => setMuscleFilter(mg)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              muscleFilter === mg
                ? "bg-primary text-white"
                : "bg-primary/10 text-primary"
            }`}
          >
            {mg}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="max-h-64 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No exercises found</p>
        ) : (
          filtered.slice(0, 30).map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => handleSelect(e)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-primary/5 rounded-lg"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-primary truncate">{e.name}</p>
                {e.equipment && (
                  <p className="text-[10px] text-primary/40">{e.equipment}</p>
                )}
              </div>
              {e.muscle_group && (
                <Badge className="ml-2 shrink-0">{e.muscle_group}</Badge>
              )}
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
