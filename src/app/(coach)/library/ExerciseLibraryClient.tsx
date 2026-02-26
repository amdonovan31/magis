"use client";

import { useState } from "react";
import { createExercise } from "@/lib/actions/exercise.actions";
import ExerciseCard from "@/components/exercises/ExerciseCard";
import ExerciseSearch from "@/components/exercises/ExerciseSearch";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { MUSCLE_GROUPS } from "@/types/app.types";
import type { Exercise } from "@/types/app.types";

interface ExerciseLibraryClientProps {
  initialExercises: Exercise[];
}

export default function ExerciseLibraryClient({
  initialExercises,
}: ExerciseLibraryClientProps) {
  const [exercises] = useState(initialExercises);
  const [filtered, setFiltered] = useState(initialExercises);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function handleSearch(params: { search: string; muscleGroup: string }) {
    let result = exercises;
    if (params.search) {
      result = result.filter((e) =>
        e.name.toLowerCase().includes(params.search.toLowerCase())
      );
    }
    if (params.muscleGroup) {
      result = result.filter((e) => e.muscle_group === params.muscleGroup);
    }
    setFiltered(result);
  }

  async function handleCreate(formData: FormData) {
    setCreating(true);
    setCreateError(null);
    const result = await createExercise(formData);
    if (result.error) {
      setCreateError(result.error);
    } else {
      setShowCreate(false);
      // In a real app, we'd refetch. For now, reload.
      window.location.reload();
    }
    setCreating(false);
  }

  return (
    <div className="flex flex-col gap-4 overflow-hidden px-4 pt-4">
      <div className="min-w-0">
        <ExerciseSearch onSearch={handleSearch} />
      </div>

      <Button
        variant="accent"
        fullWidth
        onClick={() => setShowCreate(true)}
      >
        + New Exercise
      </Button>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-primary/50">No exercises found.</p>
        ) : (
          filtered.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onSelect={() => {}}
            />
          ))
        )}
      </div>

      {/* Create exercise modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Exercise"
      >
        <form action={handleCreate} className="flex flex-col gap-4 pb-4">
          <Input label="Exercise Name" name="name" required placeholder="e.g. Barbell Squat" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-primary">Muscle Group</label>
            <select
              name="muscle_group"
              className="h-12 rounded-xl border border-primary/20 bg-white px-4 text-primary focus:border-primary focus:outline-none"
            >
              <option value="">Select muscle group</option>
              {MUSCLE_GROUPS.map((mg) => (
                <option key={mg} value={mg}>{mg}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-primary">Instructions</label>
            <textarea
              name="instructions"
              rows={3}
              placeholder="How to perform this exercise..."
              className="rounded-xl border border-primary/20 bg-white px-4 py-3 text-primary placeholder:text-primary/40 focus:border-primary focus:outline-none"
            />
          </div>
          <Input label="Video URL" name="video_url" type="url" placeholder="https://..." />
          {createError && (
            <p className="text-sm text-red-600">{createError}</p>
          )}
          <Button type="submit" fullWidth loading={creating}>
            Create Exercise
          </Button>
        </form>
      </Modal>
    </div>
  );
}
