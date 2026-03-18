import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionSummary } from "@/lib/queries/summary.queries";
import { getStreakData } from "@/lib/queries/streaks.queries";
import { formatDate, formatDuration } from "@/lib/utils/date";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import PostSessionNote from "@/components/notes/PostSessionNote";
import StreakMilestoneBanner from "@/components/streaks/StreakMilestoneBanner";
import ProgramDisclaimerFooter from "@/components/disclaimer/ProgramDisclaimerFooter";

interface SummaryPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function SummaryPage({ params }: SummaryPageProps) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [summary, streakData] = await Promise.all([
    getSessionSummary(sessionId),
    getStreakData(),
  ]);
  if (!summary) redirect("/home");

  // Get the client's coach for the note
  const { data: relationship } = await supabase
    .from("coach_client_relationships")
    .select("coach_id")
    .eq("client_id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="bg-primary px-4 py-8 text-center text-white">
        <p className="text-sm text-white/70 mb-1">Workout Complete</p>
        <h1 className="text-2xl font-bold">{summary.templateTitle}</h1>
        <p className="text-sm text-white/60 mt-1">{formatDate(summary.date)}</p>
      </header>

      <div className="flex-1 px-4 py-6 flex flex-col gap-4 pb-32">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {summary.durationSeconds !== null && (
            <Card padding="md" className="text-center">
              <p className="text-2xl font-bold text-primary">
                {formatDuration(summary.durationSeconds)}
              </p>
              <p className="text-xs text-primary/50 mt-1">Duration</p>
            </Card>
          )}
          <Card padding="md" className="text-center">
            <p className="text-2xl font-bold text-primary">
              {summary.exercisesCompleted}/{summary.totalExercises}
            </p>
            <p className="text-xs text-primary/50 mt-1">Exercises</p>
          </Card>
          <Card padding="md" className="text-center">
            <p className="text-2xl font-bold text-primary">
              {summary.setsCompleted}/{summary.totalSets}
            </p>
            <p className="text-xs text-primary/50 mt-1">Sets</p>
          </Card>
          {summary.totalVolume > 0 && (
            <Card padding="md" className="text-center">
              <p className="text-2xl font-bold text-primary">
                {summary.totalVolume.toLocaleString()}
              </p>
              <p className="text-xs text-primary/50 mt-1">Volume (kg)</p>
            </Card>
          )}
        </div>

        {/* PRs */}
        {summary.prs.length > 0 && (
          <Card padding="md">
            <h2 className="font-semibold text-primary mb-3 flex items-center gap-2">
              <span className="text-lg">&#x1F3C6;</span> Personal Records
            </h2>
            <div className="flex flex-col gap-2">
              {summary.prs.map((pr, i) => (
                <Link
                  key={i}
                  href={`/history?tab=records&exercise=${pr.exerciseId}`}
                  className="flex items-center justify-between active:opacity-70 transition-opacity"
                >
                  <div>
                    <p className="text-sm font-medium text-primary">
                      {pr.exerciseName}
                    </p>
                    <p className="text-xs text-primary/50">
                      {pr.prType === "weight" ? "Weight" : "Volume"} PR
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <Badge variant="accent">
                        {pr.value}{pr.prType === "weight" ? " kg" : ""}
                      </Badge>
                      {pr.previousValue !== null && (
                        <p className="text-xs text-primary/40 mt-0.5">
                          prev: {pr.previousValue}
                        </p>
                      )}
                    </div>
                    <svg className="h-4 w-4 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href="/history?tab=records"
              className="block text-center text-sm font-medium text-accent mt-3 active:opacity-70"
            >
              View All PRs &rarr;
            </Link>
          </Card>
        )}

        {/* Streak */}
        <StreakMilestoneBanner streakData={streakData} />

        {/* Post-session note for coach */}
        {relationship?.coach_id && (
          <PostSessionNote
            clientId={user.id}
            coachId={relationship.coach_id}
            sessionId={sessionId}
          />
        )}

        {/* Share stub for Stage 3 */}
        <Button variant="secondary" fullWidth disabled>
          Share to Feed (Coming Soon)
        </Button>

        <ProgramDisclaimerFooter variant="coached" />
      </div>

      {/* Done button */}
      <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-surface p-4 pb-safe border-t border-primary/10">
        <Link href="/home">
          <Button fullWidth size="lg">
            Done
          </Button>
        </Link>
      </div>
    </div>
  );
}
