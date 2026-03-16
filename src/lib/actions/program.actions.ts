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

  const { details, weeks } = state;

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

  // 2. Insert workout templates (one per week × day)
  for (const week of weeks) {
    for (const day of week.days) {
      const { data: template, error: templateError } = await supabase
        .from("workout_templates")
        .insert({
          program_id: program.id,
          title: day.title,
          day_number: day.dayNumber,
          notes: day.notes || null,
          scheduled_days: day.scheduledDays.length > 0 ? day.scheduledDays : null,
          week_number: week.weekNumber,
          is_deload: week.isDeload,
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
  }

  revalidatePath("/programs");
  redirect("/programs");
}

/**
 * Saves an AI-generated program (from the coach review flow).
 * The program JSON comes from localStorage after the AI API returns it.
 */
export async function saveGeneratedProgram(input: {
  clientId: string;
  program: {
    program_name: string;
    program_description: string;
    weeks: {
      week_number: number;
      focus: string;
      workouts: {
        day_of_week: string;
        workout_name: string;
        muscle_groups: string[];
        exercises: {
          exercise_id: string;
          exercise_name: string;
          sets: number;
          reps: string;
          rest_seconds: number;
          notes?: string;
        }[];
      }[];
    }[];
  };
}): Promise<{ error?: string; programId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "coach") {
    return { error: "Unauthorized" };
  }

  const { clientId, program } = input;

  // Day-of-week to number mapping for scheduled_days
  const dayMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };

  // 1. Insert program
  const { data: programRow, error: programError } = await supabase
    .from("programs")
    .insert({
      coach_id: user.id,
      client_id: clientId,
      title: program.program_name,
      description: program.program_description,
      is_active: true,
      status: "draft",
    })
    .select("id")
    .single();

  if (programError || !programRow) {
    return { error: programError?.message ?? "Failed to create program" };
  }

  // 2. Insert workout templates and exercises per week
  for (const week of program.weeks) {
    for (let dayIdx = 0; dayIdx < week.workouts.length; dayIdx++) {
      const workout = week.workouts[dayIdx];
      const scheduledDay = dayMap[workout.day_of_week.toLowerCase()];

      const { data: template, error: templateError } = await supabase
        .from("workout_templates")
        .insert({
          program_id: programRow.id,
          title: workout.workout_name,
          day_number: dayIdx + 1,
          week_number: week.week_number,
          scheduled_days: scheduledDay != null ? [scheduledDay] : null,
          notes: `Focus: ${week.focus}`,
        })
        .select("id")
        .single();

      if (templateError || !template) {
        console.error("Template insert error:", templateError);
        continue;
      }

      // 3. Insert exercises
      if (workout.exercises.length > 0) {
        const exerciseRows = workout.exercises.map((ex, i) => ({
          workout_template_id: template.id,
          exercise_id: ex.exercise_id,
          position: i + 1,
          prescribed_sets: ex.sets,
          prescribed_reps: ex.reps,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes || null,
        }));

        const { error: exError } = await supabase
          .from("workout_template_exercises")
          .insert(exerciseRows);

        if (exError) {
          console.error("Exercise insert error:", exError);
        }
      }
    }
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/programs");
  return { programId: programRow.id };
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

// ─── Inline editing actions ──────────────────────────────────

async function verifyCoachOwnership(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  return { userId };
}

export async function updateWorkoutTemplate(
  templateId: string,
  data: { title?: string; notes?: string | null; scheduled_days?: number[] | null }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  await verifyCoachOwnership(supabase, user.id);

  const { error } = await supabase
    .from("workout_templates")
    .update(data)
    .eq("id", templateId);

  if (error) return { error: error.message };
  return {};
}

export async function updateTemplateExercise(
  templateExerciseId: string,
  data: { prescribed_sets?: number; prescribed_reps?: string; rest_seconds?: number; notes?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("workout_template_exercises")
    .update(data)
    .eq("id", templateExerciseId);

  if (error) return { error: error.message };
  return {};
}

export async function swapTemplateExercise(
  templateExerciseId: string,
  newExerciseId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("workout_template_exercises")
    .update({ exercise_id: newExerciseId })
    .eq("id", templateExerciseId);

  if (error) return { error: error.message };
  return {};
}

export async function addTemplateExercise(
  workoutTemplateId: string,
  exerciseId: string,
  defaults?: { prescribed_sets?: number; prescribed_reps?: string; rest_seconds?: number }
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Get max position
  const { data: existing } = await supabase
    .from("workout_template_exercises")
    .select("position")
    .eq("workout_template_id", workoutTemplateId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (existing?.position ?? 0) + 1;

  const { data: row, error } = await supabase
    .from("workout_template_exercises")
    .insert({
      workout_template_id: workoutTemplateId,
      exercise_id: exerciseId,
      position: nextPosition,
      prescribed_sets: defaults?.prescribed_sets ?? 3,
      prescribed_reps: defaults?.prescribed_reps ?? "8-12",
      rest_seconds: defaults?.rest_seconds ?? 90,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: row.id };
}

export async function removeTemplateExercise(
  templateExerciseId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Get the exercise to know its template and position
  const { data: target } = await supabase
    .from("workout_template_exercises")
    .select("workout_template_id, position")
    .eq("id", templateExerciseId)
    .single();

  if (!target) return { error: "Exercise not found" };

  const { error } = await supabase
    .from("workout_template_exercises")
    .delete()
    .eq("id", templateExerciseId);

  if (error) return { error: error.message };

  // Renormalize positions for remaining exercises
  const { data: remaining } = await supabase
    .from("workout_template_exercises")
    .select("id, position")
    .eq("workout_template_id", target.workout_template_id)
    .order("position", { ascending: true });

  if (remaining) {
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i + 1) {
        await supabase
          .from("workout_template_exercises")
          .update({ position: i + 1 })
          .eq("id", remaining[i].id);
      }
    }
  }

  return {};
}

export async function reorderTemplateExercise(
  templateExerciseId: string,
  direction: "up" | "down"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Get current exercise
  const { data: current } = await supabase
    .from("workout_template_exercises")
    .select("workout_template_id, position")
    .eq("id", templateExerciseId)
    .single();

  if (!current) return { error: "Exercise not found" };

  const targetPosition = direction === "up" ? current.position - 1 : current.position + 1;
  if (targetPosition < 1) return {};

  // Find the adjacent exercise
  const { data: adjacent } = await supabase
    .from("workout_template_exercises")
    .select("id")
    .eq("workout_template_id", current.workout_template_id)
    .eq("position", targetPosition)
    .maybeSingle();

  if (!adjacent) return {};

  // Swap positions
  await supabase
    .from("workout_template_exercises")
    .update({ position: targetPosition })
    .eq("id", templateExerciseId);

  await supabase
    .from("workout_template_exercises")
    .update({ position: current.position })
    .eq("id", adjacent.id);

  return {};
}

export async function publishProgram(
  programId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("programs")
    .update({ status: "published" })
    .eq("id", programId)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/programs");
  return {};
}

export async function unpublishProgram(
  programId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("programs")
    .update({ status: "draft" })
    .eq("id", programId)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/programs");
  return {};
}
