"use client";

import { useEffect } from "react";
import { logError } from "@/lib/actions/logging.actions";

export default function UnhandledRejectionHandler() {
  useEffect(() => {
    function handler(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection";
      const stack = reason instanceof Error ? reason.stack : undefined;

      // Fire-and-forget
      logError({
        errorMessage: message,
        errorStack: stack,
        component: "unhandledrejection",
        url: window.location.href,
      });
    }

    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return null;
}
