import Link from "next/link";
import Card from "@/components/ui/Card";
import { formatRelativeTime } from "@/lib/utils/date";
import { formatShort } from "@/lib/utils/program-lifecycle";
import type { CoachAttentionItem } from "@/lib/queries/coach-activity.queries";

/** Whole days between an ISO timestamp and now. */
function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

/**
 * One row on the coach Attention page — action-needed alerts. Discriminated
 * render over the two attention event types. Accent-styled to read as
 * action-needed, distinct from the passive Activity feed.
 */
export default function AttentionEventCard({ item }: { item: CoachAttentionItem }) {
  if (item.kind === "end_of_program_alert") {
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
          <p className="mt-2 text-xs font-semibold text-accent">Generate next program →</p>
        </Card>
      </Link>
    );
  }

  // client_inactive_alert
  const days = item.lastWorkoutAt ? daysSince(item.lastWorkoutAt) : null;
  return (
    <Link href={`/clients/${item.clientId}`}>
      <Card className="active:scale-[0.98] transition-transform border border-accent/30 bg-accent/5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-primary truncate">
              {item.clientName}
              <span className="font-normal text-primary/50"> has gone quiet</span>
            </p>
            <p className="text-sm text-primary/60 truncate">
              {days !== null
                ? `Hasn't logged a workout in ${days} day${days === 1 ? "" : "s"}`
                : "Hasn't logged a workout yet"}
            </p>
          </div>
          <span className="shrink-0 text-xs text-primary/40">
            {formatRelativeTime(item.occurredAt)}
          </span>
        </div>
        <p className="mt-2 text-xs font-semibold text-accent">View client →</p>
      </Card>
    </Link>
  );
}
