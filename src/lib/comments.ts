import { supabase } from "@/integrations/supabase/client";

export type Comment = {
  id: string;
  beat_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name: string | null;
  author_avatar_url: string | null;
};

export const COMMENT_MIN = 1;
export const COMMENT_MAX = 1000;

export function validateComment(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < COMMENT_MIN) return "Comment cannot be empty.";
  if (value.length > COMMENT_MAX) return `Comment must be ${COMMENT_MAX} characters or fewer.`;
  return null;
}

type CommentRow = {
  id: string;
  beat_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export const commentsByBeatQuery = (beatId: string) => ({
  queryKey: ["comments", beatId] as const,
  queryFn: async (): Promise<Comment[]> => {
    const { data, error } = await supabase
      .from("comments")
      .select("id, beat_id, user_id, content, created_at, updated_at")
      .eq("beat_id", beatId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const rows = (data ?? []) as CommentRow[];
    if (rows.length === 0) return [];

    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);
    if (profileError) throw profileError;

    const profileMap = new Map<string, ProfileRow>();
    for (const p of (profileData ?? []) as ProfileRow[]) {
      profileMap.set(p.id, p);
    }

    return rows.map((row) => {
      const profile = profileMap.get(row.user_id);
      return {
        id: row.id,
        beat_id: row.beat_id,
        user_id: row.user_id,
        content: row.content,
        created_at: row.created_at,
        updated_at: row.updated_at,
        author_name: profile?.display_name ?? null,
        author_avatar_url: profile?.avatar_url ?? null,
      };
    });
  },
});
