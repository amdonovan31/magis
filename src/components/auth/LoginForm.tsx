"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth.actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
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

      <div className="flex justify-end -mt-2">
        <Link
          href="/forgot-password"
          className="text-xs font-medium text-[#1B2E4B] hover:underline"
        >
          Forgot your password?
        </Link>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" fullWidth loading={loading} size="lg">
        Sign In
      </Button>

      <p className="text-center text-sm text-primary/60">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-[#1B2E4B] hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
