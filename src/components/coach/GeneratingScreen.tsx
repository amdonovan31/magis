"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface GeneratingScreenProps {
  clientId: string;
  clientName: string;
  guidelinesId: string;
}

export default function GeneratingScreen({
  clientId,
  clientName,
  guidelinesId,
}: GeneratingScreenProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const generate = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/generate-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, guidelinesId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "An unexpected error occurred.");
        setStatus("error");
        return;
      }

      // Save program to localStorage for the review page
      localStorage.setItem("pending_program", JSON.stringify(data.program));
      localStorage.setItem("pending_program_client_id", clientId);

      router.push(`/clients/${clientId}/generate/review`);
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }, [clientId, guidelinesId, router]);

  useEffect(() => {
    generate();
  }, [generate]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
        <Image
          src="/magis_logo_clean.svg"
          alt="Magis"
          width={120}
          height={120}
          priority
          className="mb-8 opacity-40"
        />

        <h1 className="mb-2 text-center font-heading text-2xl font-semibold text-primary">
          Something went wrong
        </h1>

        <p className="mb-8 max-w-xs text-center text-sm text-muted">
          {errorMessage}
        </p>

        <button
          onClick={generate}
          className="rounded-xl bg-accent px-8 py-3 text-sm font-semibold uppercase tracking-widest text-accent-light transition-opacity active:opacity-80"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
      {/* Logo */}
      <Image
        src="/magis_logo_clean.svg"
        alt="Magis"
        width={120}
        height={120}
        priority
        className="mb-8"
      />

      {/* Spinner */}
      <div className="mb-8 h-10 w-10 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />

      {/* Heading */}
      <h1 className="mb-2 text-center font-heading text-2xl font-semibold text-primary">
        Building {clientName}&apos;s program&hellip;
      </h1>

      {/* Subtext */}
      <p className="text-center text-xs uppercase tracking-widest text-muted">
        This usually takes 15–30 seconds.
      </p>
    </div>
  );
}
