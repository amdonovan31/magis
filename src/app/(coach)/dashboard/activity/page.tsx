import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import DashboardTabs from "@/components/coach/DashboardTabs";
import ActivityFeed from "@/components/coach/ActivityFeed";
import RefreshOnFocus from "@/components/coach/RefreshOnFocus";
import { getCoachActivityFeed } from "@/lib/queries/coach-activity.queries";

export const dynamic = "force-dynamic";

const ALLOWED_WINDOWS = [7, 30, 90];

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days } = await searchParams;
  const parsed = Number(days);
  const sinceDays = ALLOWED_WINDOWS.includes(parsed) ? parsed : 7;

  const feed = await getCoachActivityFeed(sinceDays);
  // getCoachActivityFeed returns null for non-coach sessions; middleware
  // already redirects non-coaches off /dashboard, this is belt-and-braces.
  if (!feed) redirect("/home");

  return (
    <>
      <TopBar showLogo />
      <DashboardTabs active="activity" />
      <RefreshOnFocus />
      <div className="px-4 pt-2 pb-4">
        <ActivityFeed items={feed.items} sinceDays={feed.sinceDays} />
      </div>
    </>
  );
}
