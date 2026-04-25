"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { CARDIO_MODALITIES } from "@/types/app.types";
import { cn } from "@/lib/utils/cn";
import { startFreeWorkout } from "@/lib/actions/session.actions";

interface FreeWorkoutPickerProps {
  activeFreeSessionId?: string | null;
}

type ConflictInfo = {
  existingSessionId: string;
  existingType: string;
  existingModality: string | null;
};

export default function FreeWorkoutPicker({ activeFreeSessionId }: FreeWorkoutPickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"type" | "modality">("type");
  const [isPending, startTransition] = useTransition();
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);

  if (activeFreeSessionId) {
    return (
      <Link href={`/free-workout/${activeFreeSessionId}`} className="block mt-3">
        <Button fullWidth variant="secondary" size="lg">
          Resume Free Workout &rarr;
        </Button>
      </Link>
    );
  }

  function handleResult(result: unknown) {
    if (result && typeof result === "object" && "conflict" in result) {
      const r = result as unknown as { existingSessionId: string; existingType: string; existingModality: string | null };
      setConflict(r);
    }
  }

  function handleStrength() {
    startTransition(async () => {
      const result = await startFreeWorkout("strength");
      handleResult(result);
    });
  }

  function handleCardio(modality: string) {
    startTransition(async () => {
      const result = await startFreeWorkout("cardio", modality);
      handleResult(result);
    });
  }

  function closeModal() {
    setShowModal(false);
    setConflict(null);
    setStep("type");
  }

  return (
    <>
      <div className="mt-3">
        <Button
          fullWidth
          variant="secondary"
          size="lg"
          onClick={() => { setStep("type"); setConflict(null); setShowModal(true); }}
        >
          Free Workout
        </Button>
      </div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={conflict ? "Workout In Progress" : step === "type" ? "Choose Workout Type" : "Choose Activity"}
      >
        {conflict ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <p className="text-sm text-primary">
              You have a free{" "}
              {conflict.existingType === "cardio"
                ? conflict.existingModality ?? "cardio"
                : "strength"}{" "}
              workout in progress.
            </p>
            <p className="text-xs text-muted">
              Complete or discard it before starting a new one.
            </p>
            <Link href={`/free-workout/${conflict.existingSessionId}`}>
              <Button size="lg">
                Resume Workout &rarr;
              </Button>
            </Link>
          </div>
        ) : step === "type" ? (
          <div className="flex flex-col gap-3 py-2">
            <button
              onClick={handleStrength}
              disabled={isPending}
              className="flex items-center gap-4 rounded-xl bg-primary/5 px-4 py-4 text-left hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              <span className="text-2xl">&#x1F3CB;&#xFE0F;</span>
              <div>
                <p className="font-semibold text-primary">Strength</p>
                <p className="text-xs text-primary/50">Log sets, reps &amp; weight</p>
              </div>
            </button>
            <button
              onClick={() => setStep("modality")}
              disabled={isPending}
              className="flex items-center gap-4 rounded-xl bg-primary/5 px-4 py-4 text-left hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              <span className="text-2xl">&#x1F3C3;</span>
              <div>
                <p className="font-semibold text-primary">Cardio</p>
                <p className="text-xs text-primary/50">Log time, distance &amp; heart rate</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 py-2">
            <button
              onClick={() => setStep("type")}
              className="text-xs text-primary/40 hover:text-primary self-start mb-1"
            >
              &larr; Back
            </button>
            <div className="grid grid-cols-2 gap-2">
              {CARDIO_MODALITIES.map((mod) => (
                <button
                  key={mod}
                  onClick={() => handleCardio(mod)}
                  disabled={isPending}
                  className={cn(
                    "rounded-xl bg-surface border border-primary/10 px-3 py-3 text-sm font-medium text-primary text-center transition-colors",
                    "hover:bg-primary/5 hover:border-primary/20 disabled:opacity-50"
                  )}
                >
                  {mod}
                </button>
              ))}
            </div>
            {isPending && (
              <p className="text-center text-xs text-primary/40 mt-2">Starting...</p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
