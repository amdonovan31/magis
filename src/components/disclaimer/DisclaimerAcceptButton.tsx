"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { acceptDisclaimer } from "@/lib/disclaimer/actions";
import { LOCALSTORAGE_KEY } from "@/lib/disclaimer/constants";

export default function DisclaimerAcceptButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    await acceptDisclaimer();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCALSTORAGE_KEY, new Date().toISOString());
      } catch {}
    }
    router.refresh();
  }

  return (
    <Button
      variant="primary"
      size="sm"
      loading={loading}
      onClick={handleAccept}
    >
      Accept Terms
    </Button>
  );
}
