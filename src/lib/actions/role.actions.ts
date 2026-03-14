"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function switchActiveRole(role: "coach" | "client" | "solo") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify the user actually has this role
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.roles.includes(role)) {
    return { error: "You do not have this role" };
  }

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

export async function addRoleToProfile(newRole: "coach" | "client" | "solo") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };

  if (profile.roles.includes(newRole)) {
    return { success: true }; // Already has this role
  }

  const { error } = await supabase
    .from("profiles")
    .update({ roles: [...profile.roles, newRole] })
    .eq("id", user.id);

  if (error) return { error: error.message };

  return { success: true };
}
