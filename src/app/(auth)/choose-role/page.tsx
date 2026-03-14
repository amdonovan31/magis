import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RolePickerCard from "@/components/auth/RolePickerCard";

export default async function ChooseRolePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single();

  if (!profile || profile.roles.length <= 1) {
    const role = user.app_metadata?.role;
    redirect(role === "coach" ? "/dashboard" : "/home");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-primary">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted">
            How would you like to use Magis?
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {profile.roles.includes("coach") && (
            <RolePickerCard
              role="coach"
              title="Coach"
              description="Manage clients, design programs, and track progress"
              redirect="/dashboard"
            />
          )}
          {(profile.roles.includes("client") || profile.roles.includes("solo")) && (
            <RolePickerCard
              role={profile.roles.includes("client") ? "client" : "solo"}
              title="Client"
              description="View your workouts, log sessions, and track your training"
              redirect="/home"
            />
          )}
        </div>
      </div>
    </div>
  );
}
