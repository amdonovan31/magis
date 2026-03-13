"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

interface ExerciseSearchProps {
  exercises: { id: string; name: string; muscle_group: string | null }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  excludeIds?: string[];
  placeholder?: string;
}

export default function ExerciseSearch({
  exercises,
  selectedIds,
  onChange,
  excludeIds = [],
  placeholder = "Search exercises...",
}: ExerciseSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const available = exercises.filter(
    (e) =>
      !selectedIds.includes(e.id) &&
      !excludeIds.includes(e.id) &&
      (query === "" ||
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        (e.muscle_group ?? "").toLowerCase().includes(query.toLowerCase()))
  );

  const selected = exercises.filter((e) => selectedIds.includes(e.id));

  function add(id: string) {
    onChange([...selectedIds, id]);
    setQuery("");
  }

  function remove(id: string) {
    onChange(selectedIds.filter((i) => i !== id));
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((e) => (
            <span
              key={e.id}
              className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {e.name}
              <button
                type="button"
                onClick={() => remove(e.id)}
                className="ml-0.5 text-primary/40 hover:text-primary"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-primary/20 bg-surface px-4 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />

      {/* Dropdown */}
      {open && query.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-primary/10 bg-surface shadow-lg">
          {available.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No exercises found</p>
          ) : (
            available.slice(0, 20).map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => add(e.id)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors",
                  "hover:bg-primary/5 text-primary"
                )}
              >
                <span>{e.name}</span>
                {e.muscle_group && (
                  <span className="text-xs text-muted">{e.muscle_group}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
