// IndexedDB-based workout session persistence.
// Safety net for active workout sessions — protects against connectivity loss and page refreshes.
// All operations are async and wrapped in try/catch to fail silently.

import { getDB } from "@/lib/offline/db";

const KEY_PREFIX = "magis_workout_";

export type PersistedSet = {
  templateExerciseId: string;
  exerciseIdOverride: string | null;
  setNumber: number;
  repsCompleted: number | null;
  weightUsed: string | null;
  completed: boolean;
  completedAt: number;
  exerciseId?: string;
};

export type FreeExerciseEntry = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string | null;
};

export type PersistedSession = {
  sessionId: string;
  lastUpdated: number;
  sets: Record<string, PersistedSet>;
  swappedExercises: Record<string, string>;
  skippedExercises?: string[];
  mode?: "template" | "free";
  freeExercises?: FreeExerciseEntry[];
};

function createEmpty(sessionId: string): PersistedSession {
  return {
    sessionId,
    lastUpdated: Date.now(),
    sets: {},
    swappedExercises: {},
  };
}

let migrated = false;

async function migrateFromLocalStorage(): Promise<void> {
  if (migrated) return;
  migrated = true;
  try {
    if (typeof localStorage === "undefined") return;
    const db = await getDB();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key?.startsWith(KEY_PREFIX)) continue;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const session = JSON.parse(raw) as PersistedSession;
        await db.put("sessions", session);
        localStorage.removeItem(key);
      } catch {
        localStorage.removeItem(key!);
      }
    }
  } catch {
    // localStorage or IndexedDB unavailable
  }
}

async function ensureSession(sessionId: string): Promise<PersistedSession> {
  await migrateFromLocalStorage();
  const db = await getDB();
  return (await db.get("sessions", sessionId)) ?? createEmpty(sessionId);
}

export async function persistSet(sessionId: string, set: PersistedSet): Promise<void> {
  try {
    const session = await ensureSession(sessionId);
    const key = `${set.templateExerciseId}_${set.setNumber}`;
    session.sets[key] = set;
    session.lastUpdated = Date.now();
    const db = await getDB();
    await db.put("sessions", session);
  } catch { /* silent */ }
}

export async function persistSwap(
  sessionId: string,
  templateExerciseId: string,
  alternateExerciseId: string
): Promise<void> {
  try {
    const session = await ensureSession(sessionId);
    session.swappedExercises[templateExerciseId] = alternateExerciseId;
    session.lastUpdated = Date.now();
    const db = await getDB();
    await db.put("sessions", session);
  } catch { /* silent */ }
}

export async function removeSwap(
  sessionId: string,
  templateExerciseId: string
): Promise<void> {
  try {
    const session = await ensureSession(sessionId);
    delete session.swappedExercises[templateExerciseId];
    session.lastUpdated = Date.now();
    const db = await getDB();
    await db.put("sessions", session);
  } catch { /* silent */ }
}

export async function persistSkip(
  sessionId: string,
  templateExerciseId: string
): Promise<void> {
  try {
    const session = await ensureSession(sessionId);
    const skipped = session.skippedExercises ?? [];
    if (!skipped.includes(templateExerciseId)) {
      session.skippedExercises = [...skipped, templateExerciseId];
      session.lastUpdated = Date.now();
      const db = await getDB();
      await db.put("sessions", session);
    }
  } catch { /* silent */ }
}

export async function getPersistedSession(
  sessionId: string
): Promise<PersistedSession | null> {
  try {
    await migrateFromLocalStorage();
    const db = await getDB();
    return (await db.get("sessions", sessionId)) ?? null;
  } catch {
    return null;
  }
}

export async function clearPersistedSession(sessionId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete("sessions", sessionId);
  } catch { /* silent */ }
}

export async function persistFreeSet(
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  data: { repsCompleted: number | null; weightUsed: string | null }
): Promise<void> {
  try {
    const session = await ensureSession(sessionId);
    session.mode = "free";
    const key = `${exerciseId}_${setNumber}`;
    session.sets[key] = {
      templateExerciseId: "",
      exerciseIdOverride: null,
      exerciseId,
      setNumber,
      repsCompleted: data.repsCompleted,
      weightUsed: data.weightUsed,
      completed: true,
      completedAt: Date.now(),
    };
    session.lastUpdated = Date.now();
    const db = await getDB();
    await db.put("sessions", session);
  } catch { /* silent */ }
}

export async function persistFreeExerciseList(
  sessionId: string,
  exercises: FreeExerciseEntry[]
): Promise<void> {
  try {
    const session = await ensureSession(sessionId);
    session.mode = "free";
    session.freeExercises = exercises;
    session.lastUpdated = Date.now();
    const db = await getDB();
    await db.put("sessions", session);
  } catch { /* silent */ }
}

export async function pruneOldSessions(
  maxAgeMs: number = 48 * 60 * 60 * 1000
): Promise<void> {
  try {
    await migrateFromLocalStorage();
    const db = await getDB();
    const now = Date.now();
    const allSessions = await db.getAll("sessions");
    for (const session of allSessions) {
      if (now - session.lastUpdated > maxAgeMs) {
        await db.delete("sessions", session.sessionId);
      }
    }
  } catch { /* silent */ }
}
