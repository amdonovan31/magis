import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils/date";
import type { ClientWithProgram } from "@/types/app.types";

interface ClientCardProps {
  client: ClientWithProgram;
}

export default function ClientCard({ client }: ClientCardProps) {
  const { profile, activeProgram, lastSessionDate } = client;

  return (
    <Link href={`/clients/${profile.id}`}>
      <Card className="flex items-center gap-4 active:scale-[0.98] transition-transform">
        {/* Avatar */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
          {profile.full_name?.[0]?.toUpperCase() ?? "?"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-primary truncate">
            {profile.full_name ?? "Unnamed Client"}
          </p>
          {activeProgram ? (
            <p className="text-sm text-primary/60 truncate">{activeProgram.title}</p>
          ) : (
            <p className="text-sm text-primary/40 italic">No active program</p>
          )}
        </div>

        {/* Right side */}
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          {activeProgram ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="default">No Program</Badge>
          )}
          {lastSessionDate && (
            <span className="text-xs text-primary/40">
              {formatRelativeTime(lastSessionDate)}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
