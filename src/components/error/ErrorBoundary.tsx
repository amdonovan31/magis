"use client";

import React, { Component, useState } from "react";
import Button from "@/components/ui/Button";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import { logError } from "@/lib/actions/logging.actions";

/* ---------- ErrorFallback (functional) ---------- */

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

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
        <Button onClick={() => window.location.reload()} fullWidth>
          Reload page
        </Button>
        <button
          type="button"
          onClick={onReset}
          className="mt-3 block w-full text-sm text-primary/60 hover:text-primary"
        >
          Try again
        </button>
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

/* ---------- ErrorBoundary (class) ---------- */

interface Props {
  children: React.ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Fire-and-forget — logError never throws
    logError({
      errorMessage: error.message,
      errorStack: error.stack,
      component:
        this.props.componentName ?? errorInfo?.componentStack ?? undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback onReset={() => this.setState({ hasError: false })} />
      );
    }
    return this.props.children;
  }
}

/* ---------- withErrorBoundary HOC ---------- */

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary componentName={componentName}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  }
  WithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;
  return WithErrorBoundary;
}
