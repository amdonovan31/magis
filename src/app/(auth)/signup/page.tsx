import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignupRolePicker from "@/components/auth/SignupRolePicker";
import SignupForm from "@/components/auth/SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ coach_id?: string }>;
}) {
  const params = await searchParams;
  const coachId = params.coach_id?.trim() || null;

  // If coach_id is in the URL, this is an invite signup. Skip the role picker
  // and lock the role to "client" with coach_id plumbed through.
  let coachName: string | null = null;
  if (coachId) {
    const supabase = await createClient();
    const { data: coach } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", coachId)
      .maybeSingle();
    if (coach && coach.role === "coach") {
      coachName = coach.full_name ?? null;
    }
  }

  const isInviteSignup = coachId !== null && coachName !== null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">Magis</h1>
          {isInviteSignup ? (
            <p className="mt-2 text-sm text-primary/60">
              Join <span className="font-semibold text-primary">{coachName}</span> on Magis
            </p>
          ) : (
            <p className="mt-2 text-sm text-primary/60">How are you training?</p>
          )}
        </div>

        {isInviteSignup ? (
          <>
            <SignupForm role="client" coachId={coachId!} />
            <p className="mt-4 text-center text-sm text-primary/60">
              Already have an account?{" "}
              <Link
                href={`/login?next=${encodeURIComponent(`/invite/${coachId}`)}`}
                className="font-medium text-[#1B2E4B] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <SignupRolePicker />
            <p className="mt-4 text-center text-sm text-primary/60">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-[#1B2E4B] hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
