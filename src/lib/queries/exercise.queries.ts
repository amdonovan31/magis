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
    const legsGroups = ["Legs", "Quads", "Hamstrings", "Calves", "Glutes"];
    const groups =
      opts.muscleGroup === "Legs" ? legsGroups : [opts.muscleGroup];
    query = query.in("muscle_group", groups);
  }

  if (opts?.search) {
    query = query.ilike("name", `%${opts.search}%`);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getAllExerciseNames(): Promise<
  { id: string; name: string; muscle_group: string | null }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select("id, name, muscle_group")
    .eq("is_archived", false)
    .order("name", { ascending: true });
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
