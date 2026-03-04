"use client";

import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import type { Exercise } from "@/types/app.types";

interface ExerciseDemoModalProps {
  exercise: Exercise;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExerciseDemoModal({
  exercise,
  isOpen,
  onClose,
}: ExerciseDemoModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={exercise.name}>
      <div className="flex flex-col gap-4 pb-4">
        {/* Muscle group badge */}
        {exercise.muscle_group && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">{exercise.muscle_group}</Badge>
            {exercise.secondary_muscles?.map((m) => (
              <Badge key={m} variant="default">
                {m}
              </Badge>
            ))}
          </div>
        )}

        {/* Equipment */}
        {exercise.equipment && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary/40 mb-1">
              Equipment
            </p>
            <p className="text-sm text-primary">{exercise.equipment}</p>
          </div>
        )}

        {/* Instructions */}
        {exercise.instructions && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary/40 mb-1">
              Instructions
            </p>
            <p className="text-sm text-primary/80 whitespace-pre-line">
              {exercise.instructions}
            </p>
          </div>
        )}

        {/* Video link */}
        {exercise.video_url && (
          <a
            href={exercise.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Watch Demo Video
          </a>
        )}

        {/* Fallback if no info at all */}
        {!exercise.instructions && !exercise.video_url && !exercise.equipment && (
          <p className="text-sm text-primary/40 italic">
            No additional information available for this exercise.
          </p>
        )}
      </div>
    </Modal>
  );
}
