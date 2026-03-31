"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { searchExercises } from "@/lib/actions/exercise.actions";
import type { Exercise } from "@/types/app.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise, reason?: string) => void;
}

export default function ExerciseSearchModal({ isOpen, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [reason, setReason] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setReason("");
    }
  }, [isOpen]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const data = await searchExercises(value);
      setResults(data);
      setLoading(false);
    }, 300);
  }, []);

  function handleConfirm() {
    if (!selected) return;
    onSelect(selected, reason.trim() || undefined);
    onClose();
  }

  // Step 2: confirm selected exercise + optional reason
  if (selected) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Substitute Exercise">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-surface px-4 py-3">
            <p className="font-semibold text-primary">{selected.name}</p>
            {selected.muscle_group && (
              <span className="text-xs text-muted">{selected.muscle_group}</span>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-primary">
              Why are you swapping? <span className="text-primary/40">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. equipment not available"
              rows={2}
              className="mt-1 w-full rounded-xl border border-primary/20 bg-surface px-3 py-2 text-sm text-primary placeholder:text-primary/25 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setSelected(null)}>
              Back
            </Button>
            <Button fullWidth onClick={handleConfirm}>
              Confirm Swap
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Step 1: search
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Find Exercise">
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search exercises..."
          autoFocus
          className="h-12 w-full rounded-xl border border-primary/20 bg-surface px-4 text-primary placeholder:text-primary/25 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <div className="max-h-64 overflow-y-auto flex flex-col gap-1">
          {loading && (
            <p className="py-4 text-center text-sm text-muted">Searching...</p>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <p className="py-4 text-center text-sm text-muted">No exercises found</p>
          )}

          {results.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setSelected(ex)}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-primary/5 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-primary">{ex.name}</p>
                {ex.muscle_group && (
                  <p className="text-xs text-muted">{ex.muscle_group}</p>
                )}
              </div>
              {ex.equipment && (
                <span className="rounded-full bg-primary/5 px-2 py-0.5 text-[10px] text-primary/40">
                  {ex.equipment}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
