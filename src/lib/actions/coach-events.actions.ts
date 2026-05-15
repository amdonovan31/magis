"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

/**
 * Lazily materialize end_of_program_alert rows for the given clients —
 * published programs within 7 days of ends_on (client timezone) with no
 * scheduled successor. Idempotent (partial unique index on coach_events).
 *
 * Called on coach Activity-tab load, mirroring PR 1's maybePromoteScheduled.
 * Failures degrade gracefully — the caller's render is never blocked.
 */
export async function maybeMaterializeEndOfProgramAlerts(
  clientIds?: string[],
): Promise<number> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("materialize_end_of_program_alerts", {
      p_client_ids: clientIds,
    });
    if (error) {
      logger.error("materialize_end_of_program_alerts RPC failed", { error });
      return 0;
    }
    return (data as number | null) ?? 0;
  } catch (err) {
    logger.error("maybeMaterializeEndOfProgramAlerts threw", { error: String(err) });
    return 0;
  }
}
