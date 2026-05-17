import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils/date";
import type { CoachActivityItem } from "@/lib/queries/coach-activity.queries";

/**
 * One row in the coach Activity feed — the passive log. Discriminated render
 * over the four activity event types. Action-needed alerts render through
 * AttentionEventCard instead.
 */
export default function ActivityEventCard({ item }: { item: CoachActivityItem }) {
  if (item.kind === "workout_completed") {
    return (
      <Link href={`/clients/${item.clientId}/sessions/${item.sessionId}`}>
        <Card className="active:scale-[0.98] transition-transform">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-primary truncate">
                {item.clientName}
                <span className="font-normal text-primary/50"> completed a workout</span>
              </p>
              <p className="text-sm text-primary/60 truncate">
                {item.workoutTitle ?? "Workout"}
                {item.programTitle ? ` · ${item.programTitle}` : ""}
              </p>
            </div>
            <span className="shrink-0 text-xs text-primary/40">
              {formatRelativeTime(item.occurredAt)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {item.isCardio ? (
              <span className="text-xs text-primary/60">Cardio session</span>
            ) : (
              <span className="text-xs text-primary/60">
                {item.setsLogged} set{item.setsLogged === 1 ? "" : "s"} logged
              </span>
            )}
            {item.topSet && (
              <span className="text-xs text-primary/60">
                · Top set: {item.topSet.exerciseName} {item.topSet.weight} × {item.topSet.reps}
              </span>
            )}
            {item.hasPR && <Badge variant="success">PR</Badge>}
          </div>
          <p className="mt-2 text-xs font-semibold text-accent">View summary →</p>
        </Card>
      </Link>
    );
  }

  if (item.kind === "client_joined") {
    return (
      <Link href={`/clients/${item.clientId}`}>
        <Card className="active:scale-[0.98] transition-transform">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-primary truncate">
              {item.clientName}
              <span className="font-normal text-primary/50"> joined your client list</span>
            </p>
            <span className="shrink-0 text-xs text-primary/40">
              {formatRelativeTime(item.occurredAt)}
            </span>
          </div>
        </Card>
      </Link>
    );
  }

  if (item.kind === "client_left") {
    // No link — once the relationship is gone the coach can't open the client.
    return (
      <Card>
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-primary truncate">
            {item.clientName}
            <span className="font-normal text-primary/50"> left your client list</span>
          </p>
          <span className="shrink-0 text-xs text-primary/40">
            {formatRelativeTime(item.occurredAt)}
          </span>
        </div>
      </Card>
    );
  }

  // client_intake_completed
  return (
    <Link href={`/clients/${item.clientId}/generate`}>
      <Card className="active:scale-[0.98] transition-transform">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-primary truncate">
            {item.clientName}
            <span className="font-normal text-primary/50"> finished their intake</span>
          </p>
          <span className="shrink-0 text-xs text-primary/40">
            {formatRelativeTime(item.occurredAt)}
          </span>
        </div>
        <p className="mt-2 text-xs font-semibold text-accent">Generate their program →</p>
      </Card>
    </Link>
  );
}
