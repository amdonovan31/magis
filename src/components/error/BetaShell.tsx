"use client";

import { useEffect } from "react";
import ErrorBoundary from "./ErrorBoundary";
import UnhandledRejectionHandler from "./UnhandledRejectionHandler";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import { pruneOldSessions } from "@/lib/workout-persistence";

export default function BetaShell({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    pruneOldSessions();
  }, []);

  return (
    <ErrorBoundary>
      <UnhandledRejectionHandler />
      {children}
      <FeedbackButton />
    </ErrorBoundary>
  );
}
