import Link from "next/link";
import Card from "@/components/ui/Card";
import ActivityEventCard from "@/components/coach/ActivityEventCard";
import type { CoachActivityItem } from "@/lib/queries/coach-activity.queries";

const NEXT_WINDOW: Record<number, number> = { 7: 30, 30: 90 };

/**
 * The coach Activity feed body: newest-first event cards, an empty state,
 * and a "Load older" affordance that widens the window 7 → 30 → 90 days.
 */
export default function ActivityFeed({
  items,
  sinceDays,
}: {
  items: CoachActivityItem[];
  sinceDays: number;
}) {
  if (items.length === 0) {
    return (
      <Card padding="lg" className="text-center">
        <div className="text-4xl mb-3">🌿</div>
        <h2 className="text-lg font-semibold text-primary">
          No activity in the last {sinceDays} days
        </h2>
        <p className="mt-1 text-sm text-primary/60">
          Completed workouts, new clients, and finished intakes will show up here.
        </p>
        <Link
          href="/dashboard"
          className="mt-3 inline-block text-sm font-semibold text-accent"
        >
          Back to Client List
        </Link>
      </Card>
    );
  }

  const nextWindow = NEXT_WINDOW[sinceDays];

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <ActivityEventCard key={item.id} item={item} />
      ))}
      {nextWindow && (
        <Link
          href={`/dashboard/activity?days=${nextWindow}`}
          className="mt-2 py-3 text-center text-sm font-semibold text-accent"
        >
          Load older
        </Link>
      )}
    </div>
  );
}
