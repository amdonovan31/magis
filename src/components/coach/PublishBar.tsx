"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { publishProgram, unpublishProgram } from "@/lib/actions/program.actions";

interface Props {
  programId: string;
  status: string;
  onStatusChange: (newStatus: string) => void;
}

export default function PublishBar({ programId, status, onStatusChange }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handlePublish() {
    setLoading(true);
    const res = await publishProgram(programId);
    setLoading(false);
    if (!res.error) {
      onStatusChange("published");
      setShowConfirm(false);
    }
  }

  async function handleUnpublish() {
    setLoading(true);
    const res = await unpublishProgram(programId);
    setLoading(false);
    if (!res.error) {
      onStatusChange("draft");
    }
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-primary/10 bg-background px-4 py-3 pb-safe">
        {status === "draft" ? (
          <Button
            fullWidth
            size="lg"
            onClick={() => setShowConfirm(true)}
          >
            Publish to Client
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Published
              </span>
              <span className="text-xs text-primary/40">Client can see this program</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleUnpublish}
              loading={loading}
            >
              Unpublish
            </Button>
          </div>
        )}
      </div>

      {/* Publish confirmation */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Publish Program?">
        <p className="mb-4 text-sm text-primary/60">
          This will make the program visible to the client. They&apos;ll be able to see all workouts and exercises.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            size="lg"
            onClick={handlePublish}
            loading={loading}
          >
            Publish
          </Button>
        </div>
      </Modal>
    </>
  );
}
