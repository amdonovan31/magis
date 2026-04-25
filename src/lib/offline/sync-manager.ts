import { getPendingEntries, markSyncing, markSynced, markFailed } from "./sync-queue";
import { logSet } from "@/lib/actions/session.actions";

let syncing = false;

export async function processQueue(): Promise<{ synced: number; failed: number }> {
  if (syncing) return { synced: 0, failed: 0 };
  syncing = true;

  try {
    const entries = await getPendingEntries();
    let synced = 0;
    let failed = 0;

    for (const entry of entries) {
      await markSyncing(entry.id!);

      try {
        if (entry.type === "set_log") {
          const result = await logSet(
            entry.payload as Parameters<typeof logSet>[0]
          );
          if (result?.error) {
            await markFailed(entry.id!);
            failed++;
          } else {
            await markSynced(entry.id!);
            synced++;
          }
        }
      } catch {
        await markFailed(entry.id!);
        failed++;
      }
    }

    return { synced, failed };
  } finally {
    syncing = false;
  }
}
