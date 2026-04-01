"use client";

import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";

interface UnitToggleProps {
  unit: "kg" | "lbs";
  onChange: (unit: "kg" | "lbs") => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  function handleToggle(newUnit: "kg" | "lbs") {
    if (newUnit === unit) return;
    onChange(newUnit);

    // Fire-and-forget save to profile
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .update({ preferred_unit: newUnit })
        .eq("id", user.id)
        .then(() => {});
    });
  }

  return (
    <div className="flex rounded-xl border border-primary/10 overflow-hidden">
      <button
        type="button"
        onClick={() => handleToggle("lbs")}
        className={cn(
          "px-3 py-1.5 text-xs font-medium transition-colors",
          unit === "lbs"
            ? "bg-accent text-accent-light"
            : "bg-bg text-primary hover:bg-primary/5"
        )}
      >
        lbs
      </button>
      <button
        type="button"
        onClick={() => handleToggle("kg")}
        className={cn(
          "px-3 py-1.5 text-xs font-medium transition-colors",
          unit === "kg"
            ? "bg-accent text-accent-light"
            : "bg-bg text-primary hover:bg-primary/5"
        )}
      >
        kg
      </button>
    </div>
  );
}
