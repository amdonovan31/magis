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

  // Public routes that don't require auth
  // Signup is disabled — only invited clients and existing users can log in
  if (pathname.startsWith("/signup")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  const publicPaths = ["/login", "/auth/callback", "/onboarding"];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  // No user → redirect to login (except public paths)
  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated → enforce role-based routing
  if (user) {
    const role = user.app_metadata?.role as "coach" | "client" | undefined;

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

    // Redirect away from auth pages (but allow /onboarding for new clients)
    if (isPublicPath && pathname !== "/auth/callback" && !pathname.startsWith("/onboarding")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = role === "coach" ? "/dashboard" : "/home";
      return NextResponse.redirect(redirectUrl);
    }

    // Protect coach routes from clients
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/clients") ||
        pathname.startsWith("/library") || pathname.startsWith("/programs")) {
      if (role !== "coach") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/home";
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Protect client routes from coaches
    if (pathname.startsWith("/home") || pathname.startsWith("/workout") ||
        pathname.startsWith("/history")) {
      if (role !== "client") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/dashboard";
        return NextResponse.redirect(redirectUrl);
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
