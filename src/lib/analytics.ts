import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEvent =
  | "beat_view"
  | "beat_play"
  | "beat_like"
  | "beat_unlike"
  | "beat_comment"
  | "whatsapp_click"
  | "user_signup"
  | "user_login";

const SESSION_KEY = "db_session_id";

function sessionId() {
  if (typeof window === "undefined") return null;
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

const sent = new Set<string>();

/**
 * Fire-and-forget analytics. Never throws: a failed event must never break
 * playback, likes or navigation.
 */
export async function track(
  event: AnalyticsEvent,
  options: { beatId?: string | null; once?: boolean } = {},
) {
  try {
    if (typeof window === "undefined") return;
    const key = `${event}:${options.beatId ?? "-"}`;
    if (options.once) {
      if (sent.has(key)) return;
      sent.add(key);
    }
    const { data } = await supabase.auth.getSession();
    await supabase.from("analytics_events").insert({
      event_type: event,
      beat_id: options.beatId ?? null,
      user_id: data.session?.user.id ?? null,
      session_id: sessionId(),
    });
  } catch {
    /* analytics must stay silent */
  }
}
