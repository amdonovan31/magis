"use client";

import { useState, useTransition } from "react";
import Input from "@/components/ui/Input";
import { MUSCLE_GROUPS } from "@/types/app.types";
import { cn } from "@/lib/utils/cn";

interface ExerciseSearchProps {
  onSearch: (params: { search: string; muscleGroup: string }) => void;
}

export default function ExerciseSearch({ onSearch }: ExerciseSearchProps) {
  const [search, setSearch] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [, startTransition] = useTransition();

  const handleSearch = (newSearch: string, newMuscle: string) => {
    startTransition(() => {
      onSearch({ search: newSearch, muscleGroup: newMuscle });
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Search exercises..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          handleSearch(e.target.value, muscleGroup);
        }}
      />

      {/* Muscle group pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => {
            setMuscleGroup("");
            handleSearch(search, "");
          }}
          className={cn(
            "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            muscleGroup === ""
              ? "bg-primary text-white"
              : "bg-primary/10 text-primary"
          )}
        >
          All
        </button>
        {MUSCLE_GROUPS.map((mg) => (
          <button
            key={mg}
            onClick={() => {
              const next = muscleGroup === mg ? "" : mg;
              setMuscleGroup(next);
              handleSearch(search, next);
            }}
            className={cn(
              "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              muscleGroup === mg
                ? "bg-primary text-white"
                : "bg-primary/10 text-primary"
            )}
          >
            {mg}
          </button>
        ))}
      </div>
    </div>
  );
}
