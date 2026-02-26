import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const role = data.user.app_metadata?.role as "coach" | "client" | undefined;

      // Check if client needs onboarding (no full_name set)
      if (role === "client") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .single();

        if (!profile?.full_name) {
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
