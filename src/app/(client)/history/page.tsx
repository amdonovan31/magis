import { Suspense } from "react";
import { getClientHistory } from "@/lib/queries/session.queries";
import { getAllPRs } from "@/lib/queries/pr.queries";
import { getMeasurements } from "@/lib/queries/measurements.queries";
import { getWeeklyVolume } from "@/lib/queries/volume.queries";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDate, formatRelativeTime } from "@/lib/utils/date";
import type { WorkoutSession } from "@/types/app.types";
import HistoryTabs from "@/components/pr/HistoryTabs";
import MeasurementsHistory from "@/components/measurements/MeasurementsHistory";
import VolumeCharts from "@/components/volume/VolumeCharts";

type SessionWithTemplate = WorkoutSession & {
  workout_template: { title: string } | null;
};

function WorkoutsList({ sessions }: { sessions: SessionWithTemplate[] }) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <p className="text-primary/60">No workouts yet.</p>
        <p className="text-sm text-primary/40 mt-1">
          Complete your first workout to see history here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sessions.map((session) => (
        <Card key={session.id} className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-primary">
              {session.workout_template?.title ?? "Workout"}
            </p>
            {session.started_at && (
              <p className="text-sm text-primary/60">
                {formatDate(session.started_at)}
              </p>
            )}
            {session.started_at && (
              <p className="text-xs text-primary/40 mt-0.5">
                {formatRelativeTime(session.started_at)}
              </p>
            )}
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
      ))}
    </div>
  );
}

export default async function HistoryPage() {
  const [rawSessions, prs, measurements, volumeData] = await Promise.all([
    getClientHistory(),
    getAllPRs(),
    getMeasurements(),
    getWeeklyVolume(undefined, undefined, 8),
  ]);
  const sessions = rawSessions as unknown as SessionWithTemplate[];

  return (
    <>
      <TopBar title="History" />
      <div className="px-4 pt-4">
        <Suspense>
          <HistoryTabs
            workoutsContent={<WorkoutsList sessions={sessions} />}
            prs={prs}
            measurementsContent={<MeasurementsHistory measurements={measurements} />}
            volumeContent={<VolumeCharts initialData={volumeData} />}
          />
        </Suspense>
      </div>
    </>
  );
}
