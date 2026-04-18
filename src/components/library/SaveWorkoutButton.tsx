"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import SaveWorkoutSheet from "./SaveWorkoutSheet";

interface SaveWorkoutButtonProps {
  sessionId: string;
  suggestedTitle: string;
  source: "custom" | "program";
  templateId?: string;
  programTitle?: string;
}

export default function SaveWorkoutButton({
  sessionId,
  suggestedTitle,
  source,
  templateId,
  programTitle,
}: SaveWorkoutButtonProps) {
  const [showSheet, setShowSheet] = useState(false);
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <p className="text-center text-sm text-green-600 font-medium py-2">
        &#x2705; Saved to Library
      </p>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        fullWidth
        onClick={() => setShowSheet(true)}
      >
        Save to Library
      </Button>

      {showSheet && (
        <SaveWorkoutSheet
          sessionId={sessionId}
          suggestedTitle={suggestedTitle}
          source={source}
          templateId={templateId}
          programTitle={programTitle}
          onSaved={() => setSaved(true)}
          onDismiss={() => setShowSheet(false)}
        />
      )}
    </>
  );
}
