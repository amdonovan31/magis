import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/auth.actions";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EnrollAsClientButton from "@/components/coach/EnrollAsClientButton";
import DisclaimerAcceptButton from "@/components/disclaimer/DisclaimerAcceptButton";
import { DISCLAIMER_BODY } from "@/lib/disclaimer/constants";
import type { Profile } from "@/types/app.types";

export default async function CoachProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = rawProfile as Profile | null;

  return (
    <>
      <TopBar title="Profile" />
      <div className="flex flex-col gap-4 px-4 pt-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-white">
            {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-primary">
              {profile?.full_name ?? "Coach"}
            </p>
            <p className="text-sm text-primary/60">{user.email}</p>
          </div>
        </div>

        {/* Info card */}
        <Card>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-primary/60">Role</span>
              <span className="text-sm font-medium text-primary capitalize">
                Coach
              </span>
            </div>
            <div className="h-px bg-primary/10" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-primary/60">Member since</span>
              <span className="text-sm font-medium text-primary">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : "\u2014"}
              </span>
            </div>
          </div>
        </Card>

        {/* Train as client — only show if not already enrolled */}
        {profile && !profile.roles.includes("client") && !profile.roles.includes("solo") && (
          <Card>
            <div className="flex flex-col gap-3">
              <div>
                <p className="font-heading text-base font-semibold text-primary">
                  Train with Magis
                </p>
                <p className="mt-1 text-sm text-muted">
                  Use Magis for your own training. You&apos;ll get a personal intake form and workout tracking, separate from your coaching.
                </p>
              </div>
              <EnrollAsClientButton />
            </div>
          </Card>
        )}

        {/* Terms & Health Disclaimer */}
        <Card>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-primary">
              Terms &amp; Health Disclaimer
            </p>
            <p className="text-xs text-primary/60 leading-relaxed whitespace-pre-line">
              {DISCLAIMER_BODY}
            </p>
            <div className="h-px bg-primary/10" />
            {profile?.disclaimer_accepted_at ? (
              <p className="text-xs text-primary/40">
                Accepted on{" "}
                {new Date(profile.disclaimer_accepted_at).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" }
                )}
              </p>
            ) : (
              <DisclaimerAcceptButton />
            )}
          </div>
        </Card>

        {/* Sign out */}
        <form action={signOut}>
          <Button type="submit" variant="ghost" fullWidth className="text-red-600 hover:bg-red-50">
            Sign Out
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-primary/30">
          Magis beta v{process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0"}
        </p>
      </div>
    </>
  );
}
