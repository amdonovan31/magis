import { getDB } from "./db";

export type QueueEntry = {
  id?: number;
  type: "set_log";
  payload: Record<string, unknown>;
  createdAt: number;
  status: "pending" | "syncing" | "failed";
  retryCount: number;
};

const MAX_RETRIES = 5;

export async function addToQueue(
  entry: Omit<QueueEntry, "id" | "createdAt" | "status" | "retryCount">
): Promise<void> {
  try {
    const db = await getDB();
    await db.add("syncQueue", {
      ...entry,
      createdAt: Date.now(),
      status: "pending",
      retryCount: 0,
    });
  } catch { /* silent */ }
}

export async function getPendingEntries(): Promise<QueueEntry[]> {
  try {
    const db = await getDB();
    const all = await db.getAll("syncQueue");
    return all.filter(
      (e) => (e.status === "pending" || e.status === "failed") && e.retryCount < MAX_RETRIES
    ).sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

export async function getPendingCount(): Promise<number> {
  try {
    const entries = await getPendingEntries();
    return entries.length;
  } catch {
    return 0;
  }
}

export async function markSyncing(id: number): Promise<void> {
  try {
    const db = await getDB();
    const entry = await db.get("syncQueue", id);
    if (entry) {
      entry.status = "syncing";
      await db.put("syncQueue", entry);
    }
  } catch { /* silent */ }
}

export async function markSynced(id: number): Promise<void> {
  try {
    const db = await getDB();
    await db.delete("syncQueue", id);
  } catch { /* silent */ }
}

export async function markFailed(id: number): Promise<void> {
  try {
    const db = await getDB();
    const entry = await db.get("syncQueue", id);
    if (entry) {
      entry.retryCount++;
      entry.status = entry.retryCount >= MAX_RETRIES ? "failed" : "pending";
      await db.put("syncQueue", entry);
    }
  } catch { /* silent */ }
}

export async function clearQueue(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear("syncQueue");
  } catch { /* silent */ }
}
