import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ProgramDisclaimerFooter from "@/components/disclaimer/ProgramDisclaimerFooter";
import FreeWorkoutPicker from "./FreeWorkoutPicker";
import type { TodayWorkout } from "@/types/app.types";

interface TodayWorkoutCardProps {
  todayWorkout: TodayWorkout;
  hasProgram?: boolean;
  activeFreeSessionId?: string | null;
}

export default function TodayWorkoutCard({ todayWorkout, hasProgram = true, activeFreeSessionId }: TodayWorkoutCardProps) {
  if (!todayWorkout) {
    if (!hasProgram) {
      return (
        <>
          <Card padding="lg" className="text-center">
            <div className="text-4xl mb-3">📋</div>
            <h2 className="text-lg font-semibold text-primary">Program Coming Soon</h2>
            <p className="mt-1 text-sm text-primary/60">
              Your coach is preparing your program — you&apos;ll get a notification when it&apos;s ready.
            </p>
          </Card>
          <FreeWorkoutPicker activeFreeSessionId={activeFreeSessionId} />
        </>
      );
    }
    return (
      <>
        <Card padding="lg" className="text-center">
          <div className="text-4xl mb-3">🌿</div>
          <h2 className="text-lg font-semibold text-primary">Rest Day</h2>
          <p className="mt-1 text-sm text-primary/60">
            No workout scheduled for today. Rest up!
          </p>
        </Card>
        <FreeWorkoutPicker activeFreeSessionId={activeFreeSessionId} />
      </>
    );
  }

  const { template, activeSession, completedSessionId, program, coachName } = todayWorkout;
  const exerciseCount = template.exercises?.length ?? 0;

  if (completedSessionId) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="success">Completed</Badge>
          <span className="text-xs text-primary/50">{program.title}</span>
        </div>
        <h2 className="text-xl font-bold text-primary">{template.title}</h2>
        <p className="text-sm text-primary/60 mt-1">{exerciseCount} exercises</p>
        <Link href={`/workout/${completedSessionId}/summary`} className="mt-4 block">
          <Button fullWidth size="lg">
            View Summary →
          </Button>
        </Link>
      </Card>
    );
  }

  if (activeSession) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="warning">In Progress</Badge>
          <span className="text-xs text-primary/50">Resume where you left off</span>
        </div>
        <h2 className="text-xl font-bold text-primary">{template.title}</h2>
        <p className="text-sm text-primary/60 mt-1">{exerciseCount} exercises</p>
        <Link href={`/workout/${activeSession.id}`} className="mt-4 block">
          <Button fullWidth size="lg" variant="accent">
            Resume Workout →
          </Button>
        </Link>
      </Card>
    );
  }

  async function startSession() {
    "use server";
    const { startWorkoutSession } = await import("@/lib/actions/session.actions");
    await startWorkoutSession(template.id, program.id);
  }

  return (
    <>
    <Card padding="lg">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/40">
        Today&apos;s Workout
      </p>
      <p className="text-xs text-primary/50 mt-1">{program.title}</p>
      <h2 className="text-xl font-bold text-primary mt-2">{template.title}</h2>
      <p className="text-sm text-primary/60 mt-1">
        {exerciseCount} exercises{coachName ? ` · Programmed by ${coachName}` : ""}
      </p>

      {/* Exercise preview */}
      {template.exercises && template.exercises.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {template.exercises.slice(0, 3).map((te) => (
            <div key={te.id} className="flex items-center justify-between text-sm">
              <span className="text-primary">{te.exercise?.name}</span>
              <span className="text-primary/50">
                {te.prescribed_sets}×{te.prescribed_reps}
                {te.prescribed_weight ? ` @ ${te.prescribed_weight}` : ""}
              </span>
            </div>
          ))}
          {template.exercises.length > 3 && (
            <p className="text-xs text-primary/40">
              +{template.exercises.length - 3} more exercises
            </p>
          )}
        </div>
      )}

      <form action={startSession} className="mt-4">
        <Button type="submit" fullWidth size="lg">
          Start Workout &rarr;
        </Button>
      </form>
      <ProgramDisclaimerFooter variant="coached" />
    </Card>
    <FreeWorkoutPicker activeFreeSessionId={activeFreeSessionId} />
    </>
  );
}
