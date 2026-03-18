"use client";

import { useState } from "react";
import FeedbackModal from "./FeedbackModal";
import { Toast, ToastContainer, useToast } from "@/components/ui/Toast";

export default function FeedbackButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-muted/80 text-white shadow-md transition-opacity hover:opacity-90 active:opacity-80"
        aria-label="Send feedback"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      <FeedbackModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() =>
          addToast("Thanks — we read every piece of feedback", "success")
        }
      />

      <ToastContainer>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onDismiss={() => removeToast(t.id)}
          />
        ))}
      </ToastContainer>
    </>
  );
}
