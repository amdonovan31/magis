import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils/date";
import { formatShort } from "@/lib/utils/program-lifecycle";
import type { CoachActivityItem } from "@/lib/queries/coach-activity.queries";

/**
 * One row in the coach Activity feed. Discriminated render over the three
 * v1 event types.
 */
export default function ActivityEventCard({ item }: { item: CoachActivityItem }) {
  if (item.kind === "workout_completed") {
    return (
      <Card>
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
      </Card>
    );
  }

  if (item.kind === "client_comment") {
    const context = [item.exerciseName, item.programTitle].filter(Boolean).join(" · ");
    return (
      <Card>
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-primary truncate">
            {item.clientName}
            <span className="font-normal text-primary/50"> left a comment</span>
          </p>
          <span className="shrink-0 text-xs text-primary/40">
            {formatRelativeTime(item.occurredAt)}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-primary/80 whitespace-pre-line">
          &ldquo;{item.content}&rdquo;
        </p>
        {context && <p className="mt-1 text-xs text-primary/40">on {context}</p>}
      </Card>
    );
  }

  // end_of_program_alert
  return (
    <Link href={`/clients/${item.clientId}/generate/next`}>
      <Card className="active:scale-[0.98] transition-transform border border-accent/30 bg-accent/5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-primary truncate">
              {item.clientName}
              <span className="font-normal text-primary/50">&apos;s program is ending</span>
            </p>
            <p className="text-sm text-primary/60 truncate">
              {item.programTitle} · ends {formatShort(item.endsOn)}
            </p>
          </div>
          <span className="shrink-0 text-xs text-primary/40">
            {formatRelativeTime(item.occurredAt)}
          </span>
        </div>
        <p className="mt-2 text-xs font-semibold text-accent">
          Generate next program →
        </p>
      </Card>
    </Link>
  );
}
