import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Clients / Activity tab header shared by /dashboard and /dashboard/activity.
 * Server component — the tabs are plain links (each route server-renders).
 */
export default function DashboardTabs({ active }: { active: "clients" | "activity" }) {
  return (
    <div className="mx-4 mt-4 mb-1 flex rounded-xl bg-surface p-1">
      <Link
        href="/dashboard"
        className={cn(
          "flex-1 rounded-lg py-2 text-center text-sm font-semibold transition-colors",
          active === "clients" ? "bg-accent text-accent-light" : "text-muted"
        )}
      >
        Clients
      </Link>
      <Link
        href="/dashboard/activity"
        className={cn(
          "flex-1 rounded-lg py-2 text-center text-sm font-semibold transition-colors",
          active === "activity" ? "bg-accent text-accent-light" : "text-muted"
        )}
      >
        Activity
      </Link>
    </div>
  );
}
