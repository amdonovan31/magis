"use client";

import { useState } from "react";
import { completeProfile } from "@/lib/actions/auth.actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function OnboardingForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await completeProfile(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Full Name"
        name="full_name"
        type="text"
        autoComplete="name"
        placeholder="Your full name"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        required
      />
      <Input
        label="Confirm Password"
        name="confirm_password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        required
      />

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" fullWidth loading={loading} size="lg">
        Complete Setup
      </Button>
    </form>
  );
}
