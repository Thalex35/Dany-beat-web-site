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
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

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
    return (data ?? []).map((row) => {
      const r = row as unknown as CommentRow;
      return {
        id: r.id,
        beat_id: r.beat_id,
        user_id: r.user_id,
        content: r.content,
        created_at: r.created_at,
        updated_at: r.updated_at,
        author_name: r.profiles?.display_name ?? null,
        author_avatar_url: r.profiles?.avatar_url ?? null,
      };
    });
  },
});
