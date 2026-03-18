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

export async function logSet(data: {
  sessionId: string;
  templateExerciseId: string;
  exerciseIdOverride?: string;
  setNumber: number;
  repsCompleted: number | null;
  weightUsed: string | null;
  rpe: number | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

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

    // Infer weight unit from the weight_used string
    const inferUnit = (weightStr: string | null): string => {
      if (!weightStr) return "kg";
      const trimmed = weightStr.trim().toLowerCase();
      if (trimmed.endsWith("lbs") || trimmed.endsWith("lb")) return "lbs";
      return "kg";
    };

    // Determine the weight unit for this user/exercise from recent history
    const getWeightUnit = async (exerciseId: string, sessionLogs: typeof setLogs): Promise<string> => {
      // Check current session logs for unit hints
      for (const log of sessionLogs) {
        const unit = inferUnit(log.weight_used);
        if (unit !== "kg") return unit;
      }

      // Check most recent prior set_log for this exercise
      const { data: priorLog } = await supabase
        .from("set_logs")
        .select("weight_used")
        .eq("template_exercise_id", sessionLogs[0]?.template_exercise_id ?? "")
        .neq("session_id", sessionId)
        .not("weight_used", "is", null)
        .order("logged_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (priorLog) {
        const unit = inferUnit(priorLog.weight_used);
        if (unit !== "kg") return unit;
      }

      return "kg";
    };

    // Check each exercise for PRs
    for (const [exerciseId, logs] of Array.from(exerciseLogs)) {
      const weightUnit = await getWeightUnit(exerciseId, logs);
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
