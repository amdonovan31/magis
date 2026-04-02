import { createClient } from "@/lib/supabase/server";
import { getTodayISO } from "@/lib/utils/date";
import type { BodyMeasurement } from "@/types/app.types";

/**
 * Get measurement history for a user, optionally filtered by metric type.
 * If `clientId` is provided, verifies the caller is the client's coach.
 * Otherwise uses the authenticated user's own data.
 */
export async function getMeasurements(
  clientId?: string,
  metricType?: string,
  limit: number = 50
): Promise<BodyMeasurement[]> {
  const supabase = await createClient();

  let userId: string;

  if (clientId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: rel } = await supabase
      .from("coach_client_relationships")
      .select("client_id")
      .eq("coach_id", user.id)
      .eq("client_id", clientId)
      .maybeSingle();

    if (!rel) return [];
    userId = clientId;
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    userId = user.id;
  }

  let query = supabase
    .from("body_measurements")
    .select("*")
    .eq("user_id", userId)
    .order("measured_at", { ascending: false })
    .limit(limit);

  if (metricType) {
    query = query.eq("metric_type", metricType);
  }

  const { data } = await query;
  return (data ?? []) as BodyMeasurement[];
}

/**
 * Get the single most recent measurement per metric type for a user.
 * Used for dashboard summary cards.
 */
export async function getLatestMeasurements(
  clientId?: string
): Promise<BodyMeasurement[]> {
  const supabase = await createClient();

  let userId: string;

  if (clientId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: rel } = await supabase
      .from("coach_client_relationships")
      .select("client_id")
      .eq("coach_id", user.id)
      .eq("client_id", clientId)
      .maybeSingle();

    if (!rel) return [];
    userId = clientId;
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    userId = user.id;
  }

  const { data } = await supabase
    .from("body_measurements")
    .select("*")
    .eq("user_id", userId)
    .order("measured_at", { ascending: false });

  if (!data) return [];

  // Deduplicate: keep only the first (most recent) entry per metric_type
  const seen = new Set<string>();
  const latest: BodyMeasurement[] = [];

  for (const row of data) {
    if (!seen.has(row.metric_type)) {
      seen.add(row.metric_type);
      latest.push(row);
    }
  }

  return latest;
}

/**
 * Get today's weight log and the user's preferred unit.
 * Returns null if no weight was logged today.
 */
export async function getTodayWeight(): Promise<{
  entry: { id: string; value: number; unit: string } | null;
  preferredUnit: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { entry: null, preferredUnit: "lbs" };

  const today = getTodayISO();

  const [{ data: measurement }, { data: profile }] = await Promise.all([
    supabase
      .from("body_measurements")
      .select("id, value, unit")
      .eq("user_id", user.id)
      .eq("metric_type", "weight")
      .gte("measured_at", `${today}T00:00:00`)
      .lt("measured_at", `${today}T23:59:59.999`)
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("preferred_unit")
      .eq("id", user.id)
      .single(),
  ]);

  const preferredUnit = (profile?.preferred_unit as string) ?? "lbs";

  return {
    entry: measurement ? { id: measurement.id, value: measurement.value, unit: measurement.unit } : null,
    preferredUnit,
  };
}
