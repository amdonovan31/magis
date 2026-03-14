import BottomNav from "@/components/layout/BottomNav";
import PageWrapper from "@/components/layout/PageWrapper";
import RoleSwitcher from "@/components/layout/RoleSwitcher";
import { createClient } from "@/lib/supabase/server";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let roles: string[] = [];
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single();
    roles = profile?.roles ?? [];
  }

  return (
    <>
      <PageWrapper>{children}</PageWrapper>
      <BottomNav role="coach" />
      <RoleSwitcher currentRole="coach" availableRoles={roles} />
    </>
  );
}
