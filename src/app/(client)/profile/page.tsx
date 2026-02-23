import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/auth.actions";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { Profile } from "@/types/app.types";

export default async function ProfilePage() {
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
              {profile?.full_name ?? "Client"}
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
                {profile?.role ?? "client"}
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
                  : "—"}
              </span>
            </div>
          </div>
        </Card>

        {/* Sign out */}
        <form action={signOut}>
          <Button type="submit" variant="ghost" fullWidth className="text-red-600 hover:bg-red-50">
            Sign Out
          </Button>
        </form>
      </div>
    </>
  );
}
