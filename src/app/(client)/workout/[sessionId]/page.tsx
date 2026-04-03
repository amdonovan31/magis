import { getSession } from "@/lib/queries/session.queries";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WorkoutClient from "@/components/workout/WorkoutClient";
import WorkoutProgress from "@/components/workout/WorkoutProgress";
import CompleteWorkoutButton from "@/components/workout/CompleteWorkoutButton";
import ConnectivityBanner from "@/components/workout/ConnectivityBanner";
import ProgramDisclaimerFooter from "@/components/disclaimer/ProgramDisclaimerFooter";
import Link from "next/link";
import type { WorkoutTemplateWithExercises, SetLog, WorkoutSession } from "@/types/app.types";

interface WorkoutPageProps {
  params: Promise<{ sessionId: string }>;
}

type ExtraWorkRow = {
  group_id: string;
  exercise_name: string;
  set_number: number;
  reps_completed: number | null;
  weight_value: number | null;
  weight_unit: string | null;
};

type RawSession = WorkoutSession & {
  workout_template: WorkoutTemplateWithExercises | null;
  set_logs: SetLog[];
  session_exercise_notes: { template_exercise_id: string; content: string | null }[];
  session_extra_work: ExtraWorkRow[];
};

async function finishSession(sessionId: string) {
  "use server";
  const { completeSession } = await import("@/lib/actions/session.actions");
  await completeSession(sessionId);
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rawSession = await getSession(sessionId);
  const session = rawSession as unknown as RawSession | null;

  if (!session || session.client_id !== user.id) redirect("/home");
  if (session.status === "completed") redirect(`/workout/${sessionId}/summary`);

  const template = session.workout_template;
  const setLogs = session.set_logs ?? [];
  const exerciseNotes = session.session_exercise_notes ?? [];
  const extraWork = session.session_extra_work ?? [];

  // Fetch user's preferred weight unit
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_unit")
    .eq("id", user.id)
    .single();
  const preferredUnit = (profile?.preferred_unit as "kg" | "lbs") ?? "lbs";

  const totalSets = template?.exercises?.reduce(
    (sum, te) => sum + (te.prescribed_sets ?? 0),
    0
  ) ?? 0;
  const completedSets = setLogs.filter((l) => l.is_completed).length;

  const handleFinish = finishSession.bind(null, sessionId);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Fixed top bar */}
      <header className="flex h-14 items-center justify-between bg-primary px-4 text-white">
        <Link href="/home" className="text-white/70 hover:text-white text-sm">
          ✕ Exit
        </Link>
        <h1 className="text-sm font-semibold">{template?.title ?? "Workout"}</h1>
        <span className="text-white/70 text-xs">{completedSets}/{totalSets}</span>
      </header>

      {/* Progress bar */}
      <div className="px-4 pt-3 pb-2 bg-primary/5">
        <WorkoutProgress completed={completedSets} total={totalSets} />
      </div>

      {/* Connectivity indicator — workout page only */}
      <ConnectivityBanner />

      {/* Exercise loggers with rest timer */}
      {template && (
        <WorkoutClient
          sessionId={sessionId}
          template={template}
          setLogs={setLogs}
          preferredUnit={preferredUnit}
          initialSkippedExercises={session.skipped_exercises ?? []}
          exerciseNotes={exerciseNotes}
          initialExtraWork={extraWork}
        />
      )}

      {/* Program disclaimer */}
      <div className="px-4">
        <ProgramDisclaimerFooter variant="coached" />
      </div>

      {/* Complete workout CTA */}
      <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 bg-surface p-4 pb-safe border-t border-primary/10">
        <CompleteWorkoutButton
          sessionId={sessionId}
          completedSets={completedSets}
          onComplete={handleFinish}
        />
      </div>
    </div>
  );
}
