import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GeneratingScreen from "@/components/coach/GeneratingScreen";

export default async function GenerateLoadingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: { regenFeedback?: string; regenProgramId?: string };
}) {
  const { id: clientId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify coach-client relationship
  const { data: relationship } = await supabase
    .from("coach_client_relationships")
    .select("client_id")
    .eq("coach_id", user.id)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!relationship) notFound();

  // Get client name + most recent guidelines in parallel
  const [{ data: profile }, { data: guidelines }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", clientId)
      .single(),
    supabase
      .from("coach_guidelines")
      .select("id")
      .eq("client_id", clientId)
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile) notFound();

  // No guidelines saved yet — send coach back to the form
  if (!guidelines) {
    redirect(`/clients/${clientId}/generate`);
  }

  // If regenerating, reconstruct AI JSON from the draft program's DB rows
  let previousProgramJson: string | null = null;
  if (searchParams.regenProgramId) {
    const reverseDayMap: Record<number, string> = {
      0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
      4: "Thursday", 5: "Friday", 6: "Saturday",
    };

    const { data: prevProgram } = await supabase
      .from("programs")
      .select(`
        title, description,
        workout_templates (
          id, title, week_number, day_number, scheduled_days,
          workout_template_exercises (
            exercise_id, position, prescribed_sets, prescribed_reps,
            rest_seconds, alternate_exercise_ids,
            exercise:exercises ( muscle_group )
          )
        )
      `)
      .eq("id", searchParams.regenProgramId)
      .single();

    if (prevProgram?.workout_templates) {
      // Group templates by week_number
      const weekMap = new Map<number, typeof prevProgram.workout_templates>();
      for (const t of prevProgram.workout_templates) {
        const wn = t.week_number ?? 1;
        if (!weekMap.has(wn)) weekMap.set(wn, []);
        weekMap.get(wn)!.push(t);
      }

      const weeks = Array.from(weekMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([weekNumber, templates]) => ({
          week_number: weekNumber,
          workouts: templates
            .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
            .map((t) => {
              const dayNum = t.scheduled_days?.[0];
              return {
                day_of_week: dayNum != null ? reverseDayMap[dayNum] ?? "Monday" : "Monday",
                workout_name: t.title,
                muscle_groups: [] as string[],
                exercises: (t.workout_template_exercises ?? [])
                  .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                  .map((ex) => ({
                    exercise_id: ex.exercise_id,
                    sets: ex.prescribed_sets ?? 3,
                    reps: ex.prescribed_reps ?? "8-12",
                    rest_seconds: ex.rest_seconds ?? 90,
                    alternate_exercise_ids: ex.alternate_exercise_ids ?? [],
                  })),
              };
            }),
        }));

      previousProgramJson = JSON.stringify({
        program_name: prevProgram.title,
        program_description: prevProgram.description ?? "",
        weeks,
      });
    }

    // Delete the old draft program since we're regenerating (cascade deletes templates/exercises)
    await supabase
      .from("programs")
      .delete()
      .eq("id", searchParams.regenProgramId)
      .eq("status", "draft");
  }

  return (
    <GeneratingScreen
      clientId={clientId}
      clientName={profile.full_name ?? "Client"}
      guidelinesId={guidelines.id}
      regenerationFeedback={searchParams.regenFeedback ?? null}
      previousProgramJson={previousProgramJson}
    />
  );
}
