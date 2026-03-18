"use server";

import { createClient } from "@/lib/supabase/server";

export async function acceptDisclaimer(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ disclaimer_accepted_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return {};
}
