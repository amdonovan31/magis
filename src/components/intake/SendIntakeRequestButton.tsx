"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { sendIntakeRequest } from "@/lib/actions/intake.actions";

interface SendIntakeRequestButtonProps {
  clientId: string;
}

export default function SendIntakeRequestButton({ clientId }: SendIntakeRequestButtonProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await sendIntakeRequest(clientId);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-primary/60 italic">
        Intake request sent — waiting for client to complete.
      </p>
    );
  }

  return (
    <div>
      <Button variant="secondary" size="sm" loading={loading} onClick={handleClick}>
        Send Intake Request
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
