import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ConnectToCoachButton from "@/components/auth/ConnectToCoachButton";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const { coachId } = await params;
  const supabase = await createClient();

  // Fetch the coach profile (public read enabled by migration 043)
  const { data: coach } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .eq("id", coachId)
    .maybeSingle();

  if (!coach || coach.role !== "coach") {
    notFound();
  }

  const coachName = coach.full_name || "Your coach";
  const coachInitial = coachName[0]?.toUpperCase() ?? "?";

  // Check current auth state
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let viewerState:
    | "logged_out"
    | "self"
    | "coach_other"
    | "client_no_coach"
    | "client_same_coach"
    | "client_different_coach"
    | "solo" = "logged_out";

  if (user) {
    if (user.id === coachId) {
      viewerState = "self";
    } else {
      const role = user.app_metadata?.role as string | undefined;
      if (role === "coach") {
        viewerState = "coach_other";
      } else if (role === "solo") {
        viewerState = "solo";
      } else {
        // client — check existing relationship
        const { data: existing } = await supabase
          .from("coach_client_relationships")
          .select("coach_id")
          .eq("client_id", user.id)
          .maybeSingle();
        if (!existing) {
          viewerState = "client_no_coach";
        } else if (existing.coach_id === coachId) {
          viewerState = "client_same_coach";
        } else {
          viewerState = "client_different_coach";
        }
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-primary">Magis</h1>
        </div>

        <Card padding="lg">
          {/* Coach header */}
          <div className="flex flex-col items-center text-center">
            {coach.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coach.avatar_url}
                alt={coachName}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                {coachInitial}
              </div>
            )}
            <h2 className="mt-3 text-xl font-bold text-primary">
              Join Magis with {coachName}
            </h2>
            <p className="mt-1 text-sm text-primary/60">
              You&apos;ve been invited to train with {coachName}.
            </p>
          </div>

          {/* CTA varies by viewer state */}
          <div className="mt-6">
            {viewerState === "logged_out" && (
              <div className="flex flex-col gap-3">
                <Link href={`/signup?coach_id=${coachId}`}>
                  <Button fullWidth size="lg">
                    Sign Up
                  </Button>
                </Link>
                <p className="text-center text-sm text-primary/60">
                  Already have an account?{" "}
                  <Link
                    href={`/login?next=${encodeURIComponent(`/invite/${coachId}`)}`}
                    className="font-medium text-[#1B2E4B] hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            )}

            {viewerState === "client_no_coach" && (
              <ConnectToCoachButton coachId={coachId} coachName={coachName} />
            )}

            {viewerState === "client_same_coach" && (
              <div className="flex flex-col gap-3 text-center">
                <p className="text-sm text-primary/70">
                  You&apos;re already connected with {coachName}.
                </p>
                <Link href="/home">
                  <Button fullWidth size="lg" variant="secondary">
                    Go to Home
                  </Button>
                </Link>
              </div>
            )}

            {viewerState === "client_different_coach" && (
              <p className="text-center text-sm text-primary/70">
                You&apos;re already coached by another coach. Contact them if you
                want to switch.
              </p>
            )}

            {viewerState === "self" && (
              <div className="flex flex-col gap-3 text-center">
                <p className="text-sm text-primary/70">
                  This is your invite link. Share it with clients to connect them
                  to you automatically.
                </p>
                <Link href="/dashboard">
                  <Button fullWidth size="lg" variant="secondary">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}

            {viewerState === "coach_other" && (
              <div className="flex flex-col gap-3 text-center">
                <p className="text-sm text-primary/70">
                  Coaches can&apos;t connect to other coaches as a client.
                </p>
                <Link href="/dashboard">
                  <Button fullWidth size="lg" variant="secondary">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}

            {viewerState === "solo" && (
              <div className="flex flex-col gap-3 text-center">
                <p className="text-sm text-primary/70">
                  Solo users can&apos;t connect to a coach yet. This will be
                  supported in a future update.
                </p>
                <Link href="/home">
                  <Button fullWidth size="lg" variant="secondary">
                    Go to Home
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
