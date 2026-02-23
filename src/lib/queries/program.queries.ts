import { createClient } from "@/lib/supabase/server";
import type { ProgramWithTemplates } from "@/types/app.types";

export async function getCoachPrograms() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("programs")
    .select(`
      *,
      client:profiles!client_id(id, full_name)
    `)
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getProgramWithTemplates(
  programId: string
): Promise<ProgramWithTemplates | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("programs")
    .select(`
      *,
      workout_templates(
        *,
        exercises:workout_template_exercises(
          *,
          exercise:exercises(*)
        )
      )
    `)
    .eq("id", programId)
    .single();

  if (!data) return null;

  // Sort templates by day_number, exercises by position
  const sorted = {
    ...data,
    workout_templates: data.workout_templates
      .sort((a: { day_number: number | null }, b: { day_number: number | null }) =>
        (a.day_number ?? 0) - (b.day_number ?? 0)
      )
      .map((t: { exercises: Array<{ position: number }> } & Record<string, unknown>) => ({
        ...t,
        exercises: t.exercises.sort(
          (a: { position: number }, b: { position: number }) => a.position - b.position
        ),
      })),
  };

  return sorted as unknown as ProgramWithTemplates;
}
