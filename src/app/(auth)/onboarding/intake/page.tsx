import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import IntakeForm from "@/components/intake/IntakeForm";

export default async function IntakePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if intake already submitted
  const { data: existing } = await supabase
    .from("client_intake")
    .select("id")
    .eq("client_id", user.id)
    .limit(1)
    .single();

  if (existing) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-bold text-primary">
            Magis
          </h1>
          <p className="mt-2 text-sm text-muted">
            Let&apos;s get to know you so we can build your perfect program.
          </p>
        </div>
        <IntakeForm />
      </div>
    </div>
  );
}
