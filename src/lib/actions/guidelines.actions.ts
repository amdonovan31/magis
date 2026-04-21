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
  include_cardio?: boolean;
  cardio_days_per_week?: number | null;
  cardio_modalities?: string[] | null;
  cardio_zone_focus?: number | null;
  cardio_notes?: string | null;
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
        include_cardio: data.include_cardio ?? false,
        cardio_days_per_week: data.cardio_days_per_week ?? null,
        cardio_modalities: data.cardio_modalities ?? null,
        cardio_zone_focus: data.cardio_zone_focus ?? null,
        cardio_notes: data.cardio_notes ?? null,
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
      include_cardio: data.include_cardio ?? false,
      cardio_days_per_week: data.cardio_days_per_week ?? null,
      cardio_modalities: data.cardio_modalities ?? null,
      cardio_zone_focus: data.cardio_zone_focus ?? null,
      cardio_notes: data.cardio_notes ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: inserted.id };
}
