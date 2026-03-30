"use client";

import { useState } from "react";
import PublishBar from "@/components/coach/PublishBar";
import Badge from "@/components/ui/Badge";

interface Props {
  programId: string;
  initialStatus: string;
}

export default function ProgramDetailPublishBar({ programId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);

  return (
    <>
      <Badge variant={status === "published" ? "success" : "warning"}>
        {status === "published" ? "Published" : "Draft"}
      </Badge>
      <PublishBar programId={programId} status={status} onStatusChange={setStatus} />
    </>
  );
}
