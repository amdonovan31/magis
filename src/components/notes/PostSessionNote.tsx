"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { createNote } from "@/lib/actions/notes.actions";

interface PostSessionNoteProps {
  clientId: string;
  coachId: string;
  sessionId: string;
}

export default function PostSessionNote({
  clientId,
  coachId,
  sessionId,
}: PostSessionNoteProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);
    setError("");

    const result = await createNote({
      client_id: clientId,
      coach_id: coachId,
      content: content.trim(),
      note_type: "post_session",
      session_log_id: sessionId,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-primary/10 bg-surface px-4 py-5 text-center">
        <p className="text-sm font-medium text-primary">Sent to your coach</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/10 bg-surface px-4 py-5">
      <p className="text-sm text-primary/60 mb-3">
        How did that feel? Anything to flag for your coach?
      </p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Optional — skip if nothing to note"
        rows={3}
        className="w-full resize-none rounded-lg border border-primary/10 bg-background px-3 py-2.5 text-sm text-primary placeholder:text-primary/30 focus:border-primary/30 focus:outline-none"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {content.trim() && (
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          loading={loading}
          onClick={handleSubmit}
          className="mt-3"
        >
          Send to coach
        </Button>
      )}
    </div>
  );
}
