"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

/**
 * Lazily promote any scheduled programs whose starts_on has arrived in the
 * client's TZ. Idempotent — safe to call from any read path.
 *
 * v1: lazy-only promotion. Surfaces other than coach dashboard / client home
 * (program detail, calendar, etc.) may briefly show stale `scheduled` until
 * the next dashboard or home load fires this. The lifecycle utility's
 * soft-promotion view masks the gap for callers using getProgramLifecycle().
 *
 * Failures degrade gracefully — the caller's render is never blocked. The
 * function logs and returns an empty array on error so the page still loads
 * with the prior published program visible.
 */
export async function maybePromoteScheduled(
  clientIds?: string[],
): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("promote_scheduled_programs", {
      p_client_ids: clientIds,
    });
    if (error) {
      logger.error("promote_scheduled_programs RPC failed", { error });
      return [];
    }
    return (data as string[] | null) ?? [];
  } catch (err) {
    logger.error("maybePromoteScheduled threw", { error: String(err) });
    return [];
  }
}
