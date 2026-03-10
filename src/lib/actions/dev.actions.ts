"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function switchDevRole(role: "coach" | "client" | "solo") {
  if (process.env.NODE_ENV !== "development") {
    return { error: "Only available in development" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const adminClient = createAdminClient();

  // Update app_metadata so the next JWT refresh carries the new role
  const { error: metaError } = await adminClient.auth.admin.updateUserById(
    user.id,
    { app_metadata: { role } }
  );
  if (metaError) return { error: metaError.message };

  // Keep the profiles table in sync
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", user.id);
  if (profileError) return { error: profileError.message };

  return { success: true };
}
