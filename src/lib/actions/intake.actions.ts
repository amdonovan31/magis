"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface IntakeData {
  // PAR-Q
  parq_heart_condition: boolean;
  parq_chest_pain_activity: boolean;
  parq_chest_pain_rest: boolean;
  parq_dizziness: boolean;
  parq_bone_joint: boolean;
  parq_blood_pressure_meds: boolean;
  parq_other_reason: boolean;
  parq_notes: string | null;

  // Goals
  primary_goal: string;
  secondary_goal: string | null;
  injuries_limitations: string | null;

  // Preferences
  days_per_week: number;
  session_duration: number;
  training_focus: string[];
  equipment_available: string[];
  additional_notes: string | null;
}

export async function submitIntake(data: IntakeData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const coachId = user.app_metadata?.coach_id as string | undefined;

  const { error } = await supabase.from("client_intake").insert({
    client_id: user.id,
    coach_id: coachId ?? null,
    ...data,
  });

  if (error) {
    return { error: error.message };
  }

  // Mark onboarding as complete and clear intake request flag
  await supabase
    .from("profiles")
    .update({ onboarding_complete: true, intake_requested: false })
    .eq("id", user.id);

  redirect("/home");
}

export async function sendIntakeRequest(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify coach-client relationship
  const { data: relationship } = await supabase
    .from("coach_client_relationships")
    .select("client_id")
    .eq("coach_id", user.id)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!relationship) {
    return { error: "Client not found" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ intake_requested: true })
    .eq("id", clientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/clients/${clientId}`);
}
