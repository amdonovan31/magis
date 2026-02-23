interface WorkoutProgressProps {
  completed: number;
  total: number;
}

export default function WorkoutProgress({ completed, total }: WorkoutProgressProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-primary/60">
        <span>{completed} of {total} sets complete</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-primary/10">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
