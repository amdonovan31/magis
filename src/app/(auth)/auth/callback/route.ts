import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const role = data.user.app_metadata?.role as "coach" | "client" | "solo" | undefined;

      // Clients and solo users who haven't completed onboarding
      if (role === "client" || role === "solo") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_complete")
          .eq("id", data.user.id)
          .single();

        if (!profile?.onboarding_complete) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      const redirectPath = role === "coach" ? "/dashboard" : "/home";
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Auth error → back to login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
