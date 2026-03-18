import { logError } from "@/lib/actions/logging.actions";

export const logger = {
  error(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Magis]", message, context);
    }
    // Fire-and-forget — logError never throws
    logError({
      errorMessage: message,
      metadata: context,
    });
  },

  warn(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Magis]", message, context);
    }
  },

  info(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      console.info("[Magis]", message, context);
    }
  },
};
