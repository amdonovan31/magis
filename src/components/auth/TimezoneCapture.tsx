"use client";

import { useEffect, useRef } from "react";
import { setUserTimezone } from "@/lib/actions/auth.actions";

/**
 * Renders nothing. On first authenticated load with a null profile.timezone,
 * captures Intl.DateTimeFormat().resolvedOptions().timeZone and POSTs it.
 * One-shot per session — never auto-overwrites once set, so a user who
 * travels keeps their original TZ until they edit it themselves.
 */
export default function TimezoneCapture({ shouldCapture }: { shouldCapture: boolean }) {
  const sent = useRef(false);

  useEffect(() => {
    if (!shouldCapture || sent.current) return;
    sent.current = true;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) void setUserTimezone(tz);
    } catch {
      // Older browsers without resolvedOptions; leave timezone null and
      // server will fall back to the default. Not worth surfacing.
    }
  }, [shouldCapture]);

  return null;
}
