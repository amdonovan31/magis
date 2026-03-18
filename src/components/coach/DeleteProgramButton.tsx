"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { deleteProgram } from "@/lib/actions/program.actions";

interface Props {
  programId: string;
  programName: string;
  clientName?: string | null;
  status: string;
}

export default function DeleteProgramButton({
  programId,
  programName,
  clientName,
  status,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPublished = status === "published";

  async function handleDelete() {
    setLoading(true);
    const res = await deleteProgram(programId);
    if (!res.error) {
      router.push("/programs");
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        variant="ghost"
        fullWidth
        className="text-red-600 hover:bg-red-50"
        onClick={() => setOpen(true)}
      >
        Delete Program
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Delete Program">
        <p className="mb-4 text-sm text-primary/70">
          {isPublished && clientName
            ? `This will remove "${programName}" from ${clientName}\u2019s workouts immediately. This cannot be undone.`
            : `Are you sure you want to delete "${programName}"?`}
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleDelete}
            loading={loading}
          >
            Delete program
          </Button>
        </div>
      </Modal>
    </>
  );
}
