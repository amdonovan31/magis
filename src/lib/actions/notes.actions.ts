"use server";

import { createClient } from "@/lib/supabase/server";

export async function createNote(data: {
  client_id: string;
  coach_id: string;
  content: string;
  note_type: "post_session" | "client_message" | "coach_observation";
  session_log_id?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: inserted, error } = await supabase
    .from("client_notes")
    .insert({
      client_id: data.client_id,
      coach_id: data.coach_id,
      content: data.content,
      note_type: data.note_type,
      session_log_id: data.session_log_id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: inserted.id };
}

export async function recordClientView(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("coach_client_views")
    .upsert(
      { coach_id: user.id, client_id: clientId, viewed_at: new Date().toISOString() },
      { onConflict: "coach_id,client_id" }
    );
}
