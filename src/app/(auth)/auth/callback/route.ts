import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // PKCE code exchange flow (normal sign-up / sign-in)
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      return NextResponse.redirect(
        `${origin}${await getRedirectPath(supabase, data.user)}`
      );
    }
  }

  // If no code param, check if this is a hash-fragment invite flow.
  // Hash fragments aren't visible server-side, so serve a tiny HTML page
  // that reads the fragment client-side, sets the session via the Supabase
  // JS client, then redirects to /auth/callback/complete which finishes
  // the server-side redirect logic.
  const hasNoCode = !code;
  if (hasNoCode) {
    // Return a minimal HTML page that handles the hash fragment client-side
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Signing in...</title></head>
<body>
<p>Signing you in...</p>
<script>
  (function() {
    var hash = window.location.hash.substring(1);
    if (!hash) {
      window.location.href = '/login?error=auth_callback_error';
      return;
    }
    var params = new URLSearchParams(hash);
    var accessToken = params.get('access_token');
    var refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      // Redirect to the complete endpoint with tokens as query params
      window.location.href = '/auth/callback/complete?access_token=' +
        encodeURIComponent(accessToken) +
        '&refresh_token=' + encodeURIComponent(refreshToken);
    } else {
      window.location.href = '/login?error=auth_callback_error';
    }
  })();
</script>
</body>
</html>`;
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Auth error → back to login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}

async function getRedirectPath(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; app_metadata: Record<string, unknown> }
): Promise<string> {
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
      return "/onboarding";
    }
  }

  // Multi-role users see the role picker
  const { data: profileData } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single();

  if (profileData && profileData.roles.length > 1) {
    return "/choose-role";
  }

  return role === "coach" ? "/dashboard" : "/home";
}
