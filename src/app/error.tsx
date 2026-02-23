"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="w-full max-w-sm">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-xl font-bold text-primary mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-primary/60 mb-6">
          {error.message || "An unexpected error occurred."}
        </p>
        <Button onClick={reset} fullWidth>
          Try again
        </Button>
        <a
          href="/"
          className="mt-3 block text-sm text-primary/60 hover:text-primary"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
