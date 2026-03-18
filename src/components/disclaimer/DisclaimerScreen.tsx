"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { signOut } from "@/lib/actions/auth.actions";
import {
  DISCLAIMER_HEADLINE,
  DISCLAIMER_BODY,
  DECLINE_MESSAGE,
  ACCEPT_LABEL,
  DECLINE_LABEL,
} from "@/lib/disclaimer/constants";

interface DisclaimerScreenProps {
  onAccept: () => void | Promise<void>;
  alreadyAccepted?: boolean;
}

export default function DisclaimerScreen({
  onAccept,
  alreadyAccepted,
}: DisclaimerScreenProps) {
  const [countdown, setCountdown] = useState(alreadyAccepted ? 0 : 3);
  const [declined, setDeclined] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (alreadyAccepted || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [alreadyAccepted, countdown]);

  async function handleAccept() {
    setAccepting(true);
    await onAccept();
    setAccepting(false);
  }

  const buttonsDisabled = countdown > 0;

  // Already accepted (back-navigation) — show text + continue
  if (alreadyAccepted) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-bold text-primary text-center">
          {DISCLAIMER_HEADLINE}
        </h2>
        <p className="text-sm text-primary/70 leading-relaxed whitespace-pre-line">
          {DISCLAIMER_BODY}
        </p>
        <Button fullWidth size="lg" onClick={handleAccept} loading={accepting}>
          Continue
        </Button>
      </div>
    );
  }

  // Declined view
  if (declined) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-bold text-primary text-center">
          {DISCLAIMER_HEADLINE}
        </h2>
        <p className="text-sm text-primary/70 leading-relaxed whitespace-pre-line">
          {DISCLAIMER_BODY}
        </p>
        <p className="text-sm text-primary/60 leading-relaxed">
          {DECLINE_MESSAGE}
        </p>
        <Button fullWidth size="lg" onClick={() => setDeclined(false)}>
          Go back and accept
        </Button>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full text-center text-sm text-primary/50 hover:text-primary/70 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  // Default view with countdown
  const acceptText =
    countdown > 0 ? `I understand (${countdown})` : ACCEPT_LABEL;
  const declineText =
    countdown > 0 ? `I'd rather not (${countdown})` : DECLINE_LABEL;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-primary text-center">
        {DISCLAIMER_HEADLINE}
      </h2>
      <p className="text-sm text-primary/70 leading-relaxed whitespace-pre-line">
        {DISCLAIMER_BODY}
      </p>
      <div className="flex flex-col gap-3">
        <Button
          fullWidth
          size="lg"
          disabled={buttonsDisabled}
          loading={accepting}
          onClick={handleAccept}
        >
          {acceptText}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          disabled={buttonsDisabled}
          onClick={() => setDeclined(true)}
        >
          {declineText}
        </Button>
      </div>
    </div>
  );
}
