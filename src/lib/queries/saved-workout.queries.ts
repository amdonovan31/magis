import { createClient } from "@/lib/supabase/server";

export type SavedWorkoutRow = {
  id: string;
  title: string;
  source: string;
  source_program_title: string | null;
  created_at: string;
  last_used_at: string | null;
  use_count: number;
  exercise_count: number;
};

export type SavedWorkoutDetail = {
  id: string;
  title: string;
  source: string;
  source_template_id: string | null;
  source_program_title: string | null;
  exercises: {
    id: string;
    exercise_id: string;
    position: number;
    default_sets: number;
    default_reps: string | null;
    default_weight: string | null;
    rest_seconds: number | null;
    notes: string | null;
    exercise: {
      id: string;
      name: string;
      muscle_group: string | null;
    } | null;
  }[];
};

export async function getSavedWorkouts(): Promise<SavedWorkoutRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("saved_workouts")
    .select("id, title, source, source_program_title, created_at, last_used_at, use_count, exercises:saved_workout_exercises(id)")
    .eq("client_id", user.id)
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    source: row.source,
    source_program_title: row.source_program_title,
    created_at: row.created_at,
    last_used_at: row.last_used_at,
    use_count: row.use_count,
    exercise_count: (row.exercises as unknown[])?.length ?? 0,
  }));
}

export async function getSavedWorkoutDetail(
  savedWorkoutId: string
): Promise<SavedWorkoutDetail | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("saved_workouts")
    .select(`
      id, title, source, source_template_id, source_program_title,
      exercises:saved_workout_exercises(
        id, exercise_id, position, default_sets, default_reps, default_weight, rest_seconds, notes,
        exercise:exercises(id, name, muscle_group)
      )
    `)
    .eq("id", savedWorkoutId)
    .single();

  if (!data) return null;

  const exercises = ((data.exercises ?? []) as unknown as SavedWorkoutDetail["exercises"])
    .sort((a, b) => a.position - b.position);

  return {
    id: data.id,
    title: data.title,
    source: data.source,
    source_template_id: data.source_template_id,
    source_program_title: data.source_program_title,
    exercises,
  };
}

export async function isTemplateSaved(templateId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { count } = await supabase
    .from("saved_workouts")
    .select("id", { count: "exact", head: true })
    .eq("client_id", user.id)
    .eq("source_template_id", templateId);

  return (count ?? 0) > 0;
}
