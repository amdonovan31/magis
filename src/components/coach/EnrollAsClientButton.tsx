"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addRoleToProfile } from "@/lib/actions/role.actions";
import { switchActiveRole } from "@/lib/actions/role.actions";
import Button from "@/components/ui/Button";

export default function EnrollAsClientButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll() {
    setLoading(true);
    setError(null);

    // Add client role to profile
    const addResult = await addRoleToProfile("client");
    if (addResult.error) {
      setError(addResult.error);
      setLoading(false);
      return;
    }

    // Switch active role to client
    const switchResult = await switchActiveRole("client");
    if (switchResult.error) {
      setError(switchResult.error);
      setLoading(false);
      return;
    }

    // Refresh session to pick up new role
    const supabase = createClient();
    await supabase.auth.refreshSession();

    // Redirect to intake form
    router.push("/onboarding/intake");
    router.refresh();
  }

  return (
    <div>
      <Button
        onClick={handleEnroll}
        disabled={loading}
        variant="secondary"
        fullWidth
      >
        {loading ? "Setting up…" : "Start Training as a Client"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
