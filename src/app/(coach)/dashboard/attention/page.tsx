import Link from "next/link";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import AttentionEventCard from "@/components/coach/AttentionEventCard";
import RefreshOnFocus from "@/components/coach/RefreshOnFocus";
import { getCoachAttention } from "@/lib/queries/coach-activity.queries";

export const dynamic = "force-dynamic";

export default async function AttentionPage() {
  const attention = await getCoachAttention();
  // getCoachAttention returns null for non-coach sessions; middleware already
  // redirects non-coaches off /dashboard, this is belt-and-braces.
  if (!attention) redirect("/home");

  return (
    <>
      <TopBar
        title="Clients needing attention"
        left={
          <Link
            href="/dashboard"
            className="text-sm text-primary/60 hover:text-primary"
          >
            ← Dashboard
          </Link>
        }
      />
      <RefreshOnFocus />
      <div className="px-4 pt-4 pb-4">
        {attention.items.length === 0 ? (
          <Card padding="lg" className="text-center">
            <div className="text-4xl mb-3">🌿</div>
            <h2 className="text-lg font-semibold text-primary">
              No clients need attention right now
            </h2>
            <p className="mt-1 text-sm text-primary/60">
              End-of-program and inactivity alerts will show up here.
            </p>
            <Link
              href="/dashboard"
              className="mt-3 inline-block text-sm font-semibold text-accent"
            >
              Back to Client List
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {attention.items.map((item) => (
              <AttentionEventCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
