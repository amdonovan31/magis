"use client";

import { useState } from "react";
import { updateProgramClient } from "@/lib/actions/program.actions";

interface AssignToMeButtonProps {
  programId: string;
  coachId: string;
  alreadyAssigned: boolean;
}

export default function AssignToMeButton({
  programId,
  coachId,
  alreadyAssigned,
}: AssignToMeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [assigned, setAssigned] = useState(alreadyAssigned);

  async function handleClick() {
    setLoading(true);
    const result = await updateProgramClient(programId, assigned ? null : coachId);
    if (!result?.error) setAssigned(!assigned);
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        assigned
          ? "border-primary/20 bg-primary/5 text-primary/50 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          : "border-accent/40 bg-accent/10 text-primary hover:bg-accent/20"
      }`}
    >
      {loading ? "…" : assigned ? "✓ Assigned to me — remove" : "Assign to me"}
    </button>
  );
}
