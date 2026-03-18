"use client";

import ErrorBoundary from "./ErrorBoundary";
import UnhandledRejectionHandler from "./UnhandledRejectionHandler";
import FeedbackButton from "@/components/feedback/FeedbackButton";

export default function BetaShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <UnhandledRejectionHandler />
      {children}
      <FeedbackButton />
    </ErrorBoundary>
  );
}
