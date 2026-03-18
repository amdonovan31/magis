"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";
import { switchDevRole } from "@/lib/actions/dev.actions";

const ROLES = [
  { value: "coach" as const, label: "Coach", icon: "🏋️", redirect: "/dashboard" },
  { value: "client" as const, label: "Client", icon: "📋", redirect: "/home" },
  { value: "solo" as const, label: "Solo", icon: "💪", redirect: "/home" },
];

export default function DevRoleSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  async function handleSwitch(role: "coach" | "client" | "solo", redirect: string) {
    setSwitching(role);
    const result = await switchDevRole(role);
    if (result.error) {
      logger.error("DevRoleSwitcher switch failed", { error: result.error });
      setSwitching(null);
      return;
    }
    // Refresh the session so the new role lands in the JWT
    const supabase = createClient();
    await supabase.auth.refreshSession();
    router.push(redirect);
    router.refresh();
    setSwitching(null);
    setOpen(false);
  }

  return (
    <div className="fixed bottom-20 right-3 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="rounded-2xl border border-primary/20 bg-white shadow-lg overflow-hidden">
          <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-primary/40">
            Dev — Switch Role
          </p>
          {ROLES.map(({ value, label, icon, redirect }) => (
            <button
              key={value}
              onClick={() => handleSwitch(value, redirect)}
              disabled={switching !== null}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-50 last:pb-2.5"
            >
              <span>{icon}</span>
              <span>{label}</span>
              {switching === value && (
                <span className="ml-auto text-xs text-primary/40">switching…</span>
              )}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-1.5 rounded-full border border-primary/20 bg-white px-3 shadow-md text-xs font-semibold text-primary/60 hover:text-primary transition-colors"
      >
        <span className="text-accent font-bold">DEV</span>
        <span>{open ? "▾" : "▴"}</span>
      </button>
    </div>
  );
}
