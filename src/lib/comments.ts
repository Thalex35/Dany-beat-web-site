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

export const commentsByBeatQuery = (beatId: string) => ({
  queryKey: ["comments", beatId] as const,
  queryFn: async (): Promise<Comment[]> => {
    const { data, error } = await supabase
      .from("comments")
      .select(
        "id, beat_id, user_id, content, created_at, updated_at, profiles!inner(display_name, avatar_url)",
      )
      .eq("beat_id", beatId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      beat_id: row.beat_id,
      user_id: row.user_id,
      content: row.content,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author_name: (row.profiles as { display_name: string | null }).display_name,
      author_avatar_url: (row.profiles as { avatar_url: string | null }).avatar_url,
    }));
  },
});
