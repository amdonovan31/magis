import { getSession } from "@/lib/queries/session.queries";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExerciseLogger from "@/components/workout/ExerciseLogger";
import WorkoutProgress from "@/components/workout/WorkoutProgress";
import Button from "@/components/ui/Button";
import Link from "next/link";
import type { WorkoutTemplateWithExercises, SetLog, WorkoutSession } from "@/types/app.types";

interface WorkoutPageProps {
  params: Promise<{ sessionId: string }>;
}

type RawSession = WorkoutSession & {
  workout_template: WorkoutTemplateWithExercises | null;
  set_logs: SetLog[];
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
  if (session.status === "completed") redirect("/home");

  const template = session.workout_template;
  const setLogs = session.set_logs ?? [];

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

      {/* Exercise loggers */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 pb-32">
        {template?.exercises?.map((te) => (
          <div key={te.id} className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <ExerciseLogger
              sessionId={sessionId}
              templateExercise={te}
              existingLogs={setLogs.filter(
                (l) => l.template_exercise_id === te.id
              )}
            />
          </div>
        ))}
      </div>

      {/* Complete workout CTA */}
      <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-white p-4 pb-safe shadow-lg border-t border-primary/10">
        <form action={handleFinish}>
          <Button type="submit" fullWidth size="lg" variant="accent">
            Complete Workout ✓
          </Button>
        </form>
      </div>
    </div>
  );
}
