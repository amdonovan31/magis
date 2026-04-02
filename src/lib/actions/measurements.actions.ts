"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Log a single body measurement for the authenticated user.
 */
export async function logMeasurement(data: {
  metricType: string;
  value: number;
  unit: string;
  measuredAt?: string;
  notes?: string;
}): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: inserted, error } = await supabase
    .from("body_measurements")
    .insert({
      user_id: user.id,
      metric_type: data.metricType,
      value: data.value,
      unit: data.unit,
      measured_at: data.measuredAt ?? new Date().toISOString(),
      notes: data.notes ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/history");

  return { id: inserted.id };
}

/**
 * Update an existing body measurement's value and unit.
 */
export async function updateMeasurement(data: {
  id: string;
  value: number;
  unit: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("body_measurements")
    .update({ value: data.value, unit: data.unit })
    .eq("id", data.id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/home");
  revalidatePath("/profile");
  revalidatePath("/history");

  return {};
}

/**
 * Hard-delete a body measurement owned by the authenticated user.
 */
export async function deleteMeasurement(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("body_measurements")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/history");

  return {};
}
