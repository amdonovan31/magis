import { createClient } from "@/lib/supabase/server";
import type { Exercise } from "@/types/app.types";

export async function getExercises(opts?: {
  search?: string;
  muscleGroup?: string;
  includeArchived?: boolean;
}): Promise<Exercise[]> {
  const supabase = await createClient();

  let query = supabase
    .from("exercises")
    .select("*")
    .order("name", { ascending: true });

  if (!opts?.includeArchived) {
    query = query.eq("is_archived", false);
  }

  if (opts?.muscleGroup) {
    query = query.eq("muscle_group", opts.muscleGroup);
  }

  if (opts?.search) {
    query = query.ilike("name", `%${opts.search}%`);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}
