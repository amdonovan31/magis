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

  const { error } = await supabase
    .from("workout_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("client_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/home");
  revalidatePath("/history");
  redirect("/home");
}

export async function skipSession(workoutTemplateId: string, programId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await supabase.from("workout_sessions").insert({
    client_id: user.id,
    workout_template_id: workoutTemplateId,
    program_id: programId,
    status: "skipped",
  });

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
