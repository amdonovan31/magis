import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — IMPORTANT: do not remove
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/signup", "/auth/callback", "/auth/callback/complete", "/onboarding", "/choose-role", "/invite"];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  // No user → redirect to login (except public paths)
  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated → enforce role-based routing
  if (user) {
    const role = user.app_metadata?.role as "coach" | "client" | "solo" | undefined;

    // If role is not set yet (race condition between signup and trigger),
    // allow the request through — the page will handle it gracefully
    if (!role) {
      if (isPublicPath) return supabaseResponse;
      // User exists but has no role — sign them out to avoid infinite loop
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("error", "missing_role");
      return NextResponse.redirect(loginUrl);
    }

    // Redirect away from auth pages (but allow /onboarding, /auth/callback, /choose-role, /invite)
    if (isPublicPath && !pathname.startsWith("/auth/callback") && !pathname.startsWith("/onboarding") && !pathname.startsWith("/choose-role") && !pathname.startsWith("/invite")) {
      const redirectUrl = request.nextUrl.clone();
      if (role === "coach") {
        redirectUrl.pathname = "/dashboard";
      } else {
        redirectUrl.pathname = "/home";
      }
      return NextResponse.redirect(redirectUrl);
    }

    // Protect coach routes from clients/solo
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/clients") ||
        pathname.startsWith("/library") || pathname.startsWith("/programs") ||
        pathname.startsWith("/coach-profile")) {
      if (role !== "coach") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/home";
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Protect client routes — allow both client and solo roles
    if (pathname.startsWith("/home") || pathname.startsWith("/workout") ||
        pathname.startsWith("/history") || pathname.startsWith("/calendar") ||
        pathname.startsWith("/profile")) {
      if (role !== "client" && role !== "solo") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/dashboard";
        return NextResponse.redirect(redirectUrl);
      }

      // Enforce onboarding completion for client/solo routes
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user.id)
        .single();

      if (!profile?.onboarding_complete) {
        const onboardingUrl = request.nextUrl.clone();
        onboardingUrl.pathname = "/onboarding";
        return NextResponse.redirect(onboardingUrl);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
