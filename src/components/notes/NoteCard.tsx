import Badge from "@/components/ui/Badge";
import { formatRelativeTime, formatDate } from "@/lib/utils/date";
import type { ClientNoteRow } from "@/lib/queries/notes.queries";

const TYPE_LABELS: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "accent" }> = {
  post_session: { label: "Post-session", variant: "accent" },
  client_message: { label: "Client", variant: "default" },
  coach_observation: { label: "Coach", variant: "warning" },
};

interface NoteCardProps {
  note: ClientNoteRow;
  clientName?: string;
}

export default function NoteCard({ note }: NoteCardProps) {
  const typeInfo = TYPE_LABELS[note.note_type] ?? { label: note.note_type, variant: "default" as const };
  const isClientNote = note.note_type !== "coach_observation";

  return (
    <div className="flex gap-3 rounded-xl border border-primary/10 bg-surface px-4 py-3">
      {/* Author indicator */}
      <div className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${isClientNote ? "bg-[#1B2E4B]" : "bg-[#2C4A2E]"}`} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
          {note.session_log_id && note.session && (
            <span className="text-xs text-primary/40">
              Post-session &middot; {formatDate(note.session.started_at)}
            </span>
          )}
          <span className="ml-auto text-xs text-primary/40 flex-shrink-0">
            {formatRelativeTime(note.created_at)}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-primary whitespace-pre-wrap">{note.content}</p>
      </div>
    </div>
  );
}
