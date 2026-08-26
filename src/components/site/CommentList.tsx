import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, ErrorState, Skeleton, Spinner } from "@/components/ui/states";
import { useAuth } from "@/lib/auth";
import { commentsByBeatQuery } from "@/lib/comments";
import { formatTimeAgo } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export function CommentList({ beatId }: { beatId: string }) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments, isPending, isError, refetch } = useQuery(commentsByBeatQuery(beatId));

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", beatId] });
      queryClient.invalidateQueries({ queryKey: ["beat-stats"] });
      toast.success("Comment deleted.");
    },
    onError: () => {
      toast.error("Could not delete the comment.");
    },
  });

  if (isPending) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState description="We couldn't load the comments." onRetry={() => void refetch()} />
    );
  }

  if (comments.length === 0) {
    return (
      <EmptyState
        title="No comments yet"
        description="Be the first to share your thoughts on this beat."
      />
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((c) => {
        const canDelete = isAdmin || c.user_id === user?.id;
        return (
          <li key={c.id} className="panel flex flex-col gap-2 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {c.author_avatar_url ? (
                  <img
                    src={c.author_avatar_url}
                    alt=""
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid size-7 place-items-center rounded-full bg-surface-2 text-[10px] font-medium uppercase text-muted-foreground">
                    {(c.author_name ?? "?")[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{c.author_name ?? "Anonymous"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatTimeAgo(c.created_at)}
                    {c.updated_at !== c.created_at ? " (edited)" : ""}
                  </p>
                </div>
              </div>
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(c.id)}
                  disabled={deleteMutation.isPending}
                  aria-label="Delete comment"
                  className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-destructive disabled:opacity-50"
                >
                  {deleteMutation.isPending && deleteMutation.variables === c.id ? (
                    <Spinner className="size-3.5" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </button>
              ) : null}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {c.content}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
