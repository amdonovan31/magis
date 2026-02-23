"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createExercise(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const name = formData.get("name") as string;
  const muscleGroup = formData.get("muscle_group") as string | null;
  const instructions = formData.get("instructions") as string | null;
  const videoUrl = formData.get("video_url") as string | null;

  const { error } = await supabase.from("exercises").insert({
    created_by: user.id,
    name,
    muscle_group: muscleGroup || null,
    instructions: instructions || null,
    video_url: videoUrl || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/library");
  return { success: true };
}

export async function updateExercise(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("exercises")
    .update({
      name: formData.get("name") as string,
      muscle_group: (formData.get("muscle_group") as string) || null,
      instructions: (formData.get("instructions") as string) || null,
      video_url: (formData.get("video_url") as string) || null,
    })
    .eq("id", id)
    .eq("created_by", user.id);

  if (error) return { error: error.message };

  revalidatePath("/library");
  return { success: true };
}

export async function archiveExercise(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("exercises")
    .update({ is_archived: true })
    .eq("id", id)
    .eq("created_by", user.id);

  if (error) return { error: error.message };

  revalidatePath("/library");
  return { success: true };
}
