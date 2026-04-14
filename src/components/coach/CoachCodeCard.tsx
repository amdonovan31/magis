"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface CoachCodeCardProps {
  coachCode: string;
}

export default function CoachCodeCard({ coachCode }: CoachCodeCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(coachCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: user can manually select/copy from the display
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/40">
          Your Coach Code
        </p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-2xl font-bold font-mono tracking-wider text-primary">
            {coachCode}
          </p>
          <Button size="sm" variant="secondary" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <p className="text-xs text-primary/50">
          Share this code with clients so they can connect to you when signing up.
        </p>
      </div>
    </Card>
  );
}
