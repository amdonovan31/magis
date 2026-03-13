"use client";

import { useState } from "react";
import SignupForm from "@/components/auth/SignupForm";
import Link from "next/link";

export default function SignupPage() {
  const [role, setRole] = useState<"coach" | "solo" | "client" | null>(null);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">Magis</h1>
          <p className="mt-2 text-sm text-primary/60">
            {role ? "Create your account" : "How are you training?"}
          </p>
        </div>

        {!role ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setRole("coach")}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-primary/15 bg-white p-6 text-center transition-all hover:border-primary/40 active:scale-[0.98]"
            >
              <span className="text-3xl">🏋️</span>
              <span className="text-lg font-semibold text-primary">I&apos;m a Coach</span>
              <span className="text-sm text-primary/60">Create programs for your clients</span>
            </button>
            <button
              onClick={() => setRole("client")}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-primary/15 bg-white p-6 text-center transition-all hover:border-primary/40 active:scale-[0.98]"
            >
              <span className="text-3xl">📋</span>
              <span className="text-lg font-semibold text-primary">I&apos;m a Client</span>
              <span className="text-sm text-primary/60">Follow a program assigned by my coach</span>
            </button>
            <button
              onClick={() => setRole("solo")}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-primary/15 bg-white p-6 text-center transition-all hover:border-primary/40 active:scale-[0.98]"
            >
              <span className="text-3xl">💪</span>
              <span className="text-lg font-semibold text-primary">I&apos;m Training Solo</span>
              <span className="text-sm text-primary/60">Get an AI-generated program just for you</span>
            </button>
          </div>
        ) : (
          <>
            <SignupForm role={role} />
            <button
              onClick={() => setRole(null)}
              className="mt-4 block w-full text-center text-sm text-primary/50 hover:text-primary"
            >
              ← Back to role selection
            </button>
          </>
        )}

        <p className="mt-4 text-center text-sm text-primary/60">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#1B2E4B] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
