"use server";

import type { Json } from "@/types/database.types";
import { createClient } from "@/lib/supabase/server";

interface LogErrorInput {
  errorMessage: string;
  errorStack?: string;
  component?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logs an error to the error_logs table. Never throws — always fails silently.
 * Callers should fire-and-forget (do not await in hot paths).
 */
export async function logError(input: LogErrorInput): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let role: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      role = profile?.role ?? null;
    }

    await supabase.from("error_logs").insert({
      user_id: user?.id ?? null,
      role,
      error_message: input.errorMessage,
      error_stack: input.errorStack ?? null,
      component: input.component ?? null,
      url: input.url ?? null,
      metadata: (input.metadata ?? null) as Json,
    });
  } catch {
    // Error logging must never cause a secondary error
  }
}

interface SubmitFeedbackInput {
  category: "bug" | "confusion" | "suggestion" | "praise";
  message: string;
  currentPage?: string;
  appVersion?: string;
}

/**
 * Submits user feedback. Returns success/error for UI feedback.
 */
export async function submitFeedback(
  input: SubmitFeedbackInput
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    role: profile?.role ?? null,
    category: input.category,
    message: input.message,
    current_page: input.currentPage ?? null,
    app_version:
      input.appVersion ?? process.env.NEXT_PUBLIC_APP_VERSION ?? null,
  });

  if (error) {
    return { error: "Failed to submit feedback. Please try again." };
  }

  return { success: true };
}
