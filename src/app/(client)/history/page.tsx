import { Suspense } from "react";
import { getClientHistory } from "@/lib/queries/session.queries";
import { getAllPRs } from "@/lib/queries/pr.queries";
import { getMeasurements } from "@/lib/queries/measurements.queries";
import { getWeeklyVolume } from "@/lib/queries/volume.queries";
import TopBar from "@/components/layout/TopBar";
import type { WorkoutSession } from "@/types/app.types";
import HistoryTabs from "@/components/pr/HistoryTabs";
import HistoryCard from "@/components/workout/HistoryCard";
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
        <HistoryCard
          key={session.id}
          session={{
            id: session.id,
            started_at: session.started_at,
            status: session.status,
            workout_template: session.workout_template,
          }}
        />
      ))}
      <p className="text-[10px] text-center text-primary/30 mt-2">
        Swipe left on a workout to delete
      </p>
    </div>
  );
}

export default async function HistoryPage() {
  const [rawSessions, prs, measurements, volumeResult] = await Promise.all([
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
            volumeContent={<VolumeCharts initialData={volumeResult.data} unit={volumeResult.unit} />}
          />
        </Suspense>
      </div>
    </>
  );
}
