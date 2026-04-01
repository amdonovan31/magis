// localStorage-based workout session persistence
// Safety net for active workout sessions — protects against connectivity loss and page refreshes.
// All operations are synchronous and wrapped in try/catch to fail silently.

const KEY_PREFIX = "magis_workout_";

export type PersistedSet = {
  templateExerciseId: string;
  exerciseIdOverride: string | null;
  setNumber: number;
  repsCompleted: number | null;
  weightUsed: string | null;
  completed: boolean;
  completedAt: number;
};

export type PersistedSession = {
  sessionId: string;
  lastUpdated: number;
  sets: Record<string, PersistedSet>;
  swappedExercises: Record<string, string>;
  skippedExercises?: string[];
};

function getKey(sessionId: string): string {
  return `${KEY_PREFIX}${sessionId}`;
}

function readSession(sessionId: string): PersistedSession | null {
  try {
    const raw = localStorage.getItem(getKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

function writeSession(session: PersistedSession): void {
  try {
    localStorage.setItem(getKey(session.sessionId), JSON.stringify(session));
  } catch {
    // Quota exceeded or localStorage unavailable — fail silently
  }
}

function ensureSession(sessionId: string): PersistedSession {
  return readSession(sessionId) ?? {
    sessionId,
    lastUpdated: Date.now(),
    sets: {},
    swappedExercises: {},
  };
}

export function persistSet(sessionId: string, set: PersistedSet): void {
  const session = ensureSession(sessionId);
  const key = `${set.templateExerciseId}_${set.setNumber}`;
  session.sets[key] = set;
  session.lastUpdated = Date.now();
  writeSession(session);
}

export function persistSwap(
  sessionId: string,
  templateExerciseId: string,
  alternateExerciseId: string
): void {
  const session = ensureSession(sessionId);
  session.swappedExercises[templateExerciseId] = alternateExerciseId;
  session.lastUpdated = Date.now();
  writeSession(session);
}

export function removeSwap(
  sessionId: string,
  templateExerciseId: string
): void {
  const session = ensureSession(sessionId);
  delete session.swappedExercises[templateExerciseId];
  session.lastUpdated = Date.now();
  writeSession(session);
}

export function persistSkip(
  sessionId: string,
  templateExerciseId: string
): void {
  const session = ensureSession(sessionId);
  const skipped = session.skippedExercises ?? [];
  if (!skipped.includes(templateExerciseId)) {
    session.skippedExercises = [...skipped, templateExerciseId];
    session.lastUpdated = Date.now();
    writeSession(session);
  }
}

export function getPersistedSession(
  sessionId: string
): PersistedSession | null {
  return readSession(sessionId);
}

export function clearPersistedSession(sessionId: string): void {
  try {
    localStorage.removeItem(getKey(sessionId));
  } catch {
    // fail silently
  }
}

export function pruneOldSessions(
  maxAgeMs: number = 48 * 60 * 60 * 1000
): void {
  try {
    const now = Date.now();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key?.startsWith(KEY_PREFIX)) continue;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const session = JSON.parse(raw) as PersistedSession;
        if (now - session.lastUpdated > maxAgeMs) {
          localStorage.removeItem(key);
        }
      } catch {
        // Corrupt entry — remove it
        localStorage.removeItem(key!);
      }
    }
  } catch {
    // localStorage unavailable — fail silently
  }
}
