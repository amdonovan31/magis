"use client";

import { useState, useEffect } from "react";

interface RestTimerProps {
  seconds: number;
  onDismiss: () => void;
}

export default function RestTimer({ seconds, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onDismiss();
      return;
    }
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining, onDismiss]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const progress = remaining / seconds;

  return (
    <div className="fixed bottom-20 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4">
      <div className="rounded-2xl bg-accent/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">Rest</span>
          <span className="text-2xl font-bold tabular-nums text-white">
            {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white hover:bg-white/30 transition-colors"
          >
            Skip
          </button>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
