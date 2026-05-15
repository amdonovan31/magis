"use client";

import { useState } from "react";
import PublishBar from "@/components/coach/PublishBar";
import Badge from "@/components/ui/Badge";

interface Props {
  programId: string;
  initialStatus: string;
  priorPublishedExists?: boolean;
  priorEndsOn?: string | null;
  todayISO: string;
}

function statusBadgeVariant(s: string): "success" | "warning" | "default" {
  if (s === "published") return "success";
  if (s === "scheduled") return "warning";
  return "default";
}
function statusBadgeLabel(s: string): string {
  if (s === "published") return "Published";
  if (s === "scheduled") return "Scheduled";
  if (s === "archived") return "Archived";
  return "Draft";
}

export default function ProgramDetailPublishBar({
  programId,
  initialStatus,
  priorPublishedExists = false,
  priorEndsOn = null,
  todayISO,
}: Props) {
  const [status, setStatus] = useState(initialStatus);

  return (
    <>
      <Badge variant={statusBadgeVariant(status)}>{statusBadgeLabel(status)}</Badge>
      <PublishBar
        programId={programId}
        status={status}
        onStatusChange={setStatus}
        priorPublishedExists={priorPublishedExists}
        priorEndsOn={priorEndsOn}
        todayISO={todayISO}
      />
    </>
  );
}
