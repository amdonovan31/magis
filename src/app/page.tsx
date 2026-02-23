import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Root page — reads user role from JWT and redirects:
 * - coaches → /dashboard
 * - clients → /home
 * - unauthenticated → /login
 */
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.app_metadata?.role as "coach" | "client" | undefined;

  if (role === "coach") {
    redirect("/dashboard");
  } else {
    redirect("/home");
  }
}
