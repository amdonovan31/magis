import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils/date";
import type { ClientWithProgram } from "@/types/app.types";

interface ClientCardProps {
  client: ClientWithProgram;
}

export default function ClientCard({ client }: ClientCardProps) {
  const { profile, activeProgram, lastSessionDate, streak, unreadNotes, intakeComplete, intakeRequested } = client;

  return (
    <Link href={`/clients/${profile.id}`}>
      <Card className="flex items-center gap-4 active:scale-[0.98] transition-transform">
        {/* Avatar */}
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
          {profile.full_name?.[0]?.toUpperCase() ?? "?"}
          {unreadNotes > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {unreadNotes}
            </span>
          )}
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
          {lastSessionDate && (
            <p className="text-xs text-primary/40 mt-0.5">
              Last active: {formatRelativeTime(lastSessionDate)}
            </p>
          )}
        </div>

        {/* Right side */}
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          {activeProgram ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="default">No Program</Badge>
          )}
          {!intakeComplete && intakeRequested && (
            <Badge variant="warning">Intake Pending</Badge>
          )}
          {streak > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-[#1B2E4B]">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 23c-3.6 0-8-3.1-8-8.5C4 9 8 3 12 1c4 2 8 8 8 13.5 0 5.4-4.4 8.5-8 8.5zm0-19.5C9.3 6.2 6 11.1 6 14.5 6 18.5 9 21 12 21s6-2.5 6-6.5c0-3.4-3.3-8.3-6-11z"/>
              </svg>
              {streak}w
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
