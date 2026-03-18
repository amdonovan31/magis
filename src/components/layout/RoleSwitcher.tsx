"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";
import { switchActiveRole } from "@/lib/actions/role.actions";

interface Props {
  currentRole: "coach" | "client" | "solo";
  availableRoles: string[];
}

export default function RoleSwitcher({ currentRole, availableRoles }: Props) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  // Only show if user has multiple roles
  if (availableRoles.length <= 1) return null;

  const otherRole = currentRole === "coach"
    ? (availableRoles.includes("client") ? "client" : "solo") as "client" | "solo"
    : "coach" as const;

  const otherLabel = otherRole === "coach" ? "Coach" : "Client";
  const redirect = otherRole === "coach" ? "/dashboard" : "/home";

  async function handleSwitch() {
    setSwitching(true);
    const result = await switchActiveRole(otherRole);
    if (result.error) {
      logger.error("RoleSwitcher switch failed", { error: result.error });
      setSwitching(false);
      return;
    }
    const supabase = createClient();
    await supabase.auth.refreshSession();
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="fixed bottom-24 left-4 z-50">
      <button
        onClick={handleSwitch}
        disabled={switching}
        className="flex h-9 items-center gap-1.5 rounded-full border border-primary/20 bg-white px-3 shadow-md text-xs font-semibold text-primary/70 hover:text-primary transition-colors disabled:opacity-50"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        <span>{switching ? "Switching…" : `Switch to ${otherLabel}`}</span>
      </button>
    </div>
  );
}
