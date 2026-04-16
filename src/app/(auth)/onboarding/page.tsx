import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "@/components/auth/OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.app_metadata?.role as "coach" | "client" | "solo" | undefined;

  // Coaches don't onboard here
  if (role === "coach") {
    redirect("/dashboard");
  }

  // Check if already onboarded
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_complete) {
    redirect("/home");
  }

  // Only invited clients (magic link) need to set a password;
  // self-signup clients already set one during registration.
  const needsPassword = role === "client" && !!user.invited_at;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">Magis</h1>
          <p className="mt-2 text-sm text-primary/60">
            {needsPassword
              ? "Welcome! Set up your profile to get started."
              : "Let\u2019s build your program"}
          </p>
        </div>
        <OnboardingForm role={role ?? "solo"} needsPassword={needsPassword} />
      </div>
    </div>
  );
}
