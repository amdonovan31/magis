import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Exercise } from "@/types/app.types";

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect?: (exercise: Exercise) => void;
  selected?: boolean;
  compact?: boolean;
}

export default function ExerciseCard({
  exercise,
  onSelect,
  selected,
  compact,
}: ExerciseCardProps) {
  const content = (
    <Card
      padding={compact ? "sm" : "md"}
      className={`cursor-pointer transition-all active:scale-[0.98] ${
        selected
          ? "ring-2 ring-primary bg-primary/5"
          : "hover:ring-1 hover:ring-primary/20"
      }`}
      onClick={() => onSelect?.(exercise)}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-primary truncate">{exercise.name}</p>
          {!compact && exercise.instructions && (
            <p className="mt-0.5 text-xs text-primary/50 line-clamp-2">
              {exercise.instructions}
            </p>
          )}
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          {exercise.muscle_group && (
            <Badge variant="default">{exercise.muscle_group}</Badge>
          )}
          {selected && (
            <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </Card>
  );

  return content;
}
