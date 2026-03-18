"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import { logError } from "@/lib/actions/logging.actions";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    // Fire-and-forget — logError never throws
    logError({
      errorMessage: error.message,
      errorStack: error.stack,
      url: typeof window !== "undefined" ? window.location.href : "",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="w-full max-w-sm">
        <p className="text-4xl mb-4">&#9888;&#65039;</p>
        <h2 className="text-xl font-bold text-primary mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-primary/60 mb-6">
          We&apos;ve been notified and will fix it.
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
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="mt-2 block w-full text-sm text-primary/60 hover:text-primary underline"
        >
          Report this issue
        </button>
      </div>

      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        defaultCategory="bug"
      />
    </div>
  );
}
