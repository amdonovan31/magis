"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface RestTimerProps {
  seconds: number;
  onDismiss: () => void;
}

export default function RestTimer({ seconds, onDismiss }: RestTimerProps) {
  const endTimeRef = useRef(Date.now() + seconds * 1000);
  const [remaining, setRemaining] = useState(seconds);

  // Reset end time when seconds prop changes (new rest period)
  useEffect(() => {
    endTimeRef.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
  }, [seconds]);

  const recompute = useCallback(() => {
    const left = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
    setRemaining(left);
    if (left <= 0) {
      onDismiss();
    }
  }, [onDismiss]);

  // Tick using absolute end time — survives phone lock / tab backgrounding
  useEffect(() => {
    const timer = setInterval(recompute, 250);
    return () => clearInterval(timer);
  }, [recompute]);

  // Immediately recompute when tab becomes visible again
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        recompute();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [recompute]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const progress = seconds > 0 ? remaining / seconds : 0;

  return (
    <div className="fixed bottom-20 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4">
      <div className="rounded-2xl bg-[#1B2E4B]/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#FAF9F6]">Rest</span>
          <span className="text-2xl font-bold tabular-nums text-[#FAF9F6]">
            {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full bg-[#FAF9F6]/20 px-3 py-1 text-xs font-medium text-[#FAF9F6] hover:bg-[#FAF9F6]/30 transition-colors"
          >
            Skip
          </button>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-all duration-300 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
