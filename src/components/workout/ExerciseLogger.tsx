import SetRow from "./SetRow";
import type { WorkoutTemplateExerciseWithExercise, SetLog } from "@/types/app.types";

interface ExerciseLoggerProps {
  sessionId: string;
  templateExercise: WorkoutTemplateExerciseWithExercise;
  existingLogs: SetLog[];
}

export default function ExerciseLogger({
  sessionId,
  templateExercise,
  existingLogs,
}: ExerciseLoggerProps) {
  const setCount = templateExercise.prescribed_sets ?? 3;

  return (
    <div className="rounded-2xl bg-background overflow-hidden">
      {/* Exercise header */}
      <div className="px-4 py-3">
        <h3 className="font-semibold text-primary">{templateExercise.exercise.name}</h3>
        <p className="text-xs text-primary/50 mt-0.5">
          {setCount} sets × {templateExercise.prescribed_reps ?? "—"}
          {templateExercise.prescribed_weight
            ? ` @ ${templateExercise.prescribed_weight}`
            : ""}
          {templateExercise.rest_seconds
            ? ` · ${templateExercise.rest_seconds}s rest`
            : ""}
        </p>
      </div>

      {/* Set rows */}
      <div className="flex flex-col gap-2 px-2 pb-3">
        {/* Header row */}
        <div className="flex items-center gap-3 px-3">
          <span className="w-6" />
          <span className="flex-1 text-center text-[10px] font-medium uppercase tracking-wide text-primary/40">
            Reps
          </span>
          <span className="flex-1 text-center text-[10px] font-medium uppercase tracking-wide text-primary/40">
            Weight
          </span>
          <span className="w-10" />
        </div>

        {Array.from({ length: setCount }, (_, i) => {
          const setNum = i + 1;
          const existingLog = existingLogs.find(
            (l) =>
              l.template_exercise_id === templateExercise.id &&
              l.set_number === setNum
          );
          return (
            <SetRow
              key={setNum}
              sessionId={sessionId}
              templateExerciseId={templateExercise.id}
              setNumber={setNum}
              prescribedReps={templateExercise.prescribed_reps}
              prescribedWeight={templateExercise.prescribed_weight}
              initialCompleted={existingLog?.is_completed ?? false}
              initialReps={existingLog?.reps_completed ?? null}
              initialWeight={existingLog?.weight_used ?? null}
            />
          );
        })}
      </div>

      {templateExercise.notes && (
        <p className="px-4 pb-3 text-xs text-primary/50 italic">
          Note: {templateExercise.notes}
        </p>
      )}
    </div>
  );
}
