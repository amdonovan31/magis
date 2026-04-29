import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionSummary } from "@/lib/queries/summary.queries";
import { getStreakData } from "@/lib/queries/streaks.queries";
import { isTemplateSaved } from "@/lib/queries/saved-workout.queries";
import { formatDate, formatDuration } from "@/lib/utils/date";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import PostSessionNote from "@/components/notes/PostSessionNote";
import StreakMilestoneBanner from "@/components/streaks/StreakMilestoneBanner";
import ProgramDisclaimerFooter from "@/components/disclaimer/ProgramDisclaimerFooter";
import ConfettiBurst from "@/components/workout/ConfettiBurst";
import SaveWorkoutButton from "@/components/library/SaveWorkoutButton";

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

  // Get the client's profile and coach for the note
  const [{ data: profile }, { data: relationship }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("coach_client_relationships")
      .select("coach_id")
      .eq("client_id", user.id)
      .maybeSingle(),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "champ";

  // Check if this workout can/should be saved to library
  const { data: sessionRow } = await supabase
    .from("workout_sessions")
    .select("workout_template_id, program_id")
    .eq("id", sessionId)
    .single();

  const templateId = sessionRow?.workout_template_id;
  const isFreeWorkout = !templateId;
  const alreadySaved = templateId ? await isTemplateSaved(templateId) : false;
  const showSavePrompt = isFreeWorkout || !alreadySaved;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <ConfettiBurst />
      <header className="bg-primary px-4 pt-8 pb-6 text-center text-white">
        <img
          src="/magis_logo_clean.svg"
          alt="Magis"
          className="mx-auto mb-4 h-10 brightness-0 invert opacity-30"
        />
        <div className="text-2xl mb-1">&#x1F3C6;</div>
        <p className="text-lg text-white/90">Great work, {firstName}. &#x1F4AA;</p>
        <p className="text-sm text-white/50 mt-1">{summary.templateTitle} &middot; {formatDate(summary.date)}</p>
      </header>

      <div className="flex-1 px-4 py-6 flex flex-col gap-4 pb-32">
        {/* Stats grid — cardio vs strength */}
        {summary.templateType === "cardio" && summary.cardioStats ? (
          <div className="grid grid-cols-2 gap-3">
            {summary.cardioStats.durationSeconds && (
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {Math.floor(summary.cardioStats.durationSeconds / 60)}:{String(summary.cardioStats.durationSeconds % 60).padStart(2, "0")}
                </p>
                <p className="text-xs text-primary/50 mt-1">Time</p>
              </Card>
            )}
            {summary.durationSeconds !== null && (
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {formatDuration(summary.durationSeconds)}
                </p>
                <p className="text-xs text-primary/50 mt-1">Session Duration</p>
              </Card>
            )}
            {summary.cardioStats.distanceValue && (
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {summary.cardioStats.distanceValue}
                </p>
                <p className="text-xs text-primary/50 mt-1">{summary.cardioStats.distanceUnit ?? "distance"}</p>
              </Card>
            )}
            {summary.cardioStats.avgHeartRate && (
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {summary.cardioStats.avgHeartRate}
                </p>
                <p className="text-xs text-primary/50 mt-1">Avg HR (bpm)</p>
              </Card>
            )}
            {summary.cardioStats.rpe && (
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {summary.cardioStats.rpe}/10
                </p>
                <p className="text-xs text-primary/50 mt-1">RPE</p>
              </Card>
            )}
          </div>
        ) : (
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
            <p className="text-xs text-primary/50 mt-1">
              Sets{summary.skippedSetCount > 0 ? ` (${summary.skippedSetCount} skipped)` : ""}
            </p>
          </Card>
          {summary.totalVolume > 0 && (
            <Card padding="md" className="text-center">
              <p className="text-2xl font-bold text-primary">
                {summary.totalVolume.toLocaleString()}
              </p>
              <p className="text-xs text-primary/50 mt-1">Volume ({summary.weightUnit})</p>
            </Card>
          )}
        </div>
        )}

        {/* Cardio notes */}
        {summary.templateType === "cardio" && summary.cardioStats?.notes && (
          <Card padding="md">
            <p className="text-xs font-semibold text-primary/40 mb-1">Notes</p>
            <p className="text-sm text-primary">{summary.cardioStats.notes}</p>
          </Card>
        )}

        {/* Skipped exercises */}
        {summary.skippedExercises.length > 0 && (
          <Card padding="md">
            <h2 className="font-semibold text-primary/50 mb-2 text-sm">Skipped</h2>
            <div className="flex flex-col gap-1.5">
              {summary.skippedExercises.map((ex) => (
                <div key={ex.id} className="flex items-center gap-2">
                  <span className="text-sm text-primary/40">{ex.name}</span>
                  <Badge variant="default">Skipped</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

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
                        {pr.value} {summary.weightUnit}
                      </Badge>
                      {pr.previousValue !== null && (
                        <p className="text-xs text-primary/40 mt-0.5">
                          prev: {pr.previousValue} {summary.weightUnit}
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

        {/* Save to Library */}
        {showSavePrompt && (
          <SaveWorkoutButton
            sessionId={sessionId}
            suggestedTitle={summary.templateTitle}
            source={isFreeWorkout ? "custom" : "program"}
            templateId={templateId ?? undefined}
            programTitle={summary.programTitle || undefined}
          />
        )}

        {/* Share stub for Stage 3 */}
        <Button variant="secondary" fullWidth disabled>
          Share to Feed (Coming Soon)
        </Button>

        {summary.programTitle && <ProgramDisclaimerFooter variant="coached" />}
      </div>

      {/* Done button */}
      <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 bg-surface p-4 pb-safe border-t border-primary/10">
        <Link href="/home">
          <Button fullWidth size="lg">
            Done
          </Button>
        </Link>
      </div>
    </div>
  );
}
