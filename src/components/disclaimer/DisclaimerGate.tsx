"use client";

import { useState, useEffect } from "react";
import DisclaimerScreen from "@/components/disclaimer/DisclaimerScreen";
import { acceptDisclaimer } from "@/lib/disclaimer/actions";
import { LOCALSTORAGE_KEY } from "@/lib/disclaimer/constants";

interface DisclaimerGateProps {
  children: React.ReactNode;
  disclaimerAcceptedAt: string | null;
}

export default function DisclaimerGate({
  children,
  disclaimerAcceptedAt,
}: DisclaimerGateProps) {
  const [status, setStatus] = useState<"loading" | "accepted" | "pending">(
    "loading"
  );

  useEffect(() => {
    // Fast path: check localStorage first (no flicker for returning users)
    if (typeof window !== "undefined") {
      try {
        if (localStorage.getItem(LOCALSTORAGE_KEY)) {
          setStatus("accepted");
          return;
        }
      } catch {}
    }

    // Check server-provided value
    if (disclaimerAcceptedAt) {
      // Sync to localStorage for future fast path
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCALSTORAGE_KEY, disclaimerAcceptedAt);
        } catch {}
      }
      setStatus("accepted");
      return;
    }

    setStatus("pending");
  }, [disclaimerAcceptedAt]);

  if (status === "loading") return null;

  if (status === "accepted") return <>{children}</>;

  return (
    <div className="mx-auto w-full max-w-md min-h-screen bg-background px-4 py-8 flex items-center">
      <div className="w-full">
        <DisclaimerScreen
          onAccept={async () => {
            await acceptDisclaimer();
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(
                  LOCALSTORAGE_KEY,
                  new Date().toISOString()
                );
              } catch {}
            }
            setStatus("accepted");
          }}
        />
      </div>
    </div>
  );
}
