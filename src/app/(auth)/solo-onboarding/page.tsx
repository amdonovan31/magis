import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SoloOnboardingForm from "@/components/auth/SoloOnboardingForm";

export default async function SoloOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = user.app_metadata?.role;
  if (role !== "solo") redirect("/");

  // Check if already completed onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_complete) redirect("/home");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">Magis</h1>
          <p className="mt-2 text-sm text-primary/60">
            Let&apos;s build your program
          </p>
        </div>
        <SoloOnboardingForm />
      </div>
    </div>
  );
}
