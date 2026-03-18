"use client";

import { useState, useEffect } from "react";

export default function ConnectivityBanner() {
  const [online, setOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);

    function handleOnline() {
      setOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 2000);
      return () => clearTimeout(timer);
    }

    function handleOffline() {
      setOnline(false);
      setShowReconnected(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!online) {
    return (
      <div className="bg-amber-500/90 text-white text-center text-xs py-1.5 px-4 font-medium">
        You&apos;re offline &mdash; your sets are saved locally
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="bg-emerald-500/90 text-white text-center text-xs py-1.5 px-4 font-medium">
        Back online &mdash; syncing&hellip;
      </div>
    );
  }

  return null;
}
