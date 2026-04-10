import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/layout/TopBar";
import CoachInviteLinkCard from "@/components/coach/CoachInviteLinkCard";
import InviteClientForm from "@/components/coach/InviteClientForm";

export default async function InviteClientPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const inviteUrl = `${siteUrl}/invite/${user.id}`;

  return (
    <>
      <TopBar
        title="Invite Client"
        left={
          <Link href="/clients" className="text-primary/60 hover:text-primary">
            ← Back
          </Link>
        }
      />
      <div className="flex flex-col gap-4 px-4 pt-6">
        <CoachInviteLinkCard inviteUrl={inviteUrl} />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-primary/10" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/40">
            Or invite by email
          </span>
          <div className="h-px flex-1 bg-primary/10" />
        </div>

        <InviteClientForm />
      </div>
    </>
  );
}
