"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { formatDate, formatRelativeTime } from "@/lib/utils/date";
import { deleteSession } from "@/lib/actions/session.actions";
import { cn } from "@/lib/utils/cn";

const SWIPE_THRESHOLD = 60;

interface HistoryCardProps {
  session: {
    id: string;
    started_at: string | null;
    status: string;
    workout_template: { title: string } | null;
  };
}

export default function HistoryCard({ session }: HistoryCardProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [, startTransition] = useTransition();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSwipingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isSwipingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Only engage swipe if horizontal movement dominates
    if (!isSwipingRef.current && Math.abs(deltaX) > 10) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        isSwipingRef.current = true;
      } else {
        touchStartRef.current = null;
        return;
      }
    }

    if (!isSwipingRef.current) return;

    // Only allow swipe left (negative deltaX) to reveal delete
    setSwipeX(Math.min(0, Math.max(deltaX, -100)));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isSwipingRef.current) {
      touchStartRef.current = null;
      return;
    }

    if (swipeX < -SWIPE_THRESHOLD) {
      // Snap to fully revealed
      setSwipeX(-100);
    } else {
      setSwipeX(0);
    }

    touchStartRef.current = null;
    isSwipingRef.current = false;
  }, [swipeX]);

  function handleDeleteClick() {
    setConfirming(true);
  }

  function handleConfirmDelete() {
    startTransition(async () => {
      const result = await deleteSession(session.id);
      if (!result.error) {
        setDeleted(true);
        setConfirming(false);
      }
    });
  }

  function handleCancelDelete() {
    setConfirming(false);
    setSwipeX(0);
  }

  if (deleted) return null;

  const cardContent = (
    <Card className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-primary">
          {session.workout_template?.title ?? "Free Workout"}
        </p>
        {session.started_at && (
          <p className="text-sm text-primary/60">
            {formatDate(session.started_at)}
          </p>
        )}
        {session.started_at && (
          <p className="text-xs text-primary/40 mt-0.5">
            {formatRelativeTime(session.started_at)}
          </p>
        )}
      </div>
      <Badge
        variant={
          session.status === "completed"
            ? "success"
            : session.status === "skipped"
              ? "warning"
              : "default"
        }
      >
        {session.status}
      </Badge>
    </Card>
  );

  const inner =
    session.status === "completed" ? (
      <Link href={`/workout/${session.id}/summary`} className="block active:scale-[0.98] transition-transform">
        {cardContent}
      </Link>
    ) : (
      <div>{cardContent}</div>
    );

  return (
    <>
      <div
        className="relative overflow-hidden rounded-2xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Behind: Delete button */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <button
            type="button"
            onClick={handleDeleteClick}
            className="rounded-lg bg-red-500 text-white px-4 py-2 text-sm font-medium"
            aria-label="Delete workout"
          >
            Delete
          </button>
        </div>

        {/* Foreground: card */}
        <div
          className={cn("relative bg-background")}
          style={swipeX !== 0 ? { transform: `translateX(${swipeX}px)`, transition: "none" } : undefined}
        >
          {inner}
        </div>
      </div>

      {/* Confirmation modal */}
      <Modal
        isOpen={confirming}
        onClose={handleCancelDelete}
        title="Delete Workout?"
      >
        <p className="text-sm text-primary/70 mb-4">
          This will permanently delete the {session.workout_template?.title ?? "workout"}
          {session.started_at ? ` from ${formatDate(session.started_at)}` : ""}, including
          all logged sets, notes, and any personal records linked to it. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={handleCancelDelete}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth onClick={handleConfirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}
