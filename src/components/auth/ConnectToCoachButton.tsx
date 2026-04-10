"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { connectToCoach } from "@/lib/actions/auth.actions";

interface ConnectToCoachButtonProps {
  coachId: string;
  coachName: string;
}

export default function ConnectToCoachButton({ coachId, coachName }: ConnectToCoachButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await connectToCoach(coachId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/home");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Button fullWidth size="lg" loading={isPending} onClick={handleClick}>
        Connect with {coachName}
      </Button>
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
