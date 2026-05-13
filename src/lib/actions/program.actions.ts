"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { getTodayISO } from "@/lib/utils/date";
import type { ProgramBuilderState } from "@/types/app.types";
import type { Json } from "@/types/database.types";

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

  // 1. Insert program. starts_on/ends_on are required by the schema; use today
  //    as a placeholder for drafts. publish_program overwrites starts_on, and
  //    the scheduled_workouts trigger overwrites ends_on once workouts exist.
  const startsOn = details.startsOn || getTodayISO();
  const { data: program, error: programError } = await supabase
    .from("programs")
    .insert({
      coach_id: user.id,
      client_id: details.clientId || null,
      title: details.title,
      description: details.description || null,
      starts_on: startsOn,
      ends_on: startsOn,
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
          type: day.type ?? "strength",
          cardio_modality: day.cardio?.modality || null,
          cardio_duration_minutes: day.cardio?.durationMinutes ?? null,
          cardio_distance_target: day.cardio?.distanceTarget ?? null,
          cardio_distance_unit: day.cardio?.distanceUnit || null,
          cardio_hr_zone: day.cardio?.hrZone ?? null,
          cardio_notes: day.cardio?.notes || null,
        })
        .select("id")
        .single();

      if (templateError || !template) {
        return { error: templateError?.message ?? "Failed to create workout template" };
      }

      // 3. Insert exercises for this template (strength days only)
      if (day.type !== "cardio" && day.exercises.length > 0) {
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
  programId: string,
  startsOn: string
): Promise<{ error?: string; archivedProgramName?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const built = await buildScheduledWorkoutRows(programId, startsOn);
  if ("error" in built) return { error: built.error };

  const { data, error } = await supabase.rpc("publish_program", {
    p_program_id: programId,
    p_starts_on: startsOn,
    p_scheduled_workouts: built.rows as unknown as Json,
  });

  if (error) {
    logger.error("publish_program RPC failed", { error });
    return { error: error.message };
  }

  revalidatePath("/programs");
  revalidatePath("/calendar");

  const archivedProgramName =
    (data as { archived_program_title?: string | null } | null)?.archived_program_title ?? undefined;

  return { archivedProgramName };
}

/**
 * Schedule a program for a future start date. If startsOn is today (in the
 * client's TZ) or earlier, immediately publish — keeps same-day swap snappy
 * instead of forcing the user to wait for the next dashboard load to fire
 * lazy promotion. Otherwise, set status='scheduled' and let
 * promote_scheduled_programs flip it to published when the date arrives.
 */
export async function scheduleProgram(
  programId: string,
  startsOn: string,
): Promise<{ error?: string; archivedProgramName?: string; scheduled?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Resolve client's timezone for the today comparison.
  const { data: program } = await supabase
    .from("programs")
    .select("client_id")
    .eq("id", programId)
    .eq("coach_id", user.id)
    .single();
  if (!program) return { error: "Program not found" };

  let clientTz: string | null = null;
  if (program.client_id) {
    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", program.client_id)
      .single();
    clientTz = clientProfile?.timezone ?? null;
  }
  const todayISO = getTodayISO(clientTz);
  const goLiveNow = startsOn <= todayISO;

  const built = await buildScheduledWorkoutRows(programId, startsOn);
  if ("error" in built) return { error: built.error };

  const { data, error } = await supabase.rpc("publish_program", {
    p_program_id: programId,
    p_starts_on: startsOn,
    p_scheduled_workouts: built.rows as unknown as Json,
    p_target_status: goLiveNow ? "published" : "scheduled",
  });

  if (error) {
    logger.error("publish_program RPC failed", { error, mode: goLiveNow ? "publish" : "schedule" });
    return { error: error.message };
  }

  revalidatePath("/programs");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/clients");

  const archivedProgramName =
    (data as { archived_program_title?: string | null } | null)?.archived_program_title ?? undefined;

  return { archivedProgramName, scheduled: !goLiveNow };
}

/**
 * Cancel a scheduled program: revert status back to 'draft' and drop its
 * scheduled_workouts (the trigger resets ends_on to starts_on). Leaves the
 * program intact so the coach can edit and re-schedule. Surfaces back on the
 * coach dashboard's "Next Program" badge for the affected client on next read.
 */
