"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { saveWorkoutFromSession, saveWorkoutFromTemplate } from "@/lib/actions/saved-workout.actions";

interface SaveWorkoutSheetProps {
  sessionId: string;
  suggestedTitle: string;
  source: "custom" | "program";
  templateId?: string;
  programTitle?: string;
  onSaved?: () => void;
  onDismiss: () => void;
}

export default function SaveWorkoutSheet({
  sessionId,
  suggestedTitle,
  source,
  templateId,
  programTitle,
  onSaved,
  onDismiss,
}: SaveWorkoutSheetProps) {
  const [title, setTitle] = useState(suggestedTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      setError("Please enter a name for this workout");
      return;
    }

    setSaving(true);
    setError(null);

    let result;
    if (source === "program" && templateId) {
      result = await saveWorkoutFromTemplate(templateId, programTitle ?? "", title.trim());
    } else {
      result = await saveWorkoutFromSession(sessionId, title.trim());
    }

    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    onSaved?.();
  }

  if (saved) {
    return (
      <Modal isOpen onClose={onDismiss} title="Saved!">
        <div className="flex flex-col items-center gap-3 py-4">
          <span className="text-3xl">&#x2705;</span>
          <p className="text-sm text-primary/60">
            &quot;{title}&quot; added to your Library
          </p>
          <Button fullWidth onClick={onDismiss}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onDismiss} title="Save to Library">
      <div className="flex flex-col gap-4 py-2">
        <Input
          label="Workout Name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Upper Body Push"
        />

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button fullWidth onClick={handleSave} loading={saving}>
          Save to Library
        </Button>

        <button
          onClick={onDismiss}
          className="text-center text-sm text-primary/50 hover:text-primary"
        >
          Skip
        </button>
      </div>
    </Modal>
  );
}
