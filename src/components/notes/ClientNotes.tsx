"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import NoteCard from "@/components/notes/NoteCard";
import { createNote } from "@/lib/actions/notes.actions";
import type { ClientNoteRow } from "@/lib/queries/notes.queries";

interface ClientNotesProps {
  clientId: string;
  coachId: string;
  initialNotes: ClientNoteRow[];
}

export default function ClientNotes({
  clientId,
  coachId,
  initialNotes,
}: ClientNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);
    setError("");

    const result = await createNote({
      client_id: clientId,
      coach_id: coachId,
      content: content.trim(),
      note_type: "coach_observation",
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // Optimistically add the note to the list
    const newNote: ClientNoteRow = {
      id: result.id!,
      client_id: clientId,
      coach_id: coachId,
      content: content.trim(),
      note_type: "coach_observation",
      session_log_id: null,
      created_at: new Date().toISOString(),
      session: null,
    };

    setNotes((prev) => [newNote, ...prev]);
    setContent("");
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Add note form */}
      <div className="rounded-xl border border-primary/10 bg-surface px-4 py-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note about this client..."
          rows={2}
          className="w-full resize-none rounded-lg border border-primary/10 bg-background px-3 py-2.5 text-sm text-primary placeholder:text-primary/30 focus:border-primary/30 focus:outline-none"
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        <div className="mt-2 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            loading={loading}
            disabled={!content.trim()}
            onClick={handleSubmit}
          >
            Add Note
          </Button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-sm text-primary/40 italic">No notes yet.</p>
      ) : (
        notes.map((note) => <NoteCard key={note.id} note={note} />)
      )}
    </div>
  );
}
