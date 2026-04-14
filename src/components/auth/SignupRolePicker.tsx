"use client";

import { useState } from "react";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupRolePicker() {
  const [role, setRole] = useState<"coach" | "solo" | "client" | null>(null);

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
        <button
          onClick={() => setRole("client")}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-primary/15 bg-surface p-6 text-center transition-all hover:border-primary/40 active:scale-[0.98]"
        >
          <span className="text-3xl">👤</span>
          <span className="text-lg font-semibold text-primary">I Have a Coach</span>
          <span className="text-sm text-primary/60">Join your coach on Magis with their code</span>
        </button>
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
