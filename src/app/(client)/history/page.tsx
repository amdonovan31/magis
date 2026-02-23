import { getClientHistory } from "@/lib/queries/session.queries";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDate, formatRelativeTime } from "@/lib/utils/date";
import type { WorkoutSession } from "@/types/app.types";

type SessionWithTemplate = WorkoutSession & {
  workout_template: { title: string } | null;
};

export default async function HistoryPage() {
  const rawSessions = await getClientHistory();
  const sessions = rawSessions as unknown as SessionWithTemplate[];

  return (
    <>
      <TopBar title="Workout History" />
      <div className="flex flex-col gap-3 px-4 pt-4">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <p className="text-primary/60">No workouts yet.</p>
            <p className="text-sm text-primary/40 mt-1">
              Complete your first workout to see history here.
            </p>
          </div>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary">
                  {session.workout_template?.title ?? "Workout"}
                </p>
                <p className="text-sm text-primary/60">
                  {formatDate(session.started_at)}
                </p>
                <p className="text-xs text-primary/40 mt-0.5">
                  {formatRelativeTime(session.started_at)}
                </p>
              </div>
              <Badge
                variant={
                  session.status === "completed"
                    ? "success"
                    : session.status === "skipped"
                    ? "warning"
                    : "default"
                }
              >
                {session.status}
              </Badge>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
