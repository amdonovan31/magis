"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProgramBuilderState } from "@/types/app.types";

/**
 * Creates a full program with all workout templates and exercises.
 * This is the most complex write in the app — nested inserts across 3 tables.
 */
export async function createProgram(state: ProgramBuilderState) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "coach") {
    return { error: "Unauthorized" };
  }

  const { details, days } = state;

  // 1. Insert program
  const { data: program, error: programError } = await supabase
    .from("programs")
    .insert({
      coach_id: user.id,
      client_id: details.clientId || null,
      title: details.title,
      description: details.description || null,
      starts_on: details.startsOn || null,
      is_active: true,
    })
    .select("id")
    .single();

  if (programError || !program) {
    return { error: programError?.message ?? "Failed to create program" };
  }

  // 2. Insert workout templates
  for (let i = 0; i < days.length; i++) {
    const day = days[i];

    const { data: template, error: templateError } = await supabase
      .from("workout_templates")
      .insert({
        program_id: program.id,
        title: day.title,
        day_number: day.dayNumber,
        notes: day.notes || null,
        scheduled_days: day.scheduledDays.length > 0 ? day.scheduledDays : null,
      })
      .select("id")
      .single();

    if (templateError || !template) {
      return { error: templateError?.message ?? "Failed to create workout template" };
    }

    // 3. Insert exercises for this template
    if (day.exercises.length > 0) {
      const exerciseRows = day.exercises.map((ex) => ({
        workout_template_id: template.id,
        exercise_id: ex.exerciseId,
        position: ex.position,
        prescribed_sets: ex.prescribedSets || null,
        prescribed_reps: ex.prescribedReps || null,
        prescribed_weight: ex.prescribedWeight || null,
        rest_seconds: ex.restSeconds || null,
        notes: ex.notes || null,
      }));

      const { error: exercisesError } = await supabase
        .from("workout_template_exercises")
        .insert(exerciseRows);

      if (exercisesError) {
        return { error: exercisesError.message };
      }
    }
  }

  revalidatePath("/programs");
  redirect("/programs");
}

export async function updateProgramClient(programId: string, clientId: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("programs")
    .update({ client_id: clientId })
    .eq("id", programId)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/programs");
  return { success: true };
}

export async function deleteProgram(programId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("programs")
    .delete()
    .eq("id", programId)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/programs");
  return { success: true };
}
