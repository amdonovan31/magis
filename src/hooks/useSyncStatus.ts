"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { processQueue } from "@/lib/offline/sync-manager";
import { getPendingCount } from "@/lib/offline/sync-queue";

export type ConnectivityState =
  | { status: "online" }
  | { status: "offline"; pendingCount: number }
  | { status: "syncing"; total: number }
  | { status: "synced"; syncedCount: number }
  | { status: "error"; failedCount: number };

export function useSyncStatus() {
  const [state, setState] = useState<ConnectivityState>({ status: "online" });
  const syncedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSync = useCallback(async () => {
    const pending = await getPendingCount();
    if (pending === 0) {
      setState({ status: "online" });
      return;
    }

    setState({ status: "syncing", total: pending });

    const result = await processQueue();

    if (result.failed > 0 && result.synced === 0) {
      setState({ status: "error", failedCount: result.failed });
    } else if (result.synced > 0) {
      setState({ status: "synced", syncedCount: result.synced });
      syncedTimerRef.current = setTimeout(() => {
        setState({ status: "online" });
      }, 3000);
    } else {
      setState({ status: "online" });
    }
  }, []);

  useEffect(() => {
    async function init() {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const count = await getPendingCount();
        setState({ status: "offline", pendingCount: count });
      }
    }
    init();

    function handleOffline() {
      if (syncedTimerRef.current) clearTimeout(syncedTimerRef.current);
      getPendingCount().then((count) => {
        setState({ status: "offline", pendingCount: count });
      });
    }

    function handleOnline() {
      triggerSync();
    }

    function handleQueueChange() {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        getPendingCount().then((count) => {
          setState({ status: "offline", pendingCount: count });
        });
      }
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("sync-queue-changed", handleQueueChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("sync-queue-changed", handleQueueChange);
      if (syncedTimerRef.current) clearTimeout(syncedTimerRef.current);
    };
  }, [triggerSync]);

  return { state, triggerSync };
}
