"use server";

import { redirect } from "next/navigation";
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

  // Mark onboarding as complete
  await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", user.id);

  redirect("/home");
}
