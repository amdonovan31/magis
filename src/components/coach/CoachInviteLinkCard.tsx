"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface CoachInviteLinkCardProps {
  inviteUrl: string;
}

export default function CoachInviteLinkCard({ inviteUrl }: CoachInviteLinkCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input so user can copy manually
    }
  }

  return (
    <Card padding="md">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/40">
        Your invite link
      </p>
      <p className="mt-1 text-xs text-primary/60">
        Share this link directly with clients. They&apos;ll be connected to you
        automatically when they sign up or log in.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={inviteUrl}
          readOnly
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 rounded-lg border border-primary/15 bg-surface px-3 py-2 text-xs text-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Button size="sm" variant="secondary" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
    </Card>
  );
}
