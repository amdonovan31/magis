import BottomNav from "@/components/layout/BottomNav";
import PageWrapper from "@/components/layout/PageWrapper";
import RoleSwitcher from "@/components/layout/RoleSwitcher";
import DisclaimerGate from "@/components/disclaimer/DisclaimerGate";
import BetaShell from "@/components/error/BetaShell";
import { createClient } from "@/lib/supabase/server";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let roles: string[] = [];
  let currentRole: "client" | "solo" = "client";
  let disclaimerAcceptedAt: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles, role, disclaimer_accepted_at")
      .eq("id", user.id)
      .single();
    roles = profile?.roles ?? [];
    if (profile?.role === "solo") currentRole = "solo";
    disclaimerAcceptedAt = profile?.disclaimer_accepted_at ?? null;
  }

  return (
    <>
      <DisclaimerGate disclaimerAcceptedAt={disclaimerAcceptedAt}>
        <BetaShell>
          <PageWrapper>{children}</PageWrapper>
          <BottomNav role="client" />
        </BetaShell>
      </DisclaimerGate>
      <RoleSwitcher currentRole={currentRole} availableRoles={roles} />
    </>
  );
}
