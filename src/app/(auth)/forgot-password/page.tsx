"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth.actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await requestPasswordReset(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src="/magis_logo_clean.svg" alt="Magis" style={{ height: 160 }} />
          <p
            className="font-body text-xs uppercase tracking-widest"
            style={{ color: "var(--color-muted)" }}
          >
            Reset your password
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              If an account with that email exists, we&apos;ve sent a reset
              link. Check your inbox.
            </p>
            <Link
              href="/login"
              className="text-sm font-medium text-[#1B2E4B] hover:underline"
            >
              &larr; Back to sign in
            </Link>
          </div>
        ) : (
          <form action={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-primary/60">
              Enter the email you signed up with and we&apos;ll send you a link
              to reset your password.
            </p>
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
              Send Reset Link
            </Button>

            <p className="text-center text-sm text-primary/60">
              <Link
                href="/login"
                className="font-medium text-[#1B2E4B] hover:underline"
              >
                &larr; Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
