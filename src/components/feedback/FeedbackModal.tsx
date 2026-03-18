"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { submitFeedback } from "@/lib/actions/logging.actions";
import { cn } from "@/lib/utils/cn";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultCategory?: Category;
}

type Category = "bug" | "confusion" | "suggestion" | "praise";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "bug", label: "Something's broken" },
  { key: "confusion", label: "This is confusing" },
  { key: "suggestion", label: "I have an idea" },
  { key: "praise", label: "This is great" },
];

const PLACEHOLDERS: Record<Category, string> = {
  bug: "What happened? What were you trying to do?",
  confusion: "What part was confusing or unclear?",
  suggestion: "What would make this better?",
  praise: "What did you love?",
};

export default function FeedbackModal({
  isOpen,
  onClose,
  onSuccess,
  defaultCategory = "bug",
}: FeedbackModalProps) {
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory);
      setError("");
    }
  }, [isOpen, defaultCategory]);

  function resetForm() {
    setMessage("");
    setCategory(defaultCategory);
    setError("");
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    const result = await submitFeedback({
      category,
      message: message.trim(),
      currentPage:
        typeof window !== "undefined" ? window.location.pathname : undefined,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    resetForm();
    onClose();
    onSuccess?.();
  }

  const canSubmit = message.trim().length >= 10 && !loading;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Feedback">
      <div className="flex flex-col gap-5 pb-4">
        {/* Category selector */}
        <div>
          <label className="text-sm font-medium text-primary">Category</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  category === c.key
                    ? "bg-accent text-accent-light"
                    : "border border-primary/10 bg-bg text-primary hover:border-primary/30"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium text-primary">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={PLACEHOLDERS[category]}
            rows={4}
            className={cn(
              "mt-2 w-full rounded-xl border border-primary/20 bg-surface px-4 py-3",
              "text-sm text-primary resize-none",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
              "placeholder:text-primary/25"
            )}
          />
          {message.length > 0 && message.trim().length < 10 && (
            <p className="mt-1 text-xs text-primary/40">
              {10 - message.trim().length} more characters needed
            </p>
          )}
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          loading={loading}
          fullWidth
          disabled={!canSubmit}
        >
          Send Feedback
        </Button>
      </div>
    </Modal>
  );
}
