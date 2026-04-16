import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  // Allow callers (e.g. password reset) to override the post-auth destination.
  const next = searchParams.get("next");
  if (next && next.startsWith("/")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const user = data.user;
  // Role can come from app_metadata (set by trigger) or user_metadata (set by
  // inviteUserByEmail). For fresh invites the JWT predates the trigger, so
  // app_metadata.role is often undefined here. Default to "client".
  const role =
    (user.app_metadata?.role as "coach" | "client" | "solo" | undefined) ??
    (user.user_metadata?.role as "coach" | "client" | "solo" | undefined) ??
    "client";

  // Read profile with retry — handle_new_user trigger may not have completed
  let profile: { onboarding_complete: boolean | null; roles: string[] } | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: p } = await supabase
      .from("profiles")
      .select("onboarding_complete, roles")
      .eq("id", user.id)
      .maybeSingle();
    if (p) {
      profile = p as { onboarding_complete: boolean | null; roles: string[] };
      break;
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 100));
  }

  // Clients and solo users go to onboarding unless explicitly complete
  if (role === "client" || role === "solo") {
    if (!profile?.onboarding_complete) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  // Multi-role users see the role picker
  if (profile && profile.roles && profile.roles.length > 1) {
    return NextResponse.redirect(`${origin}/choose-role`);
  }

  const redirectPath = role === "coach" ? "/dashboard" : "/home";
  return NextResponse.redirect(`${origin}${redirectPath}`);
}
