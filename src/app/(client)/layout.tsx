import BottomNav from "@/components/layout/BottomNav";
import PageWrapper from "@/components/layout/PageWrapper";
import RoleSwitcher from "@/components/layout/RoleSwitcher";
import { createClient } from "@/lib/supabase/server";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let roles: string[] = [];
  let currentRole: "client" | "solo" = "client";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles, role")
      .eq("id", user.id)
      .single();
    roles = profile?.roles ?? [];
    if (profile?.role === "solo") currentRole = "solo";
  }

  return (
    <>
      <PageWrapper>{children}</PageWrapper>
      <BottomNav role="client" />
      <RoleSwitcher currentRole={currentRole} availableRoles={roles} />
    </>
  );
}
