"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import {
  publishProgram,
  scheduleProgram,
  unpublishProgram,
  cancelScheduledProgram,
} from "@/lib/actions/program.actions";

interface Props {
  programId: string;
  status: string;
  onStatusChange: (newStatus: string) => void;
  /**
   * If the client already has a currently-published program, the publish
   * action becomes "Schedule" — sets status='scheduled' with a future
   * starts_on, leaving the prior program running until the date arrives.
   */
  priorPublishedExists?: boolean;
  /**
   * The prior program's ends_on. Used to default the date picker to
   * prior.ends_on + 1 day. Falls back to today when absent.
   */
  priorEndsOn?: string | null;
}

function addOneDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PublishBar({
  programId,
  status,
  onStatusChange,
  priorPublishedExists = false,
  priorEndsOn = null,
}: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [startsOn, setStartsOn] = useState(() => {
    if (priorEndsOn) return addOneDay(priorEndsOn);
    return new Date().toISOString().split("T")[0];
  });

  const useScheduleFlow = priorPublishedExists && status === "draft";
  const todayISO = new Date().toISOString().split("T")[0];
  const dateValid = startsOn >= todayISO && (!priorEndsOn || startsOn >= priorEndsOn);

  async function handlePublishOrSchedule() {
    setLoading(true);
    const res = useScheduleFlow
      ? await scheduleProgram(programId, startsOn)
      : await publishProgram(programId, startsOn);
    setLoading(false);
    if (!res.error) {
      const newStatus = "scheduled" in res && res.scheduled ? "scheduled" : "published";
      onStatusChange(newStatus);
      setShowConfirm(false);
      const archived = "archivedProgramName" in res ? res.archivedProgramName : undefined;
      if (newStatus === "scheduled") {
        setToast(`Scheduled to start ${startsOn}.`);
      } else if (archived) {
        setToast(`Program published. ${archived} has been archived.`);
      } else {
        setToast("Program published.");
      }
      setTimeout(() => setToast(null), 5000);
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

  async function handleCancelScheduled() {
    setLoading(true);
    const res = await cancelScheduledProgram(programId);
    setLoading(false);
    if (!res.error) {
      onStatusChange("draft");
      setToast("Scheduled program cancelled. It's back to a draft.");
      setTimeout(() => setToast(null), 5000);
    } else {
      setToast(`Cancel failed: ${res.error}`);
      setTimeout(() => setToast(null), 5000);
    }
  }

  const buttonLabel = useScheduleFlow ? "Schedule for client" : "Publish to client";

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white shadow-lg max-w-sm text-center">
          {toast}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-primary/10 bg-background px-4 py-3 pb-safe">
        {status === "draft" ? (
          <Button
            fullWidth
            size="lg"
            onClick={() => setShowConfirm(true)}
          >
            {buttonLabel}
          </Button>
        ) : status === "scheduled" ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Scheduled
              </span>
              <span className="text-xs text-primary/40">Goes live on the start date</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancelScheduled}
              loading={loading}
            >
              Cancel
            </Button>
          </div>
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

      {/* Publish/Schedule confirmation */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title={useScheduleFlow ? "Schedule Program" : "Publish Program"}
      >
        <p className="mb-4 text-sm text-primary/60">
          {useScheduleFlow
            ? "This program will go live on the chosen start date. The client's current program keeps running until then."
            : "This will make the program visible to the client. They'll be able to see all workouts and exercises."}
        </p>
        <Input
          label="When should this program start?"
          type="date"
          value={startsOn}
          onChange={(e) => setStartsOn(e.target.value)}
          required
        />
        {priorEndsOn && (
          <p className="mt-1 text-xs text-primary/40">
            Default: the day after the prior program ends ({addOneDay(priorEndsOn)}).
          </p>
        )}
        {!dateValid && (
          <p className="mt-2 text-xs text-red-600">
            Start date must be today or later
            {priorEndsOn ? `, and not before the prior program ends (${priorEndsOn})` : ""}.
          </p>
        )}
        <div className="mt-4 flex gap-3">
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
            onClick={handlePublishOrSchedule}
            loading={loading}
            disabled={!startsOn || !dateValid}
          >
            {useScheduleFlow ? "Schedule" : "Publish"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
