"use client";

import { useSyncStatus } from "@/hooks/useSyncStatus";

export default function ConnectivityBanner() {
  const { state } = useSyncStatus();

  if (state.status === "online") return null;

  if (state.status === "offline") {
    return (
      <div className="bg-amber-500/90 text-white text-center text-xs py-1.5 px-4 font-medium">
        You&apos;re offline
        {state.pendingCount > 0 && (
          <> &mdash; {state.pendingCount} set{state.pendingCount !== 1 ? "s" : ""} saved locally</>
        )}
      </div>
    );
  }

  if (state.status === "syncing") {
    return (
      <div className="bg-accent/90 text-white text-center text-xs py-1.5 px-4 font-medium">
        Syncing{state.total > 1 ? ` (${state.total} sets)` : ""}&hellip;
      </div>
    );
  }

  if (state.status === "synced") {
    return (
      <div className="bg-emerald-500/90 text-white text-center text-xs py-1.5 px-4 font-medium">
        Synced {state.syncedCount} set{state.syncedCount !== 1 ? "s" : ""} &#x2713;
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="bg-red-500/90 text-white text-center text-xs py-1.5 px-4 font-medium">
        {state.failedCount} set{state.failedCount !== 1 ? "s" : ""} failed to sync &mdash; will retry
      </div>
    );
  }

  return null;
}
