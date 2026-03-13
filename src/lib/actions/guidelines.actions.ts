"use server";

import { createClient } from "@/lib/supabase/server";

export interface GuidelinesData {
  client_id: string;
  program_length_weeks: number;
  intensity_level: string;
  periodization_style: string;
  exercises_to_include: string[] | null;
  exercises_to_avoid: string[] | null;
  additional_notes: string | null;
}

export async function saveCoachGuidelines(data: GuidelinesData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (user.app_metadata?.role !== "coach") {
    return { error: "Unauthorized" };
  }

  // Upsert: update if guidelines already exist for this client+coach pair
  const { data: existing } = await supabase
    .from("coach_guidelines")
    .select("id")
    .eq("client_id", data.client_id)
    .eq("coach_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("coach_guidelines")
      .update({
        program_length_weeks: data.program_length_weeks,
        intensity_level: data.intensity_level,
        periodization_style: data.periodization_style,
        exercises_to_include: data.exercises_to_include,
        exercises_to_avoid: data.exercises_to_avoid,
        additional_notes: data.additional_notes,
      })
      .eq("id", existing.id);

    if (error) return { error: error.message };
    return { id: existing.id };
  }

  const { data: inserted, error } = await supabase
    .from("coach_guidelines")
    .insert({
      client_id: data.client_id,
      coach_id: user.id,
      program_length_weeks: data.program_length_weeks,
      intensity_level: data.intensity_level,
      periodization_style: data.periodization_style,
      exercises_to_include: data.exercises_to_include,
      exercises_to_avoid: data.exercises_to_avoid,
      additional_notes: data.additional_notes,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: inserted.id };
}