export async function cancelScheduledProgram(
  programId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: program } = await supabase
    .from("programs")
    .select("status")
    .eq("id", programId)
    .eq("coach_id", user.id)
    .single();
  if (!program) return { error: "Program not found" };
  if (program.status !== "scheduled") {
    return { error: `Cannot cancel a program in '${program.status}' status` };
  }

  const { error: deleteError } = await supabase
    .from("scheduled_workouts")
    .delete()
    .eq("program_id", programId);
  if (deleteError) {
    logger.error("Failed to delete scheduled_workouts on cancel", { error: deleteError });
    return { error: deleteError.message };
  }

  const { error: updateError } = await supabase
    .from("programs")
    .update({ status: "draft" })
    .eq("id", programId)
    .eq("coach_id", user.id);
  if (updateError) {
    logger.error("Failed to revert program to draft on cancel", { error: updateError });
    return { error: updateError.message };
  }

  revalidatePath("/programs");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  return {};
}

interface ScheduledWorkoutRow {
  client_id: string;
  program_id: string;
  workout_template_id: string;
  scheduled_date: string;
  status: "scheduled";
}

/**
 * Read a program's workout_templates and compute the scheduled_workouts rows
 * for a given starts_on date. Pure with respect to the DB — no writes.
 * Caller (publish_program RPC) handles the atomic delete+insert.
 */
export async function buildScheduledWorkoutRows(
  programId: string,
  startsOn: string,
): Promise<{ error: string } | { rows: ScheduledWorkoutRow[] }> {
  const supabase = await createClient();

  const { data: program } = await supabase
    .from("programs")
    .select("client_id")
    .eq("id", programId)
    .single();

  if (!program || !program.client_id) {
    return { error: "Program missing client" };
  }

  const { data: templates } = await supabase
    .from("workout_templates")
    .select("id, week_number, scheduled_days")
    .eq("program_id", programId)
    .order("week_number")
    .order("day_number");

  if (!templates || templates.length === 0) {
    return { error: "No workout templates found" };
  }

  const start = new Date(startsOn + "T00:00:00");
  const clientId = program.client_id;

  const rows: ScheduledWorkoutRow[] = templates.flatMap((t) => {
    const days = (t.scheduled_days as number[] | null) ?? [];
    return days.map((scheduledDay) => {
      // starts_on is Monday (day 1). Compute offset from Monday.
      // 0=Sun→6, 1=Mon→0, 2=Tue→1, ..., 6=Sat→5
      const offset = scheduledDay === 0 ? 6 : scheduledDay - 1;
      const weekOffset = ((t.week_number ?? 1) - 1) * 7;
      const date = new Date(start);
      date.setDate(start.getDate() + weekOffset + offset);

      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      return {
        client_id: clientId,
        program_id: programId,
        workout_template_id: t.id,
        scheduled_date: dateStr,
        status: "scheduled" as const,
      };
    });
  });

  return { rows };
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

export interface ProgramEditChanges {
  exerciseUpdates: { id: string; prescribed_sets?: number; prescribed_reps?: string; prescribed_weight?: string; rest_seconds?: number }[];
  exerciseSwaps: { id: string; new_exercise_id: string }[];
  exerciseAdds: { workout_template_id: string; exercise_id: string; prescribed_sets?: number; prescribed_reps?: string; rest_seconds?: number }[];
  exerciseRemoves: string[];
  templateUpdates: { id: string; title?: string; notes?: string | null; scheduled_days?: number[] | null }[];
  dateChanges: { scheduled_workout_id: string; new_date: string }[];
}

export async function applyProgramEdits(
  programId: string,
  changes: ProgramEditChanges
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.rpc("apply_program_edits", {
    p_program_id: programId,
    p_exercise_updates: JSON.parse(JSON.stringify(changes.exerciseUpdates)),
    p_exercise_swaps: JSON.parse(JSON.stringify(changes.exerciseSwaps)),
    p_exercise_adds: JSON.parse(JSON.stringify(changes.exerciseAdds)),
    p_exercise_removes: JSON.parse(JSON.stringify(changes.exerciseRemoves)),
    p_template_updates: JSON.parse(JSON.stringify(changes.templateUpdates)),
    p_date_changes: JSON.parse(JSON.stringify(changes.dateChanges)),
  });

  if (error) {
    // Extract meaningful message from Postgres exception
    const msg = error.message?.replace(/^ERROR:\s*/, "") ?? "Failed to save changes";
    return { error: msg };
  }

  revalidatePath("/programs");
  revalidatePath(`/programs/${programId}`);
  revalidatePath(`/programs/${programId}/edit`);
  return {};
}
