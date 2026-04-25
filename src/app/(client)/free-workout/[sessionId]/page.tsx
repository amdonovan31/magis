import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSavedWorkoutDetail } from "@/lib/queries/saved-workout.queries";
import FreeWorkoutClient from "@/components/workout/FreeWorkoutClient";
import CardioWorkoutClient from "@/components/workout/CardioWorkoutClient";
import type { SetLog } from "@/types/app.types";

interface FreeWorkoutPageProps {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ saved?: string }>;
}

export default async function FreeWorkoutPage({ params, searchParams }: FreeWorkoutPageProps) {
  const { sessionId } = await params;
  const { saved: savedWorkoutId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("workout_sessions")
    .select("id, client_id, status, started_at, free_workout_type, free_workout_modality")
    .eq("id", sessionId)
    .single();

  if (!session || session.client_id !== user.id) redirect("/home");
  if (session.status === "completed") redirect(`/workout/${sessionId}/summary`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_unit")
    .eq("id", user.id)
    .single();
  const preferredUnit = (profile?.preferred_unit as "kg" | "lbs") ?? "lbs";

  // Cardio free workout → render CardioWorkoutClient
  if (session.free_workout_type === "cardio" && session.free_workout_modality) {
    return (
      <CardioWorkoutClient
        sessionId={sessionId}
        startedAt={session.started_at}
        prescription={{
          modality: session.free_workout_modality,
          durationMinutes: null,
          distanceTarget: null,
          distanceUnit: null,
          hrZone: null,
          notes: null,
        }}
        templateTitle={`Free ${session.free_workout_modality}`}
        preferredUnit={preferredUnit}
      />
    );
  }

  // Strength free workout
  const { data: setLogs } = await supabase
    .from("set_logs")
    .select("*, exercise:exercises!exercise_id(id, name, muscle_group)")
    .eq("session_id", sessionId)
    .order("set_number", { ascending: true });

  // If started from a saved workout, fetch the template exercises
  let initialExercises: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string | null;
    defaultSets: number;
    defaultReps: string | null;
    defaultWeight: string | null;
  }[] | undefined;

  if (savedWorkoutId && (!setLogs || setLogs.length === 0)) {
    const saved = await getSavedWorkoutDetail(savedWorkoutId);
    if (saved) {
      initialExercises = saved.exercises.map((e) => ({
        exerciseId: e.exercise_id,
        exerciseName: e.exercise?.name ?? "Exercise",
        muscleGroup: e.exercise?.muscle_group ?? null,
        defaultSets: e.default_sets,
        defaultReps: e.default_reps,
        defaultWeight: e.default_weight,
      }));
    }
  }

  return (
    <FreeWorkoutClient
      sessionId={sessionId}
      startedAt={session.started_at}
      existingLogs={(setLogs ?? []) as SetLog[]}
      preferredUnit={preferredUnit}
      initialExercises={initialExercises}
    />
  );
}
