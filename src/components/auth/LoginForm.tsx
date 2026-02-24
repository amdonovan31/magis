"use client";

import { useState } from "react";
import { signIn, sendMagicLink } from "@/lib/actions/auth.actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");

  async function handlePasswordSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleMagicLinkSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await sendMagicLink(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  }

  if (magicLinkSent) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-green-50 p-6 text-center">
        <div className="text-4xl">✓</div>
        <p className="font-semibold text-green-800">Check your email</p>
        <p className="text-sm text-green-700">
          We sent you a sign-in link. Click it to log in.
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            setMagicLinkSent(false);
            setMode("password");
          }}
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  if (mode === "magic") {
    return (
      <form action={handleMagicLinkSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth loading={loading} size="lg">
          Send Sign-In Link
        </Button>

        <button
          type="button"
          onClick={() => { setMode("password"); setError(null); }}
          className="text-center text-sm font-medium text-accent hover:underline"
        >
          Sign in with password instead
        </button>
      </form>
    );
  }

  return (
    <form action={handlePasswordSubmit} className="flex flex-col gap-4">
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
      />

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" fullWidth loading={loading} size="lg">
        Sign In
      </Button>

      <button
        type="button"
        onClick={() => { setMode("magic"); setError(null); }}
        className="text-center text-sm font-medium text-accent hover:underline"
      >
        Sign in with email link instead
      </button>
    </form>
  );
}
