"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Renders nothing. Calls router.refresh() when the tab regains focus or
 * becomes visible — the v1 refresh strategy for the coach Activity feed
 * (server-render + revalidate-on-focus, no realtime/polling).
 *
 * Pull-to-refresh is deliberately not in v1 — custom touch handlers risk
 * platform-specific scroll bugs; refresh-on-focus plus the browser's native
 * refresh affordance covers the need.
 */
export default function RefreshOnFocus() {
  const router = useRouter();

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") router.refresh();
    }
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
