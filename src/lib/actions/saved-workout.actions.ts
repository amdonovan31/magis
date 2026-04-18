"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveWorkoutFromSession(sessionId: string, title: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!title.trim()) return { error: "Title is required" };

  const { data: setLogs } = await supabase
    .from("set_logs")
    .select("exercise_id, set_number, reps_completed, weight_used")
    .eq("session_id", sessionId)
    .eq("is_completed", true)
    .not("exercise_id", "is", null)
    .order("set_number", { ascending: true });

  if (!setLogs || setLogs.length === 0) return { error: "No exercises to save" };

  const exerciseMap = new Map<
    string,
    { sets: number; lastReps: number | null; lastWeight: string | null }
  >();

  for (const log of setLogs) {
    const eid = log.exercise_id!;
    const existing = exerciseMap.get(eid);
    if (existing) {
      existing.sets++;
      existing.lastReps = log.reps_completed;
      existing.lastWeight = log.weight_used;
    } else {
      exerciseMap.set(eid, {
        sets: 1,
        lastReps: log.reps_completed,
        lastWeight: log.weight_used,
      });
    }
  }

  const { data: saved, error: insertError } = await supabase
    .from("saved_workouts")
    .insert({
      client_id: user.id,
      title: title.trim(),
      source: "custom",
    })
    .select("id")
    .single();

  if (insertError || !saved) return { error: insertError?.message ?? "Failed to save" };

  const exerciseRows = Array.from(exerciseMap.entries()).map(
    ([exerciseId, data], i) => ({
      saved_workout_id: saved.id,
      exercise_id: exerciseId,
      position: i + 1,
      default_sets: data.sets,
      default_reps: data.lastReps?.toString() ?? null,
      default_weight: data.lastWeight,
    })
  );

  const { error: exError } = await supabase
    .from("saved_workout_exercises")
    .insert(exerciseRows);

  if (exError) return { error: exError.message };

  revalidatePath("/my-library");
  return { success: true, savedWorkoutId: saved.id };
}

export async function saveWorkoutFromTemplate(
  workoutTemplateId: string,
  programTitle: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: template } = await supabase
    .from("workout_templates")
    .select(`
      id, title,
      exercises:workout_template_exercises(
        id, position, prescribed_sets, prescribed_reps, prescribed_weight, rest_seconds,
        exercise:exercises(id)
      )
    `)
    .eq("id", workoutTemplateId)
    .single();

  if (!template) return { error: "Template not found" };

  const { data: saved, error: insertError } = await supabase
    .from("saved_workouts")
    .insert({
      client_id: user.id,
      title: template.title ?? "Saved Workout",
      source: "program",
      source_template_id: workoutTemplateId,
      source_program_title: programTitle,
    })
    .select("id")
    .single();

  if (insertError || !saved) return { error: insertError?.message ?? "Failed to save" };

  const exercises = (template.exercises ?? []) as {
    position: number;
    prescribed_sets: number | null;
    prescribed_reps: string | null;
    prescribed_weight: string | null;
    rest_seconds: number | null;
    exercise: { id: string } | null;
  }[];

  const exerciseRows = exercises
    .filter((e) => e.exercise?.id)
    .sort((a, b) => a.position - b.position)
    .map((e, i) => ({
      saved_workout_id: saved.id,
      exercise_id: e.exercise!.id,
      position: i + 1,
      default_sets: e.prescribed_sets ?? 3,
      default_reps: e.prescribed_reps,
      default_weight: e.prescribed_weight,
      rest_seconds: e.rest_seconds,
    }));

  const { error: exError } = await supabase
    .from("saved_workout_exercises")
    .insert(exerciseRows);

  if (exError) return { error: exError.message };

  revalidatePath("/my-library");
  return { success: true, savedWorkoutId: saved.id };
}

export async function deleteSavedWorkout(savedWorkoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("saved_workouts")
    .delete()
    .eq("id", savedWorkoutId)
    .eq("client_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/my-library");
  return { success: true };
}

export async function startFromSavedWorkout(savedWorkoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: current } = await supabase
    .from("saved_workouts")
    .select("use_count")
    .eq("id", savedWorkoutId)
    .eq("client_id", user.id)
    .single();

  if (!current) return { error: "Saved workout not found" };

  await supabase
    .from("saved_workouts")
    .update({
      last_used_at: new Date().toISOString(),
      use_count: current.use_count + 1,
    })
    .eq("id", savedWorkoutId)
    .eq("client_id", user.id);

  // Create free workout session
  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({
      client_id: user.id,
      workout_template_id: null,
      program_id: null,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (error || !session) return { error: error?.message ?? "Failed to start session" };

  redirect(`/free-workout/${session.id}?saved=${savedWorkoutId}`);
}
