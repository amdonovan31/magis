"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { switchActiveRole } from "@/lib/actions/role.actions";
import Card from "@/components/ui/Card";

interface Props {
  role: "coach" | "client" | "solo";
  title: string;
  description: string;
  redirect: string;
}

export default function RolePickerCard({ role, title, description, redirect }: Props) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  async function handleSelect() {
    setSwitching(true);
    const result = await switchActiveRole(role);
    if (result.error) {
      console.error("[RolePickerCard]", result.error);
      setSwitching(false);
      return;
    }
    const supabase = createClient();
    await supabase.auth.refreshSession();
    router.push(redirect);
    router.refresh();
  }

  return (
    <button onClick={handleSelect} disabled={switching} className="w-full text-left">
      <Card className="transition-all hover:border-accent/40 hover:shadow-md active:scale-[0.98]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-xl">
            {role === "coach" ? "🏋️" : "💪"}
          </div>
          <div className="min-w-0">
            <p className="font-heading text-lg font-semibold text-primary">{title}</p>
            <p className="text-sm text-muted">{description}</p>
          </div>
          {switching && (
            <span className="ml-auto shrink-0 text-xs text-muted">Loading…</span>
          )}
        </div>
      </Card>
    </button>
  );
}
