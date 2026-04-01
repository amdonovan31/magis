"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function startWorkoutSession(
  workoutTemplateId: string,
  programId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Check if there's already an in-progress session for this template today
  const { data: existing } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("client_id", user.id)
    .eq("workout_template_id", workoutTemplateId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (existing) {
    redirect(`/workout/${existing.id}`);
  }

  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({
      client_id: user.id,
      workout_template_id: workoutTemplateId,
      program_id: programId,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (error || !session) return { error: error?.message ?? "Failed to start session" };

  redirect(`/workout/${session.id}`);
}

export async function saveRetroLog(input: {
  scheduledWorkoutId: string;
  workoutTemplateId: string;
  programId: string;
  weightUnit: "lbs" | "kg";
  sets: {
    templateExerciseId: string;
    setNumber: number;
    reps: number | null;
    weight: number | null;
  }[];
  notes?: Record<string, string>;
  substitutions?: Record<string, { exerciseId: string; reason?: string }>;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Create a completed session
  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      client_id: user.id,
      workout_template_id: input.workoutTemplateId,
      program_id: input.programId,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (sessionError || !session) return { error: sessionError?.message ?? "Failed to create session" };

  // Batch insert set logs (with exercise_id override for substitutions)
  if (input.sets.length > 0) {
    const setRows = input.sets.map((s) => ({
      session_id: session.id,
      template_exercise_id: s.templateExerciseId,
      exercise_id: input.substitutions?.[s.templateExerciseId]?.exerciseId ?? null,
      set_number: s.setNumber,
      reps_completed: s.reps,
      weight_used: s.weight != null ? `${s.weight}${input.weightUnit}` : null,
      weight_value: s.weight,
      weight_unit: s.weight != null ? input.weightUnit : null,
      is_completed: true,
      sync_status: "synced",
    }));

    const { error: setError } = await supabase
      .from("set_logs")
      .insert(setRows);

    if (setError) return { error: setError.message };
  }

  // Insert exercise notes (skip empty)
  if (input.notes) {
    const noteRows = Object.entries(input.notes)
      .filter(([, content]) => content.trim())
      .map(([templateExerciseId, content]) => ({
        session_id: session.id,
        template_exercise_id: templateExerciseId,
        content: content.trim(),
      }));

    if (noteRows.length > 0) {
      await supabase
        .from("session_exercise_notes")
        .insert(noteRows);
    }
  }

  // Insert exercise substitutions
  if (input.substitutions && Object.keys(input.substitutions).length > 0) {
    // Fetch original exercise IDs from template
    const teIds = Object.keys(input.substitutions);
    const { data: templateExercises } = await supabase
      .from("workout_template_exercises")
      .select("id, exercise_id")
      .in("id", teIds);

    if (templateExercises) {
      const subRows = templateExercises
        .filter((te) => input.substitutions![te.id])
        .map((te) => ({
          session_id: session.id,
          template_exercise_id: te.id,
          original_exercise_id: te.exercise_id,
          substitute_exercise_id: input.substitutions![te.id].exerciseId,
          reason: input.substitutions![te.id].reason ?? null,
        }));

      if (subRows.length > 0) {
        await supabase
          .from("exercise_substitutions")
          .upsert(subRows, { onConflict: "session_id,template_exercise_id" });
      }
    }
  }

  // Mark scheduled workout as completed
  await supabase
    .from("scheduled_workouts")
    .update({ status: "completed", session_id: session.id })
    .eq("id", input.scheduledWorkoutId);

  revalidatePath("/calendar");
  revalidatePath("/home");
  return {};
}

export async function skipExercise(sessionId: string, templateExerciseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Read current array, append if not already present
  const { data: session } = await supabase
    .from("workout_sessions")
    .select("skipped_exercises")
    .eq("id", sessionId)
    .single();

  if (!session) return { error: "Session not found" };

  const current: string[] = session.skipped_exercises ?? [];
  if (current.includes(templateExerciseId)) return { success: true };

  const { error } = await supabase
    .from("workout_sessions")
    .update({ skipped_exercises: [...current, templateExerciseId] })
    .eq("id", sessionId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function logSet(data: {
  sessionId: string;
  templateExerciseId: string;
  exerciseIdOverride?: string;
  setNumber: number;
  repsCompleted: number | null;
  weightUsed: string | null;
  weightUnit?: "kg" | "lbs";
  rpe: number | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const weightValue = data.weightUsed ? parseFloat(data.weightUsed) : null;

  // Upsert — if set already exists for this session+exercise+setNumber, update it
  const { data: result, error } = await supabase
    .from("set_logs")
    .upsert(
      {
        session_id: data.sessionId,
        template_exercise_id: data.templateExerciseId,
        exercise_id: data.exerciseIdOverride ?? null,
        set_number: data.setNumber,
        reps_completed: data.repsCompleted,
        weight_used: data.weightUsed,
        weight_value: !isNaN(weightValue as number) ? weightValue : null,
        weight_unit: data.weightUnit ?? null,
        rpe: data.rpe,
        is_completed: true,
        logged_at: new Date().toISOString(),
      },
      {
        onConflict: "session_id,template_exercise_id,set_number",
      }
    )
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { success: true, id: result?.id };
}

export async function completeSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Fetch the session to calculate duration
  const { data: session } = await supabase
    .from("workout_sessions")
    .select("started_at, workout_template_id")
    .eq("id", sessionId)
    .eq("client_id", user.id)
    .single();

  if (!session) return { error: "Session not found" };

  const now = new Date();
  const startedAt = new Date(session.started_at);
  const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

  // Complete the session
  const { error } = await supabase
    .from("workout_sessions")
    .update({
      status: "completed",
      completed_at: now.toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq("id", sessionId)
    .eq("client_id", user.id);

  if (error) return { error: error.message };

  // Detect PRs — fetch all completed set_logs for this session
  const { data: setLogs } = await supabase
    .from("set_logs")
    .select(`
      id,
      template_exercise_id,
      exercise_id,
      reps_completed,
      weight_used,
      weight_unit,
      is_completed
    `)
    .eq("session_id", sessionId)
    .eq("is_completed", true);

  if (setLogs && setLogs.length > 0) {
    // Get the exercise IDs from template_exercise_ids
    const teIds = Array.from(new Set(setLogs.map((l) => l.template_exercise_id).filter(Boolean)));

    let teToExercise = new Map<string, string>();
    if (teIds.length > 0) {
      const { data: templateExercises } = await supabase
        .from("workout_template_exercises")
        .select("id, exercise_id")
        .in("id", teIds as string[]);

      teToExercise = new Map(
        (templateExercises ?? []).map((te) => [te.id, te.exercise_id])
      );
    }

    // Group logs by exercise — prefer exercise_id override (swap) over template lookup
    const exerciseLogs = new Map<string, typeof setLogs>();
    for (const log of setLogs) {
      const exerciseId = log.exercise_id ?? teToExercise.get(log.template_exercise_id!);
      if (!exerciseId) continue;
      if (!exerciseLogs.has(exerciseId)) {
        exerciseLogs.set(exerciseId, []);
      }
      exerciseLogs.get(exerciseId)!.push(log);
    }

    // Determine the weight unit for this exercise from stored set_log data
    const getWeightUnit = (sessionLogs: typeof setLogs): string => {
      // Prefer the explicit weight_unit stored on the set log
      for (const log of sessionLogs) {
        if (log.weight_unit) return log.weight_unit;
      }
      // Fallback: infer from weight_used string for legacy data
      for (const log of sessionLogs) {
        if (!log.weight_used) continue;
        const trimmed = log.weight_used.trim().toLowerCase();
        if (trimmed.endsWith("lbs") || trimmed.endsWith("lb")) return "lbs";
      }
      return "lbs";
    };

    // Check each exercise for PRs
    for (const [exerciseId, logs] of Array.from(exerciseLogs)) {
      const weightUnit = getWeightUnit(logs);
      const volumeUnit = weightUnit === "lbs" ? "lbs*reps" : "kg*reps";

      // Find best weight in this session
      let bestWeight = 0;
      let bestWeightLogId = "";
      let bestVolume = 0;
      let bestVolumeLogId = "";

      for (const log of logs) {
        const weight = parseFloat(log.weight_used ?? "0") || 0;
        const reps = log.reps_completed ?? 0;
        const volume = weight * reps;

        if (weight > bestWeight) {
          bestWeight = weight;
          bestWeightLogId = log.id;
        }
        if (volume > bestVolume) {
          bestVolume = volume;
          bestVolumeLogId = log.id;
        }
      }

      // Check weight PR
      if (bestWeight > 0) {
        const { data: existingPr } = await supabase
          .from("personal_records")
          .select("value")
          .eq("user_id", user.id)
          .eq("exercise_id", exerciseId)
          .eq("pr_type", "weight")
          .order("value", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!existingPr || bestWeight > existingPr.value) {
          await supabase.from("personal_records").insert({
            user_id: user.id,
            exercise_id: exerciseId,
            pr_type: "weight",
            value: bestWeight,
            unit: weightUnit,
            set_log_id: bestWeightLogId,
            session_id: sessionId,
            previous_value: existingPr?.value ?? null,
          });
        }
      }

      // Check volume PR (weight x reps for a single set)
      if (bestVolume > 0) {
        const { data: existingPr } = await supabase
          .from("personal_records")
          .select("value")
          .eq("user_id", user.id)
          .eq("exercise_id", exerciseId)
          .eq("pr_type", "volume")
          .order("value", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!existingPr || bestVolume > existingPr.value) {
          await supabase.from("personal_records").insert({
            user_id: user.id,
            exercise_id: exerciseId,
            pr_type: "volume",
            value: bestVolume,
            unit: volumeUnit,
            set_log_id: bestVolumeLogId,
            session_id: sessionId,
            previous_value: existingPr?.value ?? null,
          });
        }
      }
    }
  }

  revalidatePath("/home");
  revalidatePath("/history");
  redirect(`/workout/${sessionId}/summary`);
}

export async function skipSession(workoutTemplateId: string, programId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("workout_sessions").insert({
    client_id: user.id,
    workout_template_id: workoutTemplateId,
    program_id: programId,
    status: "skipped",
  });

  if (error) return { error: error.message };

  revalidatePath("/home");
  return { success: true };
}

export async function updateClientSchedule(data: {
  workoutTemplateId: string;
  scheduledDays: number[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("client_workout_schedules")
    .upsert(
      {
        client_id: user.id,
        workout_template_id: data.workoutTemplateId,
        scheduled_days: data.scheduledDays,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id,workout_template_id" }
    );

  if (error) return { error: error.message };

  revalidatePath("/home");
  return { success: true };
}
