"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatDateRange, formatShort } from "@/lib/utils/program-lifecycle";
import { formatProgramNoteLine, type ProgramNote } from "@/lib/utils/program-notes";

interface Props {
  clientId: string;
  priorProgram: {
    title: string;
    starts_on: string;
    ends_on: string;
  };
  notes: ProgramNote[];
}

export default function ProgressionGenerateEntry({ clientId, priorProgram, notes }: Props) {
  const router = useRouter();
  const [coachInstructions, setCoachInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      // The progression-mode generator looks up the client's most recent coach
      // guidelines server-side; we don't need a guidelinesId here. Reuse the
      // standard loading screen by routing through the existing /generate
      // entry — pass the progression flag + instructions in URL query so the
      // GeneratingScreen knows to invoke progression mode.
      const params = new URLSearchParams({ mode: "progression" });
      if (coachInstructions.trim()) params.set("instructions", coachInstructions.trim());
      router.push(`/clients/${clientId}/generate/loading?${params.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start generation");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-24">
      <Card>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/40">
          Prior Block
        </p>
        <p className="font-semibold text-primary mt-0.5">{priorProgram.title}</p>
        <p className="text-xs text-primary/50 mt-0.5">
          {formatDateRange(priorProgram.starts_on, priorProgram.ends_on)}
        </p>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/40 mb-2">
          Client Notes from Prior Block
        </p>
        {notes.length === 0 ? (
          <p className="text-sm text-primary/40 italic">No notes logged in this block.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto flex flex-col gap-1.5">
            {notes.map((n, i) => (
              <p key={i} className="text-xs text-primary/80 font-mono leading-snug">
                {formatProgramNoteLine(n)}
              </p>
            ))}
          </div>
        )}
        {notes.length > 0 && (
          <p className="mt-2 text-[10px] text-primary/40">
            Showing {notes.length} note{notes.length === 1 ? "" : "s"}, oldest first. All
            will be passed to the AI.
          </p>
        )}
      </Card>

      <Card>
        <label className="block text-xs font-semibold uppercase tracking-widest text-primary/40 mb-2">
          Instructions for this generation (optional)
        </label>
        <textarea
          value={coachInstructions}
          onChange={(e) => setCoachInstructions(e.target.value)}
          rows={5}
          placeholder="e.g. swap day 2 and 3, add a 4th day for hypertrophy volume, drop the deload, client wants to push"
          className="w-full rounded-xl border border-primary/20 bg-surface p-3 text-sm text-primary placeholder:text-primary/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1.5 text-[10px] text-primary/40">
          Used for this generation only. Persistent per-client overrides live in Coach
          Guidelines.
        </p>
      </Card>

      {error && (
        <Card className="border border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      <Button fullWidth size="lg" onClick={handleGenerate} disabled={loading}>
        {loading ? "Starting..." : `Generate Next Program (${formatShort(priorProgram.ends_on)} → ?)`}
      </Button>
    </div>
  );
}
