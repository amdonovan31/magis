import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { PersistedSet, FreeExerciseEntry } from "@/lib/workout-persistence";

export interface MagisDB extends DBSchema {
  sessions: {
    key: string;
    value: {
      sessionId: string;
      lastUpdated: number;
      mode?: "template" | "free";
      sets: Record<string, PersistedSet>;
      swappedExercises: Record<string, string>;
      skippedExercises?: string[];
      freeExercises?: FreeExerciseEntry[];
    };
  };
  syncQueue: {
    key: number;
    value: {
      id?: number;
      type: "set_log";
      payload: Record<string, unknown>;
      createdAt: number;
      status: "pending" | "syncing" | "failed";
      retryCount: number;
    };
    indexes: { "by-status": string };
  };
}

let dbPromise: Promise<IDBPDatabase<MagisDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<MagisDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MagisDB>("magis-offline", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("sessions")) {
          db.createObjectStore("sessions", { keyPath: "sessionId" });
        }
        if (!db.objectStoreNames.contains("syncQueue")) {
          const store = db.createObjectStore("syncQueue", {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("by-status", "status");
        }
      },
    });
  }
  return dbPromise;
}
