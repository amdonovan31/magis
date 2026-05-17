import Link from "next/link";
import Card from "@/components/ui/Card";

/**
 * Dashboard banner linking to /dashboard/attention. Renders nothing when there
 * are no open attention items, so the dashboard can mount it unconditionally.
 */
export default function AttentionBanner({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <Link href="/dashboard/attention">
      <Card className="active:scale-[0.98] transition-transform border border-accent/30 bg-accent/5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-primary">
            Clients needing attention
            <span className="font-normal text-primary/50"> ({count})</span>
          </p>
          <span className="shrink-0 text-xs font-semibold text-accent">Review →</span>
        </div>
      </Card>
    </Link>
  );
}
