import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // PKCE code exchange flow (normal sign-up / sign-in / password reset)
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Allow callers (e.g. password reset) to override the post-auth destination.
      const next = searchParams.get("next");
      if (next && next.startsWith("/")) {
        return NextResponse.redirect(`${origin}${next}`);
      }

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
      // Forward any next param from the query string (e.g. password reset)
      var qs = new URLSearchParams(window.location.search);
      var next = qs.get('next') || '';
      var extra = next ? '&next=' + encodeURIComponent(next) : '';
      window.location.href = '/auth/callback/complete?access_token=' +
        encodeURIComponent(accessToken) +
        '&refresh_token=' + encodeURIComponent(refreshToken) + extra;
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
  user: {
    id: string;
    app_metadata: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  }
): Promise<string> {
  // Role can come from app_metadata (set by trigger after profile insert) OR
  // user_metadata (set by inviteUserByEmail before the trigger runs).
  // For freshly invited users the JWT was issued before the trigger fired,
  // so app_metadata.role may be undefined on the first callback hit.
  const role =
    (user.app_metadata?.role as "coach" | "client" | "solo" | undefined) ??
    (user.user_metadata?.role as "coach" | "client" | "solo" | undefined) ??
    "client"; // Default to client — safest for invited users

  // Read profile with retry — the handle_new_user trigger may not have
  // completed by the time we query, especially for fresh invites.
  let profile: { onboarding_complete: boolean | null; roles: string[] } | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_complete, roles")
      .eq("id", user.id)
      .maybeSingle();
    if (data) {
      profile = data as { onboarding_complete: boolean | null; roles: string[] };
      break;
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 100));
  }

  // Clients and solo users go to onboarding unless explicitly complete.
  // Treat missing profile or null onboarding_complete as "not complete."
  if (role === "client" || role === "solo") {
    if (!profile?.onboarding_complete) {
      return "/onboarding";
    }
  }

  // Multi-role users see the role picker
  if (profile && profile.roles && profile.roles.length > 1) {
    return "/choose-role";
  }

  return role === "coach" ? "/dashboard" : "/home";
}
