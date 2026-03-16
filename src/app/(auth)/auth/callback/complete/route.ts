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

  const user = data.user;
  const role = user.app_metadata?.role as
    | "coach"
    | "client"
    | "solo"
    | undefined;

  // Clients and solo users who haven't completed onboarding
  if (role === "client" || role === "solo") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_complete) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  // Multi-role users see the role picker
  const { data: profileData } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single();

  if (profileData && profileData.roles.length > 1) {
    return NextResponse.redirect(`${origin}/choose-role`);
  }

  const redirectPath = role === "coach" ? "/dashboard" : "/home";
  return NextResponse.redirect(`${origin}${redirectPath}`);
}
