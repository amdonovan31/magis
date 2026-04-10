"use client";

import { useState } from "react";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupRolePicker() {
  const [role, setRole] = useState<"coach" | "solo" | null>(null);

  if (!role) {
    return (
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setRole("coach")}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-primary/15 bg-surface p-6 text-center transition-all hover:border-primary/40 active:scale-[0.98]"
        >
          <span className="text-3xl">🏋️</span>
          <span className="text-lg font-semibold text-primary">I&apos;m a Coach</span>
          <span className="text-sm text-primary/60">Create programs for your clients</span>
        </button>
        <button
          onClick={() => setRole("solo")}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-primary/15 bg-surface p-6 text-center transition-all hover:border-primary/40 active:scale-[0.98]"
        >
          <span className="text-3xl">💪</span>
          <span className="text-lg font-semibold text-primary">I&apos;m Training Solo</span>
          <span className="text-sm text-primary/60">Get an AI-generated program just for you</span>
        </button>
        <p className="mt-2 text-center text-sm text-primary/50">
          Are you a client? Ask your coach to send you an invite.
        </p>
      </div>
    );
  }

  return (
    <>
      <SignupForm role={role} />
      <button
        onClick={() => setRole(null)}
        className="mt-4 block w-full text-center text-sm text-primary/50 hover:text-primary"
      >
        ← Back to role selection
      </button>
    </>
  );
}
