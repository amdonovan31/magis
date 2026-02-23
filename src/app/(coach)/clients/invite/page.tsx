"use client";

import { useState } from "react";
import { inviteClient } from "@/lib/actions/auth.actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TopBar from "@/components/layout/TopBar";
import Link from "next/link";

export default function InviteClientPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("email", email);
    const result = await inviteClient(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setEmail("");
    }
    setLoading(false);
  }

  return (
    <>
      <TopBar
        title="Invite Client"
        left={
          <Link href="/clients" className="text-primary/60 hover:text-primary">
            ← Back
          </Link>
        }
      />
      <div className="px-4 pt-6">
        {success ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-green-50 p-6 text-center">
            <div className="text-4xl">✓</div>
            <p className="font-semibold text-green-800">Invite sent!</p>
            <p className="text-sm text-green-700">
              Your client will receive an email with a link to create their account.
            </p>
            <Button variant="secondary" onClick={() => setSuccess(false)}>
              Invite Another
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-primary/60">
              Enter your client&apos;s email address. They&apos;ll receive a magic link to
              create their account and be connected to you automatically.
            </p>
            <Input
              label="Client Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              required
            />
            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <Button type="submit" fullWidth loading={loading} size="lg">
              Send Invite
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
