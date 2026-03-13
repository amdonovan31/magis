import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * Root page — authenticated users are redirected by role.
 * Unauthenticated users see the branded splash/landing screen.
 */
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const role = user.app_metadata?.role as "coach" | "client" | "solo" | undefined;
    if (role === "coach") {
      redirect("/dashboard");
    } else {
      redirect("/home");
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-10">
        {/* Logo */}
        <img
          src="/magis_logo_clean.svg"
          alt="Magis"
          style={{ width: 180 }}
        />

        {/* Text */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h1
            className="font-heading text-4xl leading-tight"
            style={{ color: "var(--color-primary)" }}
          >
            Train with intention.
          </h1>
          <p
            className="font-body text-xs uppercase tracking-widest"
            style={{ color: "var(--color-muted)" }}
          >
            Performance &amp; Wellness, elevated.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/login"
          className="font-body text-xs font-medium uppercase tracking-widest rounded-xl px-10 py-4 transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-accent-light)",
          }}
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
